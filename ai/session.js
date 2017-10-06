var extend = require('extend');
var fs = require("fs");
var path = require("path");
var $q = require('q');

var classifier = require('./classifier');
var Expression = require('./expression');
var intentService = require('./intentService');
var memory = require('./memory');
var pluginService = require('./pluginService');
var responseService = require('./responseService');

var Session = function () {
    this.username = null;
    this.memory = {};

    // Keep track of the transcript. This should allow for repetition checking for both the user and the AI. This should
    // help prevent the AI from repeating a response to frequently. Also, when the user repeats the same thing multiple
    // times, the AI can respond differently.
    this._transcript = [];

    this._context = "";
};

Session.prototype.getMemory = function (name) {
    if (name && this.memory[name]) {
        return this.memory[name];
    }

    console.log('Session Warning: No memory found by name: ' + name);
    return null;
};

Session.prototype.setMemory = function (name, value) {
    if (!name) {
        console.log('Session Error: Cannot store session memory with name: ' + name);
        return;
    }

    if (value === null || value === undefined) {
        delete this.memory[name];
    } else {
        this.memory[name] = value;
    }

    // If the session is linked to an account, store the memory in long term
    if (this.username) {
        memory.set(this.username, this.memory);
    }
};

Session.prototype.link = function (username) {
    if (username && username !== this.username) {
        this.username = username;
        var loadedMemory = memory.get(username);
        this.memory = extend(loadedMemory, this.memory);
        memory.set(username, this.memory);
    }
};

Session.prototype.unlink = function () {
    this.username = null;
};

Session.prototype.processExpression = function (input, username) {
    var dfd = $q.defer();

    var inputExpression = new Expression(input);
    inputExpression.process();

    var self = this;
    this.processIntent(inputExpression, username).then(function (result) {
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

Session.prototype.processIntent = function (inputExpression, username) {
    var dfd = $q.defer();

    var matchedClassification;

    var i;
    var matchers = [];
    var examples = [];
    var triggers = {};
    var contextTriggers = {};
    var plugins = pluginService.getEnabledPlugins();
    var option;
    var customPluginIntent = [];

    var memories = memory.get(username);

    for (i = 0; i < plugins.length; i++) {
        matchers = matchers.concat(plugins[i].intentMatchers);
        examples = examples.concat(plugins[i].examples);
        extend(triggers, plugins[i].triggers);
        extend(contextTriggers, plugins[i].contextTriggers);

        if (plugins[i].options) {
            for (option in plugins[i].options) {
                if (plugins[i].options.hasOwnProperty(option) && plugins[i].options[option].intentArray) {
                    var name = plugins[i].namespace + "." + option;
                    if (memories[name] instanceof Array) {
                        customPluginIntent = customPluginIntent.concat(memories[name]);
                    }
                }
            }
        }
    }

    for (i = 0; i < customPluginIntent.length; i++) {
        matchers.push(new intentService.Matcher(customPluginIntent[i].value, customPluginIntent[i].trigger, customPluginIntent[i].context));
    }

    if (this._context) {
        if (contextTriggers[this._context]) {
            matchedClassification = {
                trigger: contextTriggers[this._context],
                confidence: 1
            };
        }
    } else {
        var input = inputExpression.normalized.replace(/^please\s/i, "");
        input = input.replace(/\splease$/i, "");
        var matchedIntent = intentService.matchInputToIntent(input, matchers);
        if (matchedIntent.confidence > 0.6) {
            matchedClassification = {
                trigger: matchedIntent.intent,
                confidence: matchedIntent.confidence,
                namedWildcards: matchedIntent.namedWildcards
            };
        } else {
            matchedClassification = classifier.classify(inputExpression);
        }
    }

    if (matchedClassification && matchedClassification.confidence > 0.5) {

        var namedValues = matchedClassification.namedWildcards || {};

        this.processTrigger(matchedClassification.trigger, inputExpression, triggers, namedValues, examples, username).then(function (response) {
            dfd.resolve({
                response: response,
                matchedClassification: matchedClassification
            });
        });
    } else {

        if (matchedClassification) {
            console.log("Session: Classification found but low confidence: " + matchedClassification.trigger + " = " + matchedClassification.confidence);
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
 * @param namedValues
 * @param examples
 * @param username
 * @returns {Promise.<Response>}
 * @private
 */
Session.prototype.processTrigger = function (triggerKey, inputExpression, triggers, namedValues, examples, username) {
    if (!triggerKey) {
        return $q.resolve(responseService.getUnknownResponse(inputExpression));
    }

    var triggerParams = [];
    if (triggerKey.indexOf('(') >= 0 && triggerKey.indexOf(')') === triggerKey.length - 1) {
        var dataString = triggerKey.substring(triggerKey.indexOf('(') + 1, triggerKey.length - 1);
        triggerKey = triggerKey.substring(0, triggerKey.indexOf('('));
        triggerParams = dataString.split(",");
    }

    var i;
    for (i = 0; i < triggerParams.length; i++) {
        triggerParams[i] = triggerParams[i].trim();
    }

    var intentData = {
        triggerParams: triggerParams,
        namedValues: namedValues || {}
    };

    if (triggerKey && triggers[triggerKey]) {
        var dfd = $q.defer();

        var trigger = triggers[triggerKey];
        var self = this;

        var getMemory = function (name) {
            return self.getMemory(trigger.namespace + '.' + name, username);
        };
        var setMemory = function (name, value) {
            self.setMemory(trigger.namespace + '.' + name, value);
        };
        var getExamples = function () {
            return examples;
        };

        trigger.method(dfd, inputExpression, getMemory, setMemory, getExamples, intentData);

        return dfd.promise.then(function (triggerResponses) {
            var responses = responseService.getResponses(triggerResponses);
            return responseService.getBestResponse(responses);
        }, function () {
            return responseService.getUnknownResponse(inputExpression);
        });
    }

    return $q.resolve(responseService.getUnknownResponse(inputExpression));
};

module.exports = Session;