var BISHOP_AI = (function (module) {
    'use strict';

    var Q = require("Q");

    var Session = function () {
        this.username = null;
        this.memory = {};

        // Keep track of the transcript. This should allow for repetition checking for both the user and the AI. This should
        // help prevent the AI from repeating a response to frequently. Also, when the user repeats the same thing multiple
        // times, the AI can respond differently.
        this._transcript = [];

        this._expectations = [];

        this.timers = [];
    };

    Session.prototype.addTimer = function (seconds, onFinish) {
        var self = this;
        var timer = new module.Timer(seconds, onFinish, function () {
            delete self.timers[timer.id];
        });
        this.timers[timer.id] = timer;
        return timer;
    };

    Session.prototype.loadUserConfig = function (config) {
        this.memory = module.utils.extend(config, this.memory);

        // If the session is linked to an account, store the memory in long term
        if (this.username) {
            module.memory.set(this.username, this.memory);
        }
    };

    Session.prototype.getMemory = function (name) {
        return module.memory.getShortTerm(this.memory, name);
    };

    Session.prototype.setMemory = function (name, value) {
        module.memory.setShortTerm(this.memory, name, value);

        // If the session is linked to an account, store the memory in long term
        if (this.username) {
            module.memory.set(this.username, this.memory);
        }
    };

    Session.prototype.link = function (username) {
        if (username && username !== this.username) {
            this.username = username;
            var loadedMemory = module.memory.get(username);
            this.memory = module.utils.extend(loadedMemory, this.memory);
            module.memory.set(username, this.memory);
        }
    };

    Session.prototype.unlink = function () {
        this.username = null;
    };

    Session.prototype.processExpression = function (input) {
        var dfd = Q.defer();

        var inputExpression = new module.Expression(input);
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
        var plugins = module.pluginService.getEnabledPlugins();
        var option;
        var customPluginIntent = [];

        for (i = 0; i < plugins.length; i++) {
            matchers = matchers.concat(plugins[i].intentMatchers);
            examples = examples.concat(plugins[i].examples);
            module.utils.extend(triggers, plugins[i].triggers);

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
            matchers.push(new module.intentService.Matcher(customPluginIntent[i].value, customPluginIntent[i].trigger, customPluginIntent[i].expectations));
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
            matchers.unshift(new module.intentService.Matcher(expectation.value, expectation.trigger, expectation.expectations));
        }

        var input = inputExpression.normalized.replace(/^please\s/i, "");
        input = input.replace(/\s(thank you|thanks|please)$/i, "");
        var matchedIntent = module.intentService.matchInputToIntent(input, matchers);
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
                        response: module.responseService.getUnknownResponse(inputExpression),
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
                response: module.responseService.getUnknownResponse(inputExpression),
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
            return Q.resolve(module.responseService.getUnknownResponse(inputExpression));
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
                var responses = module.responseService.getResponses(triggerResponses);
                dfd.resolve(module.responseService.getBestResponse(responses));
            }, function () {
                dfd.resolve(module.responseService.getUnknownResponse(inputExpression));
            }, function (triggerResponses) {
                var responses = module.responseService.getResponses(triggerResponses);
                dfd.notify(module.responseService.getBestResponse(responses));
            });

            trigger.method(triggerDfd, inputExpression, utils, intentData);

            return dfd.promise;
        }

        return Q.resolve(module.responseService.getUnknownResponse(inputExpression));
    };

    module.Session = Session;

    return module;
}(BISHOP_AI || {}));