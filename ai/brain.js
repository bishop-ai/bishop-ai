var fs = require("fs");
var path = require("path");
var $q = require('q');

var configuration = require('./configuration');
var Expression = require('./expression');
var Intent = require('./intent');
var memory = require('./memory');
var nlp = require('./../nlp');
var pluginLoader = require('./pluginLoader');
var Response = require('./response');

var Brain = function () {

    // Keep track of the transcript. This should allow for repetition checking for both the user and the AI. This should
    // help prevent the AI from repeating a response to frequently. Also, when the user repeats the same thing multiple
    // times, the AI can respond differently.
    this._transcript = [];

    this._context = "";
};

// Entity extractors are used to create named entities from parts of the input. These are then passed into the skill
// intent triggers to help perform actions and/or return responses. For example, a date/time extractor might be used
// to create a Date object that represents a spoken date ("The fifth of January"). This date object can then be used
// throughout the process to provide a more accurate experience.
Brain.entityExtractors = [];

// Intents are registered by skills. Intents represent a value to match the input on, a condition to validate the match
// and either a trigger to act on or static responses. All intents must provide a value. If a trigger is set, the
// registered trigger will be called. If there is no trigger, but there are static responses, one of the responses
// will be used. If there is not condition is present, the match will not be validated and only the scored confidence
// will be used to select the match.
Brain.intents = [];

// Triggers are registered by the skill. The skill then registers intents which correspond to a given trigger
// When the intent is matched to the input, the registered trigger referenced by the matched intent is called and
// can provide a response.
Brain.triggers = {};

Brain.prototype.processExpression = function (input) {
    var dfd = $q.defer();

    var inputExpression = new Expression(input);
    inputExpression.process();

    var inputEntities = this._extractExpressionEntities(inputExpression);

    var matchedIntent;

    var self = this;
    var processIntent = function (match) {
        if (match && match.confidence > 0.5) {
            matchedIntent = match;
            return self._processIntent(match.intent, inputExpression, inputEntities);
        } else {
            return self._handleUnknownIntent(inputExpression);
        }
    };

    processIntent(this._findMatchingIntent(inputExpression)).then(function (response) {
        self._setContext(response.context);

        var data = {
            input: inputExpression,
            entities: inputEntities,
            match: matchedIntent,
            response: response.value,
            context: self._context
        };

        console.log(JSON.stringify({
            input: data.input.value,
            intent: data.match.intent.value,
            skill: data.match.intent.namespace,
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

Brain.prototype._findMatchingIntent = function (inputExpression) {
    var i;
    var matches = [];
    var match;

    for (i = 0; i < Brain.intents.length; i++) {
        match = {
            intent: Brain.intents[i],
            confidence: this._getConfidence(Brain.intents[i], inputExpression)
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
    if (matches.length > 0) {
        bestMatch = matches[0];
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
 * Takes the matched intent and resolves a Response. If the intent expression has a trigger, the registered trigger is called.
 * This takes String or Object responses and wraps them in a Response object.
 *
 * @param intent
 * @param inputExpression
 * @param inputEntities
 * @returns {Promise.<Response>}
 * @private
 */
Brain.prototype._processIntent = function (intent, inputExpression, inputEntities) {
    var intentExpression = intent.expression;

    var getMemory = function (namespace, name) {
        return memory.get(namespace + '.' + name);
    };
    var setMemory = function (namespace, name, value, shortTerm) {
        memory.set(namespace + '.' + name, value, shortTerm);
    };

    if (intentExpression.trigger && Brain.triggers[intentExpression.trigger]) {
        var dfd = $q.defer();

        Brain.triggers[intentExpression.trigger](dfd, inputExpression, inputEntities || [], getMemory, setMemory);

        var self = this;
        return dfd.promise.then(function (triggerResponses) {
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
            return self._handleUnknownIntent(inputExpression);
        });
    }

    return this._handleUnknownIntent(inputExpression);
};

Brain.prototype._handleUnknownIntent = function (inputExpression) {
    var dfd = $q.defer();

    var responses = [
        "I didn't quite get that.",
        "I'm not sure I understand.",
        "I'm not sure I understand what you mean.",
        "I'm not sure I know what you mean.",
        "I'm not sure I understand what you're saying.",
        "I'm not sure I know what you're saying.",
        "I'm not sure I understand what you mean by '" + inputExpression.value + "'.",
        "I'm not sure I know what you mean by '" + inputExpression.value + "'.",
        "I'm not sure I understand what you mean when you say, '" + inputExpression.value + "'.",
        "I'm not sure I know what you mean when you say, '" + inputExpression.value + "'.",
        "I don't understand.",
        "I don't understand what you mean.",
        "I don't know what you mean.",
        "I don't understand what you're saying.",
        "I don't know what you're saying.",
        "I don't understand what you mean by '" + inputExpression.value + "'.",
        "I don't know what you mean by '" + inputExpression.value + "'.",
        "I don't understand what you mean when you say, '" + inputExpression.value + "'.",
        "I don't know what you mean when you say, '" + inputExpression.value + "'.",
        "I'm sorry, I'm not sure I understand.",
        "I'm sorry, I'm not sure I understand what you mean.",
        "I'm sorry, I'm not sure I know what you mean.",
        "I'm sorry, I'm not sure I understand what you're saying.",
        "I'm sorry, I'm not sure I know what you're saying.",
        "I'm sorry, I'm not sure I understand what you mean by '" + inputExpression.value + "'.",
        "I'm sorry, I'm not sure I know what you mean by '" + inputExpression.value + "'.",
        "I'm sorry, I'm not sure I understand what you mean when you say, '" + inputExpression.value + "'.",
        "I'm sorry, I'm not sure I know what you mean when you say, '" + inputExpression.value + "'.",
        "I'm sorry, I don't understand.",
        "I'm sorry, I don't understand what you mean.",
        "I'm sorry, I don't know what you mean.",
        "I'm sorry, I don't understand what you're saying.",
        "I'm sorry, I don't know what you're saying.",
        "I'm sorry, I don't understand what you mean by '" + inputExpression.value + "'.",
        "I'm sorry, I don't know what you mean by '" + inputExpression.value + "'.",
        "I'm sorry, I don't understand what you mean when you say, '" + inputExpression.value + "'.",
        "I'm sorry, I don't know what you mean when you say, '" + inputExpression.value + "'."
    ];

    var res = [];
    var i;
    for (i = 0; i < responses.length; i++) {
        res.push(new Response(responses[i]));
    }

    dfd.resolve(this._getBestResponse(res));

    return dfd.promise;
};

Brain.prototype._getBestResponse = function (responses) {
    // TODO: Use something other than a random generator. Use the preference
    return responses[Math.floor(Math.random() * responses.length)];
};

Brain.prototype._extractExpressionEntities = function (expression) {
    var entities = [];

    var i;
    for (i = 0; i < Brain.entityExtractors.length; i++) {
        entities = entities.concat(Brain.entityExtractors[i].extract(expression.normalized, {
            tokens: expression.tokens,
            tags: expression.tags,
            qType: expression.qType,
            qClass: expression.qClass,
            value: expression.value
        }));
    }

    var entityMap = {};
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

Brain.initialize = function () {
    console.log('Brain: Initializing');

    var i;

    // Register all enabled entity extractors
    var extractorPlugin;
    for (i = 0; i < pluginLoader.plugins.ENTITY_EXTRACTOR.length; i++) {
        extractorPlugin = pluginLoader.plugins.ENTITY_EXTRACTOR[i];

        if (extractorPlugin.enabled) {
            Brain.entityExtractors.push(extractorPlugin.service);
        }
    }

    Brain.registerSkill(configuration.skillService.namespace, configuration.skillService);

    var skillPlugin;
    for (i = 0; i < pluginLoader.plugins.SKILL.length; i++) {
        skillPlugin = pluginLoader.plugins.SKILL[i];

        if (skillPlugin.enabled) {
            Brain.registerSkill(skillPlugin.namespace, skillPlugin.service);
        }
    }

    console.log('Brain: Done initializing');
};

Brain.registerSkill = function (namespace, service) {
    // Register all triggers so that any intent can call the trigger
    var trigger;
    for (trigger in service.triggers) {
        if (service.triggers.hasOwnProperty(trigger) && typeof service.triggers[trigger] === "function") {
            Brain.triggers[namespace + "." + trigger] = service.triggers[trigger];
        }
    }

    // Register all intents
    var i;
    if (service.intent.length > 0) {
        var intent;
        for (i = 0; i < service.intent.length; i++) {

            // Currently, only intents with triggers are registered
            if (service.intent[i].trigger) {
                intent = new Intent(service.intent[i]);
                intent.namespace = namespace;
                Brain.intents.push(intent);
            }
        }
    }
};

module.exports = Brain;