var nlp = require("./nlp/nlp");

var intentService = {};

intentService.matchInputToIntent = function (input, matchers) {
    var result = {
        intent: "",
        confidence: 0
    };

    var tokens = nlp.tokenize(input);

    var i;
    var matchResult;
    for (i = 0; i < matchers.length; i++) {
        matchResult = matchers[i].matchesInput(tokens);

        if (matchResult.amountMatched >= 0) {
            result.intent = matchers[i].intent;
            result.confidence = matchResult.amountMatched / tokens.length;
            result.namedWildcards = matchResult.namedWildcards || {};
            break;
        }
    }

    return result;
};

intentService.getInputs = function (matchers) {
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
                expectations: matchers[i].expectations
            });
        }
    }

    return result;
};

intentService.Matcher = function (input, intent, expectations) {
    this.intent = intent;
    this.expectations = expectations || [];
    this.tokens = intentService.Matcher.lex(input);
    this.tree = intentService.Matcher.buildParseTree(this.tokens.slice(0));
    this.specificity = intentService.Matcher.getSpecificity(this.tree);
    this.matchFunction = intentService.Matcher.parseMatchesFunction(this.tree);
    this.getInputsFunction = intentService.Matcher.parseGetInputs(this.tree);
};

intentService.Matcher.prototype.matchesInput = function (inputTokens) {
    var namedWildcards = {};
    var result = this.matchFunction(inputTokens, namedWildcards);
    return {
        amountMatched: result,
        namedWildcards: namedWildcards
    };
};

intentService.Matcher.prototype.getInputs = function () {
    var stringInputs = [];
    var inputs = [];
    this.getInputsFunction(inputs);

    var i;
    for (i = 0; i < inputs.length; i++) {
        stringInputs.push(inputs[i].join(" "));
    }

    return stringInputs;
};

intentService.Matcher.parseGetInputs = function (tree) {
    var getInputsFunction;
    var getInputsFunctions;

    var i;
    switch (tree.op) {
    case "start":
        getInputsFunctions = [];
        for (i = 0; i < tree.values.length; i++) {
            getInputsFunctions.push(intentService.Matcher.parseGetInputs(tree.values[i]));
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
            getInputsFunctions.push(intentService.Matcher.parseGetInputs(tree.values[i]));
        }

        getInputsFunction = function (inputs) {
            var i;
            var a;

            // Keep the original set of inputs without the optional tree values and create a duplicate set of inputs that does have the tree values.
            // Merge the two together.
            var alternateInputs = intentService.Matcher.deepClone(inputs);
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

                innerArray.push(intentService.Matcher.parseGetInputs(tree.values[i]));
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
                alternateInputs = intentService.Matcher.deepClone(inputs);
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
    case "wildcard":
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

intentService.Matcher.parseMatchesFunction = function (tree) {
    var matchesFunction;

    var i;
    var matchFunctions;

    if (!tree) {
        return function () {return -1;};
    }

    switch (tree.op) {
    case "start":
        matchFunctions = [];
        for (i = 0; i < tree.values.length; i++) {
            matchFunctions.push(intentService.Matcher.parseMatchesFunction(tree.values[i]));
        }

        // Every tree value must return a good value
        matchesFunction = function (inputTokens, namedWildcards) {
            inputTokens = intentService.Matcher.deepClone(inputTokens); // Clone

            var i;
            var advance = 0;
            var a;
            for (i = 0; i < this.length; i++) {

                // If there are more tree values but there are no more input tokens, return -1 indicating the match failed.
                if (inputTokens.length === 0) {
                    if (tree.values[i].op === "wildcard" || tree.values[i].op === "[") {
                        continue;
                    }
                    return -1;
                }

                a = this[i](inputTokens, namedWildcards);

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
            matchFunctions.push(intentService.Matcher.parseMatchesFunction(tree.values[i]));
        }

        // Tree values don't have to return a good value
        matchesFunction = function (inputTokens, namedWildcards) {
            inputTokens = intentService.Matcher.deepClone(inputTokens); // Clone

            var i;
            var advance = 0;
            var a;
            for (i = 0; i < this.length; i++) {
                a = this[i](inputTokens, namedWildcards);

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

                innerArray.push(intentService.Matcher.parseMatchesFunction(tree.values[i]));
            }
        }

        matchesFunction = function (inputTokens, namedWildcards) {
            var i;
            var g;
            var a;
            var advance;
            var maxAdvance = 0;
            var tokensClone;

            // Find the alternate the matches the most of the input.
            for (g = 0; g < this.length; g++) {
                advance = 0;
                tokensClone = intentService.Matcher.deepClone(inputTokens);
                for (i = 0; i < this[g].length; i++) {
                    a = this[g][i](tokensClone, namedWildcards);

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
    case "wildcard":

        var binder = {
            wildcardName: tree.values[0]
        };

        // Need to reconstruct the entire tree with the parts that have been matched already removed from the tree
        // This allows using lookahead to find the least amount of text to match the wildcard
        var constructRemainingTree = function (parent, index) {

            // Reconstruct the parent tree
            var newParent = {
                op: parent.op,
                values: [],
                index: 0,
                getParent: null
            };

            var getParent = function () { return this; };

            // Add the remaining values in the parent tree
            if (parent.values.length > index + 1) {
                newParent.values = parent.values.slice(index + 1);

                var i;
                for (i = 0; i < newParent.values.length; i++) {
                    newParent.values[i].index = i;
                    newParent.values[i].getParent = getParent.bind(newParent);
                }
            }

            if (parent.getParent) {
                return constructRemainingTree(parent.getParent(), parent.index);
            } else {
                return newParent;
            }
        };

        if (tree.getParent) {
            var remainingTree = constructRemainingTree(tree.getParent(), tree.index);
            binder.matcher = intentService.Matcher.parseMatchesFunction(remainingTree);
        }

        matchesFunction = function (inputTokens, namedWildcards) {
            var i;

            var clone = intentService.Matcher.deepClone(inputTokens);

            if (this.matcher) {

                // Advance to the next token that matches
                for (i = 0; i < clone.length; i++) {
                    if (this.matcher && this.matcher(clone.slice(i), []) > 0) {
                        break;
                    }
                }
            } else {
                i = clone.length;
            }

            if (this.wildcardName && this.wildcardName !== "*" && i > 0) {
                namedWildcards[this.wildcardName] = inputTokens.slice(0, i).join(" ");
            }

            inputTokens.slice(i);

            return i;
        }.bind(binder);
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

intentService.Matcher.getSpecificity = function (tree) {
    var specificity = 0;

    var i;

    if (!tree) {
        return function () {return specificity;};
    }

    switch (tree.op) {
    case "start":

        // Add the point values of each tree value.
        for (i = 0; i < tree.values.length; i++) {
            specificity += intentService.Matcher.getSpecificity(tree.values[i]);
        }

        break;
    case "wildcard":
    case "[":

        // There are no points for optional matches or wildcards and no need to recurse into the structure
        break;
    case "(":

        // Find the lowest alternative points and add them to the total.
        var minSpec = null;
        var spec = 0;

        // Add each value together, once at a '|' or at the end get the minimum value between the sum and minSpec
        for (i = 0; i < tree.values.length; i++) {
            if (tree.values[i].op === "|") {
                if (minSpec === null) {
                    minSpec = spec;
                } else {
                    minSpec = Math.min(minSpec, spec);
                }
                spec = 0;
            } else {
                spec += intentService.Matcher.getSpecificity(tree.values[i]);
            }

            if (i === tree.values.length - 1) {
                if (minSpec === null) {
                    minSpec = spec;
                } else {
                    minSpec = Math.min(minSpec, spec);
                }
            }
        }

        if (minSpec !== null) {
            specificity += minSpec;
        }

        break;
    case "text":

        // Each word matched adds one point
        specificity += tree.values.length;
        break;
    }

    return specificity;
};

intentService.Matcher.lex = function (input) {
    var tokens = [];

    var i;
    var text = "";
    var namedWildcard = false;

    var checkAndAddTextToken = function () {
        if (text.length > 0) {
            if (text.trim().length > 0) {
                if (namedWildcard) {
                    tokens[tokens.length - 1].value = text.trim();
                    namedWildcard = false;
                } else {
                    tokens.push({type: "text", value: text.trim()});
                }
            }
            text = "";
        }
    };

    for (i = 0; i < input.length; i++) {

        switch (input[i]) {
        case "[":
        case "]":
        case "(":
        case ")":
        case "|":
            checkAndAddTextToken();
            tokens.push({ type: "op", value: input[i] });
            break;
        case "*":
            checkAndAddTextToken();
            tokens.push({ type: "wildcard", value: input[i] });
            break;
        default:
            if (namedWildcard === true) {
                if (input[i] === " ") {
                    checkAndAddTextToken();
                }
            } else if (tokens.length > 0 && tokens[tokens.length - 1].type === "wildcard" && tokens[tokens.length - 1].value === "*" && input[i] !== " " && text.length === 0) {
                namedWildcard = true;
            }

            text += input[i];
            break;
        }
    }

    checkAndAddTextToken();

    return tokens;
};

intentService.Matcher.buildParseTree = function (tokens, op) {
    var tree = {
        op: op || "start",
        values: [],
        index: 0,
        getParent: null
    };

    var token;
    var stopLoop = false;

    var getParent = function () {
        return this;
    };

    var index = 0;

    while (tokens.length > 0) {
        token = tokens.shift();

        if (token.type === "op") {

            switch (token.value) {
            case "[":
            case "(":
                var subTree = intentService.Matcher.buildParseTree(tokens, token.value);
                subTree.getParent = getParent.bind(tree);
                subTree.index = index++;
                tree.values.push(subTree);
                break;
            case "|":
                tree.values.push({op: "|", values: [], getParent: getParent.bind(tree), index: index++});
                break;
            case "]":
            case ")":
                stopLoop = true;
                break;
            default:
                tree.values.push({
                    op: "text",
                    values: token.value.split(" "),
                    getParent: getParent.bind(tree),
                    index: index++
                });
            }

        } else if (token.type === "wildcard") {
            tree.values.push({
                op: token.type,
                values: [token.value],
                getParent: getParent.bind(tree),
                index: index++
            });
        } else {
            tree.values.push({
                op: "text",
                values: token.value.split(" "),
                getParent: getParent.bind(tree),
                index: index++
            });
        }

        if (stopLoop) {
            break;
        }
    }

    return tree;
};

intentService.Matcher.deepClone = function (array) {
    return JSON.parse(JSON.stringify(array));
};

module.exports = intentService;