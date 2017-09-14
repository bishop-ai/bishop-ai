var fs = require("fs");
var path = require("path");
var $q = require('q');

var Expression = require('./expression');
var Intent = require('./intent');
var Response = require('./response');
var memory = require('./memory');
var nlp = require('./../nlp');

var Brain = function () {

    // Keep track of the transcript. This should allow for repetition checking for both the user and the AI. This should
    // help prevent the AI from repeating a response to frequently. Also, when the user repeats the same thing multiple
    // times, the AI can respond differently.
    this._transcript = [];

    // Entity extractors are used to create named entities from parts of the input. These are then passed into the module
    // intent conditions and triggers to help perform actions and/or return responses. For example, a date/time extractor
    // might be used to create a Date object that represents a spoken date ("The fifth of January"). This date object can
    // then be used throughout the process to provide a more accurate experience.
    this._entityExtractors = {};

    // Modules are add on components that register triggers and intents. The intents are matched using the input. The trigger
    // registered for the matching intent is then called to perform an action and/or return a response.
    this._modules = {};

    // Intents are registered by modules. Intents represent a value to match the input on, a condition to validate the match
    // and either a trigger to act on or static responses. All intents must provide a value. If a trigger is set, the
    // registered trigger will be called. If there is no trigger, but there are static responses, one of the responses
    // will be used. If there is not condition is present, the match will not be validated and only the scored confidence
    // will be used to select the match.
    this._intents = [];

    // Just like triggers are registered for a module, so are conditions. Conditions are used to determine if a matched
    // expression is valid for the provided input. When matching expressions, there may be multiple matches. The matches
    // are scored and sorted to find the most accurate match. The best match is found by taking the sorted matches and
    // checking the condition. If there is no condition or the condition returns true, the match is used otherwise the
    // next highest scoring match is tested against its condition.
    this._conditions = {};

    // Triggers are registered by the module. The module then registers intents which correspond to a given trigger
    // When the intent is matched to the input, the registered trigger referenced by the matched intent is called and
    // can provide a response.
    this._triggers = {};

    this._context = "";

    this._initializeEntities();
    this._initializeModules();
};

Brain.prototype.processExpression = function (input) {
    var dfd = $q.defer();

    var inputExpression = new Expression(input);
    inputExpression.process();

    var inputEntities = this._extractExpressionEntities(inputExpression);

    var self = this;
    var handleMatch = function (bestMatch) {
        if (bestMatch && bestMatch.confidence > 0.5) {
            return self._handleBestMatch(bestMatch, inputExpression, inputEntities);
        } else {
            return self._handleUnknownMatch(inputExpression);
        }
    };

    var matchedExpression = this._getBestMatch(inputExpression, inputEntities);
    handleMatch(matchedExpression).then(function (response) {
        self._setContext(response.context);

        var data = {
            input: inputExpression,
            entities: inputEntities,
            match: matchedExpression,
            response: response.value,
            context: self._context
        };

        console.log(JSON.stringify({
            input: data.input.value,
            match: data.match.intent.value,
            module: data.match.intent.namespace,
            confidence: data.match.confidence,
            entities: data.entities,
            trigger: data.match.intent.expression.trigger,
            response: data.response,
            context: data.context
        }, null, "  "));

        self._transcript.push(inputExpression.value);
        self._transcript.push(response.value);

        dfd.resolve(data);
    });

    return dfd.promise;
};

Brain.prototype._setContext = function (context) {
    this._context = context || "";
};

Brain.prototype._getBestMatch = function (expression, inputEntities) {
    var i;
    var matches = [];
    var match;

    for (i = 0; i < this._intents.length; i++) {
        match = {
            intent: this._intents[i],
            confidence: this._getConfidence(this._intents[i], expression)
        };

        matches.push(match);
    }

    matches.sort(function (a, b) {
        if (a.confidence > b.confidence) {
            return -1;
        }
        if (a.confidence < b.confidence) {
            return 1;
        }
        return 0;
    });

    var bestMatch = null;
    i = 0;
    while (matches.length > 0 && bestMatch === null) {

        // If there is no condition, or the condition is met, this expression is acceptable
        if (!matches[i].intent.expression.condition) {
            bestMatch = matches[i];
            break;
        } else if (this._handleCondition(matches[i].intent.expression.condition, matches[i].intent.expression, inputEntities)) {
            bestMatch = matches[i];
        }

        i++;
    }

    return bestMatch;
};

Brain.prototype._getConfidence = function (intent, inputExpression) {
    var lDistWeight = 4;
    var jwDistWeight = 4;
    var dcDistWeight = 4;
    var totalWeight = lDistWeight + jwDistWeight + dcDistWeight;

    var lDist = nlp.LevenshteinDistance(intent.expression.normalized, inputExpression.normalized);
    var jwDist = nlp.JaroWinklerDistance(intent.expression.normalized, inputExpression.normalized);
    var dcDist = nlp.DiceCoefficient(intent.expression.normalized, inputExpression.normalized);

    if (lDist === 0) {
        lDist = 1;
    } else {
        lDist = 1 / lDist;
    }

    lDist *= lDistWeight;
    jwDist *= jwDistWeight;
    dcDist *= dcDistWeight;

    var confidence = (lDist + jwDist + dcDist) / totalWeight;

    if (this._context) {
        if (this._context === intent.expression.context) {
            confidence *= 1.5;
        } else {
            confidence *= 0.5;
        }
    } else if (intent.expression.context) {
        // Assign no confidence to intents that have context when there is no global context set.
        confidence *= 0;
    }

    return confidence;
};

/**
 * Resolve conditions on relationships to check if the expression is a valid response
 *
 * @param {String} condition The name of the condition to call {namespace + "." + method}
 * @param {Expression} matchedExpression The matched expression
 * @param {Array} inputEntities The entities extracted from the input expression
 * @returns {boolean} If true, this matched expression should be considered as a match.
 * @private
 */
Brain.prototype._handleCondition = function (condition, matchedExpression, inputEntities) {
    var result = true;

    if (condition) {
        if (this._conditions[condition]) {
            result = this._conditions[condition](matchedExpression, inputEntities);
        } else {
            /* jshint ignore:start */
            try {
                result = eval("!!(" + condition + ")");
            } catch (e) {
                console.log('Brain Error: Evaluation failed for condition: ' + condition + '" - ' + e);
            }
            /* jshint ignore:end */
        }
    }

    return result;
};

/**
 * Takes the match intent expression and resolves a Response. If the match has a trigger, the registered trigger is called.
 * This takes String or Object responses and wraps them in a Response object.
 *
 * @param match
 * @param inputExpression
 * @param inputEntities
 * @returns {Promise.<Response>}
 * @private
 */
Brain.prototype._handleBestMatch = function (match, inputExpression, inputEntities) {
    var matchedExpression = match.intent.expression;

    var self = this;

    // If there is a trigger, let the trigger handle the response
    if (matchedExpression.trigger && this._triggers[matchedExpression.trigger]) {
        return this._handleTrigger(matchedExpression.trigger, inputExpression, inputEntities).then(function (triggerResponses) {
            var response;
            if (triggerResponses instanceof Array) {
                var i;
                var responses = [];
                for (i = 0; i < triggerResponses.length; i++) {
                    responses.push(new Response(triggerResponses[i]));
                }
                response = self._getBestResponse(responses);
            } else {
                response = new Response(triggerResponses);
            }

            return response;
        }, function () {
            return self._handleUnknownMatch(inputExpression);
        });
    }

    // If there is not a trigger but the intent has static responses, find an appropriate static response
    if (match.intent.responses) {
        var response;
        if (match.intent.responses instanceof Array) {
            var i;
            var responses = [];
            for (i = 0; i < match.intent.responses.length; i++) {
                responses.push(new Response(match.intent.responses[i]));
            }
            response = self._getBestResponse(responses);
        } else {
            response = new Response(match.intent.responses);
        }
        return $q.resolve(self._getBestResponse(response));
    }

    // If there is not a trigger and there is not a static response, do not respond.
    return $q.resolve(new Response());
};

Brain.prototype._handleUnknownMatch = function (expression) {
    var dfd = $q.defer();

    var responses = [
        "I didn't quite get that.",
        "I'm not sure I understand.",
        "I'm not sure I understand what you mean.",
        "I'm not sure I know what you mean.",
        "I'm not sure I understand what you're saying.",
        "I'm not sure I know what you're saying.",
        "I'm not sure I understand what you mean by '" + expression.value + "'.",
        "I'm not sure I know what you mean by '" + expression.value + "'.",
        "I'm not sure I understand what you mean when you say, '" + expression.value + "'.",
        "I'm not sure I know what you mean when you say, '" + expression.value + "'.",
        "I don't understand.",
        "I don't understand what you mean.",
        "I don't know what you mean.",
        "I don't understand what you're saying.",
        "I don't know what you're saying.",
        "I don't understand what you mean by '" + expression.value + "'.",
        "I don't know what you mean by '" + expression.value + "'.",
        "I don't understand what you mean when you say, '" + expression.value + "'.",
        "I don't know what you mean when you say, '" + expression.value + "'.",
        "I'm sorry, I'm not sure I understand.",
        "I'm sorry, I'm not sure I understand what you mean.",
        "I'm sorry, I'm not sure I know what you mean.",
        "I'm sorry, I'm not sure I understand what you're saying.",
        "I'm sorry, I'm not sure I know what you're saying.",
        "I'm sorry, I'm not sure I understand what you mean by '" + expression.value + "'.",
        "I'm sorry, I'm not sure I know what you mean by '" + expression.value + "'.",
        "I'm sorry, I'm not sure I understand what you mean when you say, '" + expression.value + "'.",
        "I'm sorry, I'm not sure I know what you mean when you say, '" + expression.value + "'.",
        "I'm sorry, I don't understand.",
        "I'm sorry, I don't understand what you mean.",
        "I'm sorry, I don't know what you mean.",
        "I'm sorry, I don't understand what you're saying.",
        "I'm sorry, I don't know what you're saying.",
        "I'm sorry, I don't understand what you mean by '" + expression.value + "'.",
        "I'm sorry, I don't know what you mean by '" + expression.value + "'.",
        "I'm sorry, I don't understand what you mean when you say, '" + expression.value + "'.",
        "I'm sorry, I don't know what you mean when you say, '" + expression.value + "'."
    ];

    var res = [];
    var i;
    for (i = 0; i < responses.length; i++) {
        res.push(new Response(responses[i]));
    }

    dfd.resolve(this._getBestResponse(res));

    return dfd.promise;
};

/**
 * Handles module triggers that are registered for the matching expression
 *
 * @param {String} trigger The name of the trigger to call {namespace + "." + method}
 * @param {Expression} expression The matched expression
 * @param {Array} entities The entities extracted from the matched expression
 * @returns {*|jQuery.promise|promise.promise|d.promise|promise} Should be resolved with a string (the response) or null
 * @private
 */
Brain.prototype._handleTrigger = function (trigger, expression, entities) {
    var dfd = $q.defer();

    if (trigger && this._triggers[trigger]) {
        this._triggers[trigger](dfd, expression, entities || []);
    } else {
        dfd.reject();
    }

    return dfd.promise;
};

Brain.prototype._getBestResponse = function (responses) {
    // TODO: Use something other than a random generator. Use the preference
    return responses[Math.floor(Math.random() * responses.length)];
};

Brain.prototype._extractExpressionEntities = function (expression) {
    var entities = [];

    var extractor;
    for (extractor in this._entityExtractors) {
        if (this._entityExtractors.hasOwnProperty(extractor)) {
            if (typeof this._entityExtractors[extractor].extract === 'function') {
                entities = entities.concat(this._entityExtractors[extractor].extract(expression));
            }
        }
    }

    var entityMap = {};
    var i;
    for (i = 0; i < entities.length; i++) {
        if (entityMap[entities[i].start]) {
            if (entities[i].end > entityMap[entities[i].start].end) {
                entityMap[entities[i].start] = entities[i];
            }
        } else {
            entityMap[entities[i].start] = entities[i];
        }
    }

    entities = [];
    var start;
    for (start in entityMap) {
        if (entityMap.hasOwnProperty(start)) {
            entities.push(entityMap[start]);
        }
    }

    return entities;
};

Brain.prototype._initializeEntities = function () {
    var self = this;
    var normalizedPath = path.join(__dirname, "../entities");

    fs.readdirSync(normalizedPath).forEach(function (file) {
        var module = require("./../entities/" + file);
        if (module.entity && module.namespace && typeof module.entity.extract === 'function' && module.namespace.indexOf('.') === -1) {
            if (self._entityExtractors[module.namespace]) {
                console.log('Brain Error: Entity Namespace conflict: ' + module.namespace);
            } else {
                self._entityExtractors[module.namespace] = module.entity;
            }
        } else {
            console.log('Brain Error: Invalid Entity module: ' + module.namespace);
        }
    });
};

Brain.prototype._initializeModules = function () {
    console.log('Brain: Initializing Modules');

    var self = this;
    var normalizedPath = path.join(__dirname, "../modules");

    fs.readdirSync(normalizedPath).forEach(function (file) {
        var module = require("./../modules/" + file);
        if (typeof module.Constructor === 'function' && module.namespace && module.namespace.indexOf('.') === -1) {
            if (self._modules[module.namespace]) {
                console.log('Brain Error: Module Namespace conflict: ' + module.namespace);
            } else {
                self._modules[module.namespace] = new module.Constructor(
                    function (name) {
                        return memory.get(module.namespace + '.' + name);
                    }, function (name, value, shortTerm) {
                        return memory.set(module.namespace + '.' + name, value, shortTerm);
                    }
                );

                var method;
                var theModule;
                if (self._modules[module.namespace]) {
                    theModule = self._modules[module.namespace];
                    if (theModule.triggers) {
                        for (method in theModule.triggers) {
                            if (theModule.triggers.hasOwnProperty(method) && typeof theModule.triggers[method] === 'function') {
                                self._triggers[module.namespace + '.' + method] = theModule.triggers[method].bind(self);
                            }
                        }
                    }
                    if (theModule.conditions) {
                        for (method in theModule.conditions) {
                            if (theModule.conditions.hasOwnProperty(method) && typeof theModule.conditions[method] === 'function') {
                                self._conditions[module.namespace + '.' + method] = theModule.conditions[method].bind(self);
                            }
                        }
                    }
                    if (theModule.intent && theModule.intent.length > 0) {
                        var i;
                        var intent;
                        for (i = 0; i < theModule.intent.length; i++) {
                            intent = new Intent(theModule.intent[i]);
                            intent.namespace = module.namespace;
                            self._intents.push(intent);
                        }
                    }
                }

            }
        } else {
            console.log('Brain Error: Invalid Module: "' + module.namespace + '"');
        }
    });

    console.log('Brain: Done Initializing Modules');
};

module.exports = new Brain();