var nlp = require('../nlp');
var Response = require('./response');

var responseBuilder = {};

responseBuilder.getResponses = function (template) {
    var responses = [];

    if (template instanceof Array) {
        var i;
        for (i = 0; i < template.length; i++) {
            responses = responses.concat(this.getResponses(template[i]));
        }
    } else {
        var builder = new responseBuilder.Builder(template);
        responses = builder.getResponses();
    }

    return responses;
};

responseBuilder.Builder = function (template) {
    var string = (typeof template === "string") ? template : template.value || "";
    this.context = (typeof template === "string") ? "" : template.context || "";
    this.weight = (typeof template === "string") ? "" : template.weight || 0;
    this.tokens = responseBuilder.Builder.lex(string);
    this.tree = responseBuilder.Builder.buildParseTree(this.tokens);
    this.getInputsFunction = responseBuilder.Builder.parseGetInputs(this.tree);
};

responseBuilder.Builder.prototype.getResponses = function () {
    var responses = [];
    var inputs = [];
    this.getInputsFunction(inputs);

    var i;
    var input;
    for (i = 0; i < inputs.length; i++) {
        input = inputs[i].join(" ").replace(/\s+([.,!:?;])/g, "$1");
        responses.push(new Response(input, this.context, this.weight));
    }

    return responses;
};

responseBuilder.Builder.parseGetInputs = function (tree) {
    var getInputsFunction;
    var getInputsFunctions;

    var i;
    switch (tree.op) {
    case "start":
        getInputsFunctions = [];
        for (i = 0; i < tree.values.length; i++) {
            getInputsFunctions.push(responseBuilder.Builder.parseGetInputs(tree.values[i]));
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
            getInputsFunctions.push(responseBuilder.Builder.parseGetInputs(tree.values[i]));
        }

        getInputsFunction = function (inputs) {
            var i;
            var a;

            // Keep the original set of inputs without the optional tree values and create a duplicate set of inputs that does have the tree values.
            // Merge the two together.
            var alternateInputs = responseBuilder.Builder.deepClone(inputs);
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

                innerArray.push(responseBuilder.Builder.parseGetInputs(tree.values[i]));
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
                alternateInputs = responseBuilder.Builder.deepClone(inputs);
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

responseBuilder.Builder.lex = function (input) {
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

responseBuilder.Builder.buildParseTree = function (tokens, op) {
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
                tree.values.push(responseBuilder.Builder.buildParseTree(tokens, token.value));
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

responseBuilder.Builder.deepClone = function (array) {
    return JSON.parse(JSON.stringify(array));
};

module.exports = responseBuilder;