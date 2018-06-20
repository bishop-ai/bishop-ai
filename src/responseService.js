var nlp = require("./nlp/nlp");
var Response = require("./response");

var responseService = {};

responseService.getResponses = function (template) {
    var responses = [];

    if (template instanceof Array) {
        var i;
        for (i = 0; i < template.length; i++) {
            responses = responses.concat(this.getResponses(template[i]));
        }
    } else {
        var builder = new responseService.Builder(template);
        responses = builder.getResponses();
    }

    return responses;
};

responseService.getBestResponse = function (responses) {
    console.log("Choosing 1 of " + responses.length + " responses.");

    // First shuffle the array so that any items with the same weight will appear with the same frequency
    responses = nlp.shuffle(responses.slice(0));

    // Get the sum of the weights
    var sumOfWeights = responses.reduce(function(memo, response) {
        return memo + response.weight;
    }, 0);

    // Get a random weighted response
    var getRandom = function (sumOfWeights) {
        var random = Math.floor(Math.random() * (sumOfWeights + 1));

        return function (response) {
            random -= response.weight;
            return random <= 0;
        };
    };

    return responses.find(getRandom(sumOfWeights));
};

responseService.getUnknownResponse = function (inputExpression) {
    var template = "[I'm sorry,] ((I'm not sure I|I don't) understand [what (you mean [by '" + inputExpression.value + "']|you're saying [when you say, '" + inputExpression.value + "'])]|I didn't quite get that).";
    var responses = this.getResponses(template);

    var res = [];
    var i;
    for (i = 0; i < responses.length; i++) {
        res.push(new Response(responses[i]));
    }

    return this.getBestResponse(res);
};

responseService.Builder = function (template) {
    var string = (typeof template === "string") ? template : template.value || "";
    this.expectations = (typeof template === "string") ? [] : template.expectations || [];
    this.weight = (typeof template === "string") ? "" : template.weight || 0;
    this.tokens = responseService.Builder.lex(string);
    this.tree = responseService.Builder.buildParseTree(this.tokens);
    this.getInputsFunction = responseService.Builder.parseGetInputs(this.tree);
};

responseService.Builder.prototype.getResponses = function () {
    var responses = [];
    var inputs = [];
    this.getInputsFunction(inputs);

    var i;
    var input;
    for (i = 0; i < inputs.length; i++) {
        input = inputs[i].join(" ").replace(/\s+([.,!:?;])/g, "$1");
        responses.push(new Response(input, this.expectations, this.weight));
    }

    return responses;
};

responseService.Builder.parseGetInputs = function (tree) {
    var getInputsFunction;
    var getInputsFunctions;

    var i;
    switch (tree.op) {
    case "start":
        getInputsFunctions = [];
        for (i = 0; i < tree.values.length; i++) {
            getInputsFunctions.push(responseService.Builder.parseGetInputs(tree.values[i]));
        }

        getInputsFunction = function (inputs) {
            var i;

            if (inputs.length === 0) {
                inputs.push([]);
            }

            // Append each piece of text onto each input
            for (i = 0; i < this.length; i++) {
                this[i](inputs);
            }

        }.bind(getInputsFunctions);
        break;
    case "[":
        getInputsFunctions = [];
        for (i = 0; i < tree.values.length; i++) {
            getInputsFunctions.push(responseService.Builder.parseGetInputs(tree.values[i]));
        }

        getInputsFunction = function (inputs) {
            var i;
            var a;

            // Keep the original set of inputs without the optional tree values and create a duplicate set of inputs that does have the tree values.
            // Merge the two together.
            var alternateInputs = responseService.Builder.deepClone(inputs);
            for (i = 0; i < this.length; i++) {
                this[i](alternateInputs);
            }

            for (a = 0; a < alternateInputs.length; a++) {
                inputs.push(alternateInputs[a]);
            }

        }.bind(getInputsFunctions);
        break;
    case "(":
        var getInputsFunctionGroups = [];
        var innerArray = null;
        for (i = 0; i < tree.values.length; i++) {
            if (tree.values[i].op === "|") {
                innerArray = null;
            } else {
                if (innerArray === null) {
                    innerArray = [];
                    getInputsFunctionGroups.push(innerArray);
                }

                innerArray.push(responseService.Builder.parseGetInputs(tree.values[i]));
            }
        }

        getInputsFunction = function (inputs) {
            var i;
            var g;
            var a;
            var alternatesToAdd = [];
            var alternateInputs;

            // For each alternate, create a duplicate set of inputs that contain the alternate tree
            for (g = 1; g < this.length; g++) {
                alternateInputs = responseService.Builder.deepClone(inputs);
                alternatesToAdd.push(alternateInputs);

                for (i = 0; i < this[g].length; i++) {
                    this[g][i](alternateInputs);
                }
            }

            // for the first function, add onto the original set
            for (i = 0; i < this[0].length; i++) {
                this[0][i](inputs);
            }

            // Merge the sets together
            for (a = 0; a < alternatesToAdd.length; a++) {
                for (i = 0; i < alternatesToAdd[a].length; i++) {
                    inputs.push(alternatesToAdd[a][i]);
                }
            }

        }.bind(getInputsFunctionGroups);
        break;
    case "text":
        getInputsFunction = function (inputs) {
            var i;
            var a;

            // Append each piece of text onto each input
            for (a = 0; a < inputs.length; a++) {
                for (i = 0; i < this.length; i++) {
                    inputs[a].push(this[i]);
                }
            }

        }.bind(tree.values);
        break;
    }

    return getInputsFunction;
};

responseService.Builder.lex = function (input) {
    var tokens = [];

    var i;
    var text = "";
    for (i = 0; i < input.length; i++) {

        switch (input[i]) {
        case "[":
        case "]":
        case "(":
        case ")":
        case "|":
            if (text.length > 0) {
                if (text.trim().length > 0) {
                    tokens.push({type: "text", value: text.trim()});
                }
                text = "";
            }
            tokens.push({ type: "op", value: input[i] });
            break;
        default:
            text += input[i];
        }
    }

    if (text.length > 0) {
        if (text.trim().length > 0) {
            tokens.push({type: "text", value: text.trim()});
        }
        text = "";
    }

    return tokens;
};

responseService.Builder.buildParseTree = function (tokens, op) {
    var tree = {
        op: op || "start",
        values: []
    };

    var token;
    var stopLoop = false;

    while (tokens.length > 0) {
        token = tokens.shift();

        if (token.type === "op") {

            switch (token.value) {
            case "[":
            case "(":
                tree.values.push(responseService.Builder.buildParseTree(tokens, token.value));
                break;
            case "|":
                tree.values.push({op: "|", values: []});
                break;
            case "]":
            case ")":
                stopLoop = true;
                break;
            default:
                tree.values.push({
                    op: "text",
                    values: token.value.split(" ")
                });
            }

        } else {
            tree.values.push({
                op: "text",
                values: token.value.split(" ")
            });
        }

        if (stopLoop) {
            break;
        }
    }

    return tree;
};

responseService.Builder.deepClone = function (array) {
    return JSON.parse(JSON.stringify(array));
};

module.exports = responseService;