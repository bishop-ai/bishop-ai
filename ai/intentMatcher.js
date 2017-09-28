var nlp = require('../nlp');

var intentMatcher = {};

intentMatcher.matchInputToIntent = function (input, matchers) {
    var result = {
        intent: "",
        confidence: 0
    };

    var tokens = nlp.tokenize(input);

    var i;
    var matchAmount;
    for (i = 0; i < matchers.length; i++) {
        matchAmount = matchers[i].matchesInput(tokens);

        if (matchAmount >= 0) {
            result.intent = matchers[i].intent;
            result.confidence = matchAmount / tokens.length;
            break;
        }
    }

    return result;
};

intentMatcher.getInputs = function (matchers) {
    var result = [];

    var i;
    var phrases;
    var p;
    for (i = 0; i < matchers.length; i++) {
        phrases = matchers[i].getInputs();

        for (p = 0; p < phrases.length; p++) {
            result.push({
                value: phrases[p],
                trigger: matchers[i].intent,
                context: matchers[i].context
            });
        }
    }

    return result;
};

intentMatcher.Matcher = function (input, intent, context) {
    this.intent = intent;
    this.context = context || "";
    this.tokens = intentMatcher.Matcher.lex(input);
    this.tree = intentMatcher.Matcher.buildParseTree(this.tokens);
    this.matchFunction = intentMatcher.Matcher.parseMatchesFunction(this.tree);
    this.getInputsFunction = intentMatcher.Matcher.parseGetInputs(this.tree);
};

intentMatcher.Matcher.prototype.matchesInput = function (inputTokens) {
    return this.matchFunction(inputTokens);
};

intentMatcher.Matcher.prototype.getInputs = function () {
    var stringInputs = [];
    var inputs = [];
    this.getInputsFunction(inputs);

    var i;
    for (i = 0; i < inputs.length; i++) {
        stringInputs.push(inputs[i].join(" "));
    }

    return stringInputs;
};

intentMatcher.Matcher.parseGetInputs = function (tree) {
    var getInputsFunction;
    var getInputsFunctions;

    var i;
    switch (tree.op) {
    case "start":
        getInputsFunctions = [];
        for (i = 0; i < tree.values.length; i++) {
            getInputsFunctions.push(intentMatcher.Matcher.parseGetInputs(tree.values[i]));
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
            getInputsFunctions.push(intentMatcher.Matcher.parseGetInputs(tree.values[i]));
        }

        getInputsFunction = function (inputs) {
            var i;
            var a;

            // Keep the original set of inputs without the optional tree values and create a duplicate set of inputs that does have the tree values.
            // Merge the two together.
            var alternateInputs = intentMatcher.Matcher.deepClone(inputs);
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

                innerArray.push(intentMatcher.Matcher.parseGetInputs(tree.values[i]));
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
                alternateInputs = intentMatcher.Matcher.deepClone(inputs);
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
    case "*":
        getInputsFunction = function (inputs) {
            var i;
            for (i = 0; i < inputs.length; i++) {
                inputs[i].push("*");
            }
        };
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

intentMatcher.Matcher.parseMatchesFunction = function (tree, nextNode) {
    var matchesFunction;

    var i;
    var matchFunctions;

    switch (tree.op) {
    case "start":
        matchFunctions = [];
        for (i = 0; i < tree.values.length; i++) {
            matchFunctions.push(intentMatcher.Matcher.parseMatchesFunction(tree.values[i], tree.values[i + 1]));
        }

        // Every tree value must return a good value
        matchesFunction = function (inputTokens) {
            inputTokens = intentMatcher.Matcher.deepClone(inputTokens); // Clone

            var i;
            var advance = 0;
            var a;
            for (i = 0; i < this.length; i++) {

                // If there are more tree values but there are no more input tokens, return -1 indicating the match failed.
                if (inputTokens.length === 0) {
                    if (tree.values[i].op === "*" || tree.values[i].op === "[") {
                        continue;
                    }
                    return -1;
                }

                a = this[i](inputTokens);

                // If the input did not match, return -1 indicating the required match failed.
                if (a === -1) {
                    return -1;
                }

                inputTokens.splice(0, a);
                advance += a;
            }

            return advance;
        }.bind(matchFunctions);
        break;
    case "[":
        matchFunctions = [];
        for (i = 0; i < tree.values.length; i++) {
            matchFunctions.push(intentMatcher.Matcher.parseMatchesFunction(tree.values[i], tree.values[i + 1]));
        }

        // Tree values don't have to return a good value
        matchesFunction = function (inputTokens) {
            inputTokens = intentMatcher.Matcher.deepClone(inputTokens); // Clone

            var i;
            var advance = 0;
            var a;
            for (i = 0; i < this.length; i++) {
                a = this[i](inputTokens);

                // If the input did not match, return 0 indicating the optional match was not found.
                if (a === -1) {
                    return 0;
                }

                inputTokens.splice(0, a);
                advance += a;
            }

            return advance;
        }.bind(matchFunctions);
        break;
    case "(":
        var matchFunctionGroups = [];
        var innerArray = null;
        for (i = 0; i < tree.values.length; i++) {
            if (tree.values[i].op === "|") {
                innerArray = null;
            } else {
                if (innerArray === null) {
                    innerArray = [];
                    matchFunctionGroups.push(innerArray);
                }

                innerArray.push(intentMatcher.Matcher.parseMatchesFunction(tree.values[i], tree.values[i + 1]));
            }
        }

        matchesFunction = function (inputTokens) {
            var i;
            var g;
            var a;
            var advance;
            var maxAdvance = 0;
            var tokensClone;

            // Find the alternate the matches the most of the input.
            for (g = 0; g < this.length; g++) {
                advance = 0;
                tokensClone = intentMatcher.Matcher.deepClone(inputTokens);
                for (i = 0; i < this[g].length; i++) {
                    a = this[g][i](tokensClone);

                    if (a === -1) {
                        advance = a;
                        break;
                    }

                    tokensClone.splice(0, a);
                    advance += a;
                }
                maxAdvance = Math.max(maxAdvance, advance);
            }

            // If no alternate matches the input, return -1.
            if (maxAdvance === 0) {
                return -1;
            }

            return maxAdvance;
        }.bind(matchFunctionGroups);
        break;
    case "*":
        matchesFunction = function (inputTokens) {
            var i;

            var clone = intentMatcher.Matcher.deepClone(inputTokens);

            var matcher = null;
            if (nextNode) {
                matcher = intentMatcher.Matcher.parseMatchesFunction(nextNode);

                // Advance to the next token that matches
                for (i = 0; i < clone.length; i++) {
                    if (matcher && matcher(clone.slice(i)) > 0) {
                        break;
                    }
                }
            } else {
                i = clone.length;
            }

            inputTokens.slice(i);

            return i;
        };
        break;
    case "text":
        matchesFunction = function (inputTokens) {

            // If there is more text to match against than there is input, return -1 indicating match failed.
            if (this.length > inputTokens.length) {
                return -1;
            }

            var advance = 0;

            var i;
            for (i = 0; i < this.length; i++) {
                if (inputTokens[i].toLowerCase() === this[i].toLowerCase()) {
                    advance++;
                } else {

                    // If the text does not match, return -1.
                    return -1;
                }
            }

            return advance;
        }.bind(tree.values);
        break;
    }

    return matchesFunction;
};

intentMatcher.Matcher.lex = function (input) {
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
        case "*":
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

intentMatcher.Matcher.buildParseTree = function (tokens, op) {
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
                tree.values.push(intentMatcher.Matcher.buildParseTree(tokens, token.value));
                break;
            case "|":
                tree.values.push({op: "|", values: []});
                break;
            case "*":
                tree.values.push({
                    op: token.value,
                    values: []
                });
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

intentMatcher.Matcher.deepClone = function (array) {
    return JSON.parse(JSON.stringify(array));
};

module.exports = intentMatcher;