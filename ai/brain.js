var extend = require('extend');
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

Brain.prototype.processExpression = function (input, username) {
    var dfd = $q.defer();

    var inputExpression = new Expression(input);
    inputExpression.process();

    var self = this;
    this._processIntent(inputExpression, username).then(function (result) {
        var response = result.response;
        var matchedClassification = result.matchedClassification;

        self._context = response.context || "";

        var data = {
            input: inputExpression,
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

Brain.prototype._processIntent = function (inputExpression, username) {
    var dfd = $q.defer();

    var matchedClassification;

    var i;
    var matchers = [];
    var examples = [];
    var triggers = {};
    var contextTriggers = {};
    var plugins = pluginLoader.getEnabledPlugins();

    for (i = 0; i < plugins.length; i++) {
        matchers = matchers.concat(plugins[i].intentMatchers);
        examples = examples.concat(plugins[i].examples);
        extend(triggers, plugins[i].triggers);
        extend(contextTriggers, plugins[i].contextTriggers);
    }

    if (this._context) {
        if (contextTriggers[this._context]) {
            matchedClassification = {
                trigger: contextTriggers[this._context],
                confidence: 1
            };
        }
    } else {
        var matchedIntent = intentMatcher.matchInputToIntent(inputExpression.normalized, matchers);
        if (matchedIntent.confidence > 0.6) {
            matchedClassification = {
                trigger: matchedIntent.intent,
                confidence: matchedIntent.confidence
            };
        } else {
            matchedClassification = classifier.classify(inputExpression);
        }
    }

    if (matchedClassification && matchedClassification.confidence > 0.5) {
        this._processTrigger(matchedClassification.trigger, inputExpression, triggers, examples, username).then(function (response) {
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

/**
 * Takes the matched trigger and resolves a Response.
 * This takes String or Object responses, gets a single response from the set and wraps it in a Response object.
 *
 * @param triggerKey
 * @param inputExpression
 * @param triggers
 * @param examples
 * @param username
 * @returns {Promise.<Response>}
 * @private
 */
Brain.prototype._processTrigger = function (triggerKey, inputExpression, triggers, examples, username) {
    if (triggerKey && triggers[triggerKey]) {
        var dfd = $q.defer();

        var trigger = triggers[triggerKey];

        var getMemory = function (name) {
            return memory.get(trigger.namespace + '.' + name, username);
        };
        var setMemory = function (name, value, shortTerm) {
            if (shortTerm) {
                memory.setSessionMemory(trigger.namespace + '.' + name, value, username);
            } else {
                memory.set(trigger.namespace + '.' + name, value);
            }
        };
        var setConfiguration = function (key, value) {
            configuration.setPluginSetting(trigger.namespace, key, value);
        };
        var getExamples = function () {
            return examples;
        };

        trigger.method(dfd, inputExpression, getMemory, setMemory, setConfiguration, getExamples);

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
    var template = "[I'm sorry,] ((I'm not sure I|I don't) understand [what (you mean [by '" + inputExpression.value + "']|you're saying [when you say, '" + inputExpression.value + "'])]|I didn't quite get that).";
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

module.exports = Brain;