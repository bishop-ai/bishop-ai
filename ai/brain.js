var extend = require('extend');
var fs = require("fs");
var path = require("path");
var neo4j = require('node-neo4j');
var $q = require('q');

var configuration = require('./configuration');
var db = require('./../utils/db');
var Expression = require('./../models/expression');
var memory = require('./memory');
var nlp = require('./../nlp');
var Predicate = require('./../utils/predicate');

var Brain = function (debug) {
    this._transcript = [];
    this._entities = {};
    this._modules = {};
    this._triggers = {};
    this._conditions = {};
    this._injectors = {};
    this._intent = null;

    this._debug = configuration.debug === true || debug === true;

    this._initializeEntities();
    this._initializeModules();
};

Brain.TRANSCRIPT_DIR = {
    'SENT': 'SENT',
    'RECEIVED': 'RECEIVED'
};

// TODO: Handle multiple/compound sentences
Brain.prototype.processExpression = function (input) {
    var dfd = $q.defer();

    var expression = new Expression(input);
    expression = expression.clean();
    expression = Expression.process(expression);

    var result = {
        input: expression.value,
        normalized: expression.normalized,
        entities: this._extractExpressionEntities(expression),
        response: ""
    };

    var self = this;
    this._getBestMatch(expression).then(function (response) {
        if (response.confidence > 0.5) {
            result.match = {
                expression: response.expression,
                confidence: response.confidence
            };
            return self._handleBestMatch(result, response, expression);
        } else {
            return self._handleUnknownMatch(expression);
        }
    }).then(function (response) {
        result = self._handleResponse(result, response, expression);
        console.log(JSON.stringify(result, null, "  "));
        dfd.resolve(result);
    });

    return dfd.promise;
};

Brain.prototype._setIntent = function (intent) {
    if (intent || intent === "") {
        this._intent = intent;
    }
};

Brain.prototype._getBestMatch = function (expression) {
    var dfd = $q.defer();
    var self = this;

    var predicate = new Predicate('e.validated').equals(true);
    Expression.find(null, predicate).then(function (expressions) {
        var i;
        var matches = [];
        var match;

        // TODO: Take into account expressions that typically follow the previous expression chain
        for (i = 0; i < expressions.length; i++) {
            match = {
                expression: Expression.process(expressions[i]),
                score: {}
            };
            match.score.jwDist = nlp.JaroWinklerDistance(match.expression.normalized, expression.normalized);
            match.score.lDist = nlp.LevenshteinDistance(match.expression.normalized, expression.normalized);
            match.score.dcDist = nlp.DiceCoefficient(match.expression.normalized, expression.normalized);

            matches.push(match);
        }

        self._sortMatches(matches);

        dfd.resolve({
            expression: matches[0].expression,
            confidence: matches[0].confidence
        });
    }, function (e) {
        dfd.reject(e);
    });

    return dfd.promise;
};

Brain.prototype._sortMatches = function (matches) {
    if (!matches) {
        return [];
    }

    var calculateConfidence = function (match) {
        var lDistWeight = 4;
        var jwDistWeight = 4;
        var dcDistWeight = 4;
        var totalWeight = lDistWeight + jwDistWeight + dcDistWeight;

        var lDist = match.score.lDist;
        var jwDist = match.score.jwDist;
        var dcDist = match.score.dcDist;

        if (lDist === 0) {
            lDist = 1;
        } else {
            lDist = 1 / lDist;
        }

        lDist *= lDistWeight;
        jwDist *= jwDistWeight;
        dcDist *= dcDistWeight;

        match.confidence = (lDist + jwDist + dcDist) / totalWeight;
    };

    matches.sort(function (a, b) {
        if (!a.confidence && a.confidence !== 0) {
            calculateConfidence(a);
        }
        if (!b.confidence && b.confidence !== 0) {
            calculateConfidence(b);
        }

        if (a.confidence > b.confidence) {
            return -1;
        }
        if (a.confidence < b.confidence) {
            return 1;
        }
        return 0;
    });

    return matches;
};

Brain.prototype._handleBestMatch = function (result, response, expression) {
    this._setIntent(result.match.expression.intent);

    var self = this;
    return Expression.inflate(result.match.expression).then(function (matchedExpression) {
        result.match.trigger = matchedExpression.trigger;
        result.match.injector = matchedExpression.injector;

        return self._handleTrigger(matchedExpression.trigger, expression, result.entities).then(function (response) {
            if (response || response === "") {
                if (response instanceof Array) {
                    response = response[Math.floor(Math.random() * response.length)];
                }
                self._setIntent("");
                return response;
            }
            return self._getResponse(matchedExpression, result.entities);
        });
    });
};

Brain.prototype._handleUnknownMatch = function (expression) {
    var dfd = $q.defer();

    var responses = [
        new Expression("I'm not sure I understand."),
        new Expression("I'm not sure I understand what you mean."),
        new Expression("I'm not sure I know what you mean."),
        new Expression("I'm not sure I understand what you're saying."),
        new Expression("I'm not sure I know what you're saying."),
        new Expression("I'm not sure I understand what you mean by '" + expression.value + "'."),
        new Expression("I'm not sure I know what you mean by '" + expression.value + "'."),
        new Expression("I'm not sure I understand what you mean when you say, '" + expression.value + "'."),
        new Expression("I'm not sure I know what you mean when you say, '" + expression.value + "'."),
        new Expression("I don't understand."),
        new Expression("I don't understand what you mean."),
        new Expression("I don't know what you mean."),
        new Expression("I don't understand what you're saying."),
        new Expression("I don't know what you're saying."),
        new Expression("I don't understand what you mean by '" + expression.value + "'."),
        new Expression("I don't know what you mean by '" + expression.value + "'."),
        new Expression("I don't understand what you mean when you say, '" + expression.value + "'."),
        new Expression("I don't know what you mean when you say, '" + expression.value + "'."),
        new Expression("I'm sorry, I'm not sure I understand."),
        new Expression("I'm sorry, I'm not sure I understand what you mean."),
        new Expression("I'm sorry, I'm not sure I know what you mean."),
        new Expression("I'm sorry, I'm not sure I understand what you're saying."),
        new Expression("I'm sorry, I'm not sure I know what you're saying."),
        new Expression("I'm sorry, I'm not sure I understand what you mean by '" + expression.value + "'."),
        new Expression("I'm sorry, I'm not sure I know what you mean by '" + expression.value + "'."),
        new Expression("I'm sorry, I'm not sure I understand what you mean when you say, '" + expression.value + "'."),
        new Expression("I'm sorry, I'm not sure I know what you mean when you say, '" + expression.value + "'."),
        new Expression("I'm sorry, I don't understand."),
        new Expression("I'm sorry, I don't understand what you mean."),
        new Expression("I'm sorry, I don't know what you mean."),
        new Expression("I'm sorry, I don't understand what you're saying."),
        new Expression("I'm sorry, I don't know what you're saying."),
        new Expression("I'm sorry, I don't understand what you mean by '" + expression.value + "'."),
        new Expression("I'm sorry, I don't know what you mean by '" + expression.value + "'."),
        new Expression("I'm sorry, I don't understand what you mean when you say, '" + expression.value + "'."),
        new Expression("I'm sorry, I don't know what you mean when you say, '" + expression.value + "'.")
    ];

    var responseExpression = this._getBestResponseExpression(responses);
    dfd.resolve(responseExpression.value);

    return dfd.promise;
};

Brain.prototype._handleResponse = function (result, response, expression) {
    result.response = response;

    /**
     * If this is not debug mode, create links between what was said and the previous transcript. Also generate new
     * nodes for what was said and the response.
     */
    // TODO: Handle multiple sentences
    if (this._debug !== true) {
        /*var self = this;
         expression.setTrigger(result.match.trigger);
         expression.setInjector(result.match.injector);
         expression.intent = result.match.intent;
         Expression.save(expression).then(function (expression) {
         if (expression) {
         var query;
         var params;
         var rel;
         if (self._transcript[0] && self._transcript[0].expression.value !== expression.value) {
         query = ['MATCH (le:Expression) WHERE ID(le) = {lastExpressionId}'];
         rel = self._transcript[0].expression.intent || 'transfer';
         query.push('MERGE (le)-[r:' + rel + ']->(e)');
         query.push('ON CREATE SET r.weight = 1, r.validated = false');
         query.push('ON MATCH SET r.weight = r.weight + 1');
         params = {
         lastExpressionId: self._transcript[0].expression._id
         };
         db.executeCypher(query, params);
         }
         self._transcript.unshift({
         dir: Brain.TRANSCRIPT_DIR.RECEIVED,
         expression: expression
         });
         }
         });*/
    }

    var data = {
        input: result.input,
        normalized: result.normalized,
        entities: result.entities,
        response: result.response
    };

    if (result.match) {
        data.match = {
            expression: result.match.expression.value,
            trigger: result.match.trigger,
            confidence: result.match.confidence
        };
    }

    return data;
};

Brain.prototype._getResponse = function (expression, expressionEntities) {
    var dfd = $q.defer();
    var self = this;

    this._getResponseChain(expression, expressionEntities).then(function (expressions) {
        if (expressions.length > 0) {
            var i;
            var promises = [];

            var success = function (inflatedResponseExpression) {
                if (inflatedResponseExpression.injector) {
                    return self._handleInjector(inflatedResponseExpression.injector, inflatedResponseExpression, expressionEntities).then(function (response) {
                        return response;
                    });
                } else {
                    return inflatedResponseExpression.value;
                }
            };

            for (i = 0; i < expressions.length; i++) {
                promises.push(Expression.inflate(expressions[i]).then(success));
            }

            $q.all(promises).then(function (responses) {
                var sentences = self._joinSentenceChain(responses);
                dfd.resolve(sentences);
            });
        } else {
            dfd.resolve("");
        }
    }, function (e) {
        dfd.reject(e);
    });

    return dfd.promise;
};

Brain.prototype._getResponseChain = function (expression, entities) {
    var self = this;
    var dfd = $q.defer();
    var expressions = [];

    var findNext = function (expression, transfer) {
        Expression.findNextExpressions(expression, transfer, self._intent).then(function (results) {
            if (results.length > 0) {
                self._filterResponsesByCondition(results, entities, expression).then(function (exps) {
                    if (exps.length > 0) {
                        var expression = self._getBestResponseExpression(exps);
                        expressions.push(expression);
                        self._setIntent(expression.intent);
                        findNext(expression, false);
                    } else {
                        dfd.resolve(expressions);
                    }
                });
            } else {
                dfd.resolve(expressions);
            }
        }, function (e) {
            console.log(e);
            dfd.resolve(expressions);
        });
    };

    findNext(expression, true);

    return dfd.promise;
};

/**
 *
 * @param {{expression: Expression, condition: String}[]} responses
 * @param {Array} entities
 * @param {Expression} expression
 * @returns {*|jQuery.promise|promise.promise|d.promise|promise}
 * @private
 */
Brain.prototype._filterResponsesByCondition = function (responses, entities, expression) {
    var dfd = $q.defer();
    var expressions = [];
    var promises = [];
    var i;

    var success = function (truthy) {
        if (truthy) {
            expressions.push(this.expression);
        }
    };

    for (i = 0; i < responses.length; i++) {
        if (responses[i].condition) {
            promises.push(this._handleCondition(responses[i].condition, expression, entities).then(success.bind(responses[i])));
        } else {
            expressions.push(responses[i].expression);
        }
    }

    $q.all(promises).then(function () {
        dfd.resolve(expressions);
    });

    return dfd.promise;
};

Brain.prototype._joinSentenceChain = function (sentences) {
    var results = [];
    var i;
    for (i = 0; i < sentences.length; i++) {
        if (sentences[i]) {
            if (sentences[i].match(/(\?|!|\.)$/) === null) {
                sentences[i] += ".";
            }
            results.push(sentences[i]);
        }
    }
    return results.join(" ");
};

Brain.prototype._getBestResponseExpression = function (responseExpressions) {
    // TODO: Use something other than a random generator.
    return responseExpressions[Math.floor(Math.random() * responseExpressions.length)];
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

    if (!trigger) {
        dfd.resolve();
    } else if (this._triggers[trigger]) {
        this._triggers[trigger](dfd, expression, entities || []);
    }

    return dfd.promise;
};

/**
 * Resolve conditions on relationships to check if the expression is a valid response
 *
 * @param {String} condition The name of the condition to call {namespace + "." + method}
 * @param {Expression} expression The matched expression
 * @param {Array} entities The entities extracted from the matched expression
 * @returns {*|jQuery.promise|promise.promise|d.promise|promise} Should be resolved with true or false
 * @private
 */
Brain.prototype._handleCondition = function (condition, expression, entities) {
    var dfd = $q.defer();

    if (!condition) {
        dfd.resolve(false);
    } else if (this._conditions[condition]) {
        this._conditions[condition](dfd, expression, entities);
    } else {
        var result = false;
        /* jshint ignore:start */
        try {
            result = eval("!!(" + condition + ")");
        } catch (e) {
            console.log('Brain Error: Evaluation failed for condition: ' + condition + '" - ' + e);
            result = false;
        }
        /* jshint ignore:end */
        dfd.resolve(result);
    }

    return dfd.promise;
};

/**
 * Handles module injections into response expressions
 *
 * @param {String} injector The name of the injector to call {namespace + "." + method}
 * @param {Expression} expression The matched expression
 * @param {Array} matchEntities The entities extracted from the matched expression
 * @returns {*|jQuery.promise|promise.promise|d.promise|promise} Should be resolved with a string (the response)
 * @private
 */
Brain.prototype._handleInjector = function (injector, expression, matchEntities) {
    var dfd = $q.defer();

    if (!expression) {
        dfd.reject('Brain Error: No expression to inject into.');
    } else if (injector && this._injectors[injector]) {
        expression = Expression.process(expression);
        var entities = this._extractExpressionEntities(expression);
        this._injectors[injector](dfd, expression, entities, matchEntities || []);
    } else {
        dfd.resolve(expression.value);
    }

    return dfd.promise;
};

Brain.prototype._extractExpressionEntities = function (expression) {
    var entities = [];

    var entity;
    for (entity in this._entities) {
        if (this._entities.hasOwnProperty(entity)) {
            if (typeof this._entities[entity].extract === 'function') {
                entities = entities.concat(this._entities[entity].extract(expression));
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
            if (self._entities[module.namespace]) {
                console.log('Brain Error: Entity Namespace conflict: ' + module.namespace);
            } else {
                self._entities[module.namespace] = module.entity;
            }
        } else {
            console.log('Brain Error: Invalid Entity module: ' + module.namespace);
        }
    });
};

Brain.prototype._initializeModules = function () {
    var self = this;
    var normalizedPath = path.join(__dirname, "../modules");

    fs.readdirSync(normalizedPath).forEach(function (file) {
        var module = require("./../modules/" + file);
        if (typeof module.Constructor === 'function' && module.namespace && module.namespace.indexOf('.') === -1) {
            if (self._modules[module.namespace]) {
                console.log('Brain Error: Module Namespace conflict: ' + module.namespace);
            } else {
                self._modules[module.namespace] = new module.Constructor(function (value) {
                    if (self._debug === true) {
                        return;
                    }
                    if (!value) {
                        console.log('Brain Error: Module: "' + module.namespace + '" attempted to create a trigger with invalid arguments.');
                        return;
                    }

                    var query = [
                        'MERGE (t:Trigger {value: {value}})'
                    ];

                    var params = {
                        value: module.namespace + '.' + value
                    };

                    return db.executeCypher(query, params);
                }, function (value) {
                    if (self._debug === true) {
                        return;
                    }
                    if (!value) {
                        console.log('Brain Error: Module: "' + module.namespace + '" attempted to create an injector with invalid arguments.');
                        return;
                    }

                    var query = [
                        'MERGE (i:Injector {value: {value}})'
                    ];

                    var params = {
                        value: module.namespace + '.' + value
                    };

                    return db.executeCypher(query, params);
                }, function (name) {
                    return memory.get(module.namespace + '.' + name);
                }, function (name, value) {
                    return memory.set(module.namespace + '.' + name, value, self._debug === true);
                });

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
                    if (theModule.injectors) {
                        for (method in theModule.injectors) {
                            if (theModule.injectors.hasOwnProperty(method) && typeof theModule.injectors[method] === 'function') {
                                self._injectors[module.namespace + '.' + method] = theModule.injectors[method].bind(self);
                            }
                        }
                    }
                }

            }
        } else {
            console.log('Brain Error: Invalid Module: "' + module.namespace + '"');
        }
    });
};

module.exports = Brain;