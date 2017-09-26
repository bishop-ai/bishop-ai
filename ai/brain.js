var fs = require("fs");
var path = require("path");
var $q = require('q');
var shuffle = require('knuth-shuffle').knuthShuffle;

var classifier = require('./classifier');
var configuration = require('./configuration');
var Expression = require('./expression');
var intentMatcher = require('./intentMatcher');
var memory = require('./memory');
var pluginLoader = require('./pluginLoader');
var Response = require('./response');
var responseBuilder = require('./responseBuilder');

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

// Triggers are registered by the skill. The skill then registers intents which correspond to a given trigger
// When the input is matched to a trigger, the trigger is called and can provide a response.
Brain.triggers = {};

// Context triggers are a mapping of skill context to a skill trigger. When the context is set by a response, the next input
// will call the trigger registered for the context.
Brain.contextTriggers = {};

// Examples of phrases that the user can send to initiate an action. These are supplied by the Skill plugins.
Brain.examples = [];

Brain.prototype.processExpression = function (input) {
    var dfd = $q.defer();

    var inputExpression = new Expression(input);
    inputExpression.process();

    var inputEntities = this._extractExpressionEntities(inputExpression);

    var self = this;
    this._processIntent(inputExpression, inputEntities).then(function (result) {
        var response = result.response;
        var matchedClassification = result.matchedClassification;

        self._context = response.context || "";

        var data = {
            input: inputExpression,
            entities: inputEntities,
            classification: matchedClassification,
            response: response.value,
            context: self._context
        };

        console.log(JSON.stringify({
            input: data.input.value,
            entities: data.entities,
            trigger: data.classification ? data.classification.trigger : "",
            confidence: data.classification ? data.classification.confidence : 0,
            response: data.response,
            context: data.context
        }, null, "  "));

        self._transcript.push(inputExpression.value);
        self._transcript.push(response.value);

        dfd.resolve(data);
    });

    return dfd.promise;
};

Brain.prototype._processIntent = function (inputExpression, inputEntities) {
    var dfd = $q.defer();

    var matchedClassification;

    if (this._context) {
        if (Brain.contextTriggers[this._context]) {
            matchedClassification = {
                trigger: Brain.contextTriggers[this._context],
                confidence: 1
            };
        }
    } else {
        var matchedIntent = intentMatcher.matchInputToIntent(inputExpression.normalized);
        if (matchedIntent.confidence > 0.6) {
            matchedClassification = {
                trigger: matchedIntent.intent,
                confidence: matchedIntent.confidence
            };
        } else {
            matchedClassification = this._classifyInput(inputExpression);
        }
    }

    if (matchedClassification && matchedClassification.confidence > 0.5) {

        this._processTrigger(matchedClassification.trigger, inputExpression, inputEntities).then(function (response) {
            dfd.resolve({
                response: response,
                matchedClassification: matchedClassification
            });
        });
    } else {

        if (matchedClassification) {
            console.log("Brain: Classification found but low confidence: " + matchedClassification.trigger + " = " + matchedClassification.confidence);
        }

        dfd.resolve({
            response: this._getUnknownResponse(inputExpression),
            matchedClassification: matchedClassification
        });
    }

    return dfd.promise;
};

Brain.prototype._classifyInput = function (inputExpression) {
    return classifier.classify(inputExpression);
};

/**
 * Takes the matched trigger and resolves a Response.
 * This takes String or Object responses, gets a single response from the set and wraps it in a Response object.
 *
 * @param triggerKey
 * @param inputExpression
 * @param inputEntities
 * @returns {Promise.<Response>}
 * @private
 */
Brain.prototype._processTrigger = function (triggerKey, inputExpression, inputEntities) {
    if (triggerKey && Brain.triggers[triggerKey]) {
        var dfd = $q.defer();

        var trigger = Brain.triggers[triggerKey];

        var getMemory = function (name) {
            return memory.get(trigger.namespace + '.' + name);
        };
        var setMemory = function (name, value, shortTerm) {
            memory.set(trigger.namespace + '.' + name, value, shortTerm);
        };
        var setConfiguration = function (key, value) {
            configuration.setSkillSetting(trigger.namespace, key, value);
        };
        var getExamples = function () {
            return Brain.examples;
        };

        trigger.method(dfd, inputExpression, inputEntities || [], getMemory, setMemory, setConfiguration, getExamples);

        var self = this;
        return dfd.promise.then(function (triggerResponses) {
            var responses = responseBuilder.getResponses(triggerResponses);
            return self._getBestResponse(responses);
        }, function () {
            return self._getUnknownResponse(inputExpression);
        });
    }

    return $q.resolve(this._getUnknownResponse(inputExpression));
};

Brain.prototype._getUnknownResponse = function (inputExpression) {
    var template = "[I'm sorry,] (I('m not sure I|don't) understand [what (you mean [by '" + inputExpression.value + "']|you're saying [when you say, '" + inputExpression.value + "'])]|I didn't quite get that).";
    var responses = responseBuilder.getResponses(template);

    var res = [];
    var i;
    for (i = 0; i < responses.length; i++) {
        res.push(new Response(responses[i]));
    }

    return this._getBestResponse(res);
};

Brain.prototype._getBestResponse = function (responses) {
    console.log("Choosing 1 of " + responses.length + " responses.");

    // First shuffle the array so that any items with the same weight will appear with the same frequency
    responses = shuffle(responses.slice(0));

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
            Brain.triggers[namespace + "." + trigger] = {
                method: service.triggers[trigger],
                namespace: namespace
            };
        }
    }

    // Register all context triggers with their trigger
    var context;
    for (context in service.context) {
        if (service.context.hasOwnProperty(context) && Brain.triggers.hasOwnProperty(service.context[context])) {
            Brain.contextTriggers[namespace + "." + context] = service.context[context];
        }
    }

    // Register all intents
    var i;
    for (i = 0; i < service.intent.length; i++) {

        // Only intents with triggers are registered
        if (service.intent[i].trigger) {
            intentMatcher.addIntent(service.intent[i].value, service.intent[i].trigger, service.intent[i].context);
        }
    }

    // Register all examples
    Brain.examples = Brain.examples.concat(service.examples);
};

module.exports = Brain;