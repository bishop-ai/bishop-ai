var extend = require('extend');
var fs = require("fs");
var path = require("path");
var $q = require('q');

var classifier = require('./classifier');
var configuration = require('./configuration');
var Expression = require('./expression');
var intentService = require('./intentService');
var memory = require('./memory');
var pluginService = require('./pluginService');
var responseService = require('./responseService');

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
    var plugins = pluginService.getEnabledPlugins();

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
        var matchedIntent = intentService.matchInputToIntent(inputExpression.normalized, matchers);
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
            response: responseService.getUnknownResponse(inputExpression),
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

        return dfd.promise.then(function (triggerResponses) {
            var responses = responseService.getResponses(triggerResponses);
            return responseService.getBestResponse(responses);
        }, function () {
            return responseService.getUnknownResponse(inputExpression);
        });
    }

    return $q.resolve(responseService.getUnknownResponse(inputExpression));
};

module.exports = Brain;