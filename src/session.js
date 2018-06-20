var Q = require("Q");

var Expression = require("./expression");
var intentService = require("./intentService");
var memory = require("./memory");
var pluginService = require("./pluginService");
var responseService = require("./responseService");
var Timer = require("./timer");
var utils = require("./utils");

var Session = function () {
    this.username = null;
    this.memory = {};

    this.responseHandlers = [];
    this.userConfig = null;
    this.session = null;

    // Keep track of the transcript. This should allow for repetition checking for both the user and the AI. This should
    // help prevent the AI from repeating a response to frequently. Also, when the user repeats the same thing multiple
    // times, the AI can respond differently.
    this._transcript = [];

    this._expectations = [];

    this.timers = [];
};

Session.prototype.sendCommand = function (message) {
    var self = this;

    var sendResponse = function (session, data) {
        var i;
        for (i = 0; i < session.responseHandlers.length; i++) {
            session.responseHandlers[i](data);
        }
    };

    this.processExpression(message).then(function (result) {
        if (result) {
            sendResponse(self, result);
        }
    }, function (e) {
        console.error("API: unexpected error: " + e);
    }, function (intermediateResponse) {
        if (intermediateResponse) {
            sendResponse(self, intermediateResponse);
        }
    });
};

Session.prototype.onResponse = function (handler) {
    if (this.responseHandlers.indexOf(handler) >= 0) {
        return;
    }
    this.responseHandlers.push(handler);

    var self = this;
    return function () {
        var idx = self.responseHandlers.indexOf(handler);
        if (idx >= 0) {
            self.responseHandlers.splice(idx, 1);
        }
    };
};

Session.prototype.loadUserConfig = function (config) {
    this.memory = utils.extend(config, this.memory);

    // If the session is linked to an account, store the memory in long term
    if (this.username) {
        memory.set(this.username, this.memory);
    }
};

Session.prototype.link = function (username) {
    if (username && username !== this.username) {
        this.username = username;
        var loadedMemory = memory.get(username);
        this.memory = utils.extend(loadedMemory, this.memory);
        memory.set(username, this.memory);
    }
};

Session.prototype.unlink = function () {
    this.username = null;
};

Session.prototype.getMemory = function (name) {
    return memory.getShortTerm(this.memory, name);
};

Session.prototype.setMemory = function (name, value) {
    memory.setShortTerm(this.memory, name, value);

    // If the session is linked to an account, store the memory in long term
    if (this.username) {
        memory.set(this.username, this.memory);
    }
};

Session.prototype.getPlugins = function () {
    var plugins = pluginService.getPlugins();
    return pluginService.sanitizePlugins(plugins, this);
};

Session.prototype.getPlugin = function (namespace) {
    var plugin = pluginService.getPlugin(namespace);
    return pluginService.sanitizePlugins(plugin, this);
};

Session.prototype.updatePlugin = function (namespace, plugin) {
    return pluginService.updatePlugin(namespace, plugin, this);
};

Session.prototype.addTimer = function (seconds, onFinish) {
    var self = this;
    var timer = new Timer(seconds, onFinish, function () {
        delete self.timers[timer.id];
    });
    this.timers[timer.id] = timer;
    return timer;
};

Session.prototype.processExpression = function (input) {
    var dfd = Q.defer();

    var inputExpression = new Expression(input);
    inputExpression.process();

    var pushedInputToTranscript = false;

    var self = this;
    this.processIntent(inputExpression).then(function (result) {
        var response = result.response;
        var matchedClassification = result.matchedClassification;

        self._expectations = response.expectations || [];

        var data = {
            input: inputExpression,
            classification: matchedClassification,
            response: response.value,
            expectations: self._expectations
        };

        console.log(JSON.stringify({
            input: data.input.value,
            trigger: data.classification ? data.classification.trigger : "",
            confidence: data.classification ? data.classification.confidence : 0,
            response: data.response,
            expectations: data.expectations
        }, null, "  "));

        if (!pushedInputToTranscript) {
            self._transcript.push(inputExpression.value);
        }
        self._transcript.push(response.value);

        dfd.resolve(data);
    }, function (e) {
        console.log("Session: unexpected error: " + e);
    }, function (intermediateResponse) {
        var response = intermediateResponse.response;
        var matchedClassification = intermediateResponse.matchedClassification;

        self._expectations = response.expectations || [];

        var data = {
            input: inputExpression,
            classification: matchedClassification,
            response: response.value,
            expectations: self._expectations
        };

        console.log(JSON.stringify({
            input: data.input.value,
            trigger: data.classification ? data.classification.trigger : "",
            confidence: data.classification ? data.classification.confidence : 0,
            response: data.response,
            expectations: data.expectations
        }, null, "  "));

        if (!pushedInputToTranscript) {
            self._transcript.push(inputExpression.value);
        }
        self._transcript.push(response.value);

        dfd.notify(data);
    });

    return dfd.promise;
};

Session.prototype.processIntent = function (inputExpression) {
    var dfd = Q.defer();

    var matchedClassification;

    var i;
    var matchers = [];
    var examples = [];
    var triggers = {};
    var plugins = pluginService.getEnabledPlugins();
    var option;
    var customPluginIntent = [];

    for (i = 0; i < plugins.length; i++) {
        matchers = matchers.concat(plugins[i].intentMatchers);
        examples = examples.concat(plugins[i].examples);
        utils.extend(triggers, plugins[i].triggers);

        if (plugins[i].options) {
            for (option in plugins[i].options) {
                if (plugins[i].options.hasOwnProperty(option) && plugins[i].options[option].intentArray) {
                    var name = plugins[i].namespace + "." + option;
                    if (this.memory && this.memory[name] instanceof Array) {
                        customPluginIntent = customPluginIntent.concat(memories[name]);
                    }
                }
            }
        }
    }

    for (i = 0; i < customPluginIntent.length; i++) {
        matchers.push(new intentService.Matcher(customPluginIntent[i].value, customPluginIntent[i].trigger, customPluginIntent[i].expectations));
    }

    // Reverse sort by specificity so the most specific matcher is at the top
    matchers.sort(function (a, b) {
        if (a.specificity > b.specificity) {
            return -1;
        }
        if (b.specificity > a.specificity) {
            return 1;
        }
        return 0;
    });

    // If there are any expectations, add them as the matchers to check first
    var expectation;
    for (i = 0; i < this._expectations.length; i++) {
        expectation = this._expectations[i];
        matchers.unshift(new intentService.Matcher(expectation.value, expectation.trigger, expectation.expectations));
    }

    var input = inputExpression.normalized.replace(/^please\s/i, "");
    input = input.replace(/\s(thank you|thanks|please)$/i, "");
    var matchedIntent = intentService.matchInputToIntent(input, matchers);
    if (matchedIntent.confidence > 0.6) {
        matchedClassification = {
            trigger: matchedIntent.intent,
            confidence: matchedIntent.confidence,
            namedWildcards: matchedIntent.namedWildcards
        };
    }

    if (matchedClassification && matchedClassification.confidence > 0.5) {

        var namedValues = matchedClassification.namedWildcards || {};

        this.processTrigger(matchedClassification.trigger, inputExpression, triggers, namedValues, examples).then(
            function (response) {
                dfd.resolve({
                    response: response,
                    matchedClassification: matchedClassification
                });
            }, function () {
                dfd.resolve({
                    response: responseService.getUnknownResponse(inputExpression),
                    matchedClassification: matchedClassification
                });
            }, function (response) {
                dfd.notify({
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
 * @returns {Promise.<Response>}
 * @private
 */
Session.prototype.processTrigger = function (triggerKey, inputExpression, triggers, namedValues, examples) {
    var dfd = Q.defer();

    if (!triggerKey) {
        return Q.resolve(responseService.getUnknownResponse(inputExpression));
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
        var triggerDfd = Q.defer();

        var trigger = triggers[triggerKey];
        var self = this;

        var utils = {
            getMemory: function (name) {
                return self.getMemory(trigger.namespace + '.' + name);
            },
            setMemory: function (name, value) {
                self.setMemory(trigger.namespace + '.' + name, value);
            },
            getExamples: function () {
                return examples;
            },
            addTimer: function (seconds, onFinish) {
                return self.addTimer(seconds, onFinish);
            },
            getTimer: function (id) {
                return self.timers[id] || null;
            }
        };

        triggerDfd.promise.then(function (triggerResponses) {
            var responses = responseService.getResponses(triggerResponses);
            dfd.resolve(responseService.getBestResponse(responses));
        }, function () {
            dfd.resolve(responseService.getUnknownResponse(inputExpression));
        }, function (triggerResponses) {
            var responses = responseService.getResponses(triggerResponses);
            dfd.notify(responseService.getBestResponse(responses));
        });

        trigger.method(triggerDfd, inputExpression, utils, intentData);

        return dfd.promise;
    }

    return Q.resolve(responseService.getUnknownResponse(inputExpression));
};

module.exports = Session;