var db = require('./../utils/db');
var nlp = require('./../nlp');

var Expression = function (value) {
    this._id = null;
    this.value = value || "";
    this.normalized = "";
    this.intent = "";
    this.validated = false;

    this.tokens = [];
    this.tags = [];
    this.qType = null;
    this.qClass = null;

    this.trigger = null;
    this.injector = null;
};

Expression.prototype.clean = function () {
    if (this.value) {
        this.value = nlp.normalizer.clean(this.value);
        this.normalized = nlp.normalizer.applySubstitutions(this.value);
    }
    return this;
};

Expression.prototype.setTrigger = function (trigger) {
    if (typeof trigger === "string") {
        this.trigger = trigger;
    } else if (trigger && trigger.value) {
        this.trigger = trigger.value;
    } else {
        this.trigger = null;
    }
};

Expression.prototype.setInjector = function (injector) {
    if (typeof injector === "string") {
        this.injector = injector;
    } else if (injector && injector.value) {
        this.injector = injector.value;
    } else {
        this.injector = null;
    }
};

Expression.find = function (id, predicate) {
    var query;
    var params;

    if (id) {
        query = ['MATCH (e:Expression) WHERE ID(e) = {id}'];

        if (predicate) {
            query.push('AND ' + predicate.parsePredicate());
        }

        query.push('RETURN e');

        params = {
            id: id
        };

        return db.executeCypher(query, params).then(function (results) {
            return results.data[0];
        }, function (e) {
            console.log(e);
            return e;
        });
    } else {
        query = ['MATCH (e:Expression)'];

        if (predicate) {
            query.push('WHERE ' + predicate.parsePredicate());
        }

        query.push('RETURN e');

        params = {};

        return db.executeCypher(query, params).then(function (results) {
            return results.data;
        }, function (e) {
            console.log(e);
            return e;
        });
    }
};

Expression.findNextExpressions = function (expression, transfer, intent) {
    intent = intent || "general";

    var query = [
        'MATCH (e:Expression) WHERE ID(e) = {id}',
        'OPTIONAL MATCH (e)-[r:' + intent + ']->(ne:Expression)',
        'WHERE ne.validated = true AND r.validated = true AND r.transfer = {transfer}'
    ];

    var params = {
        id: expression._id,
        transfer: transfer,
        intent: intent
    };

    query.push('RETURN ne, r');

    return db.executeCypher(query, params).then(function (results) {
        var response = [];
        var i;
        var expression;

        for (i = 0; i < results.data.length; i++) {
            if (results.data[i][0]) {
                expression = new Expression(results.data[i][0].value);
                expression._id = results.data[i][0]._id;
                expression.intent = results.data[i][0].intent;
                expression.validated = results.data[i][0].validated;
                expression.normalized = results.data[i][0].normalized;
                response.push({
                    expression: expression,
                    condition: results.data[i][1].condition
                });
            }
        }

        return response;
    }, function (e) {
        console.log(e);
        return e;
    });
};

Expression.process = function (expression) {
    if (expression && expression.value) {
        expression.tokens = nlp.tokenize(expression.normalized);
        expression.tags = nlp.tag(expression.tokens);
        expression.qClass = nlp.classify(expression.normalized);
        expression.qType = nlp.qType(expression.normalized);
    }
    return expression;
};

Expression.inflate = function (expression) {
    var query = [
        'MATCH (e:Expression) WHERE ID(e) = {id}',
        'OPTIONAL MATCH (e)-[]-(t:Trigger)',
        'OPTIONAL MATCH (e)-[]-(i:Injector)',
        'RETURN t, i'
    ];
    var params = {
        id: expression._id
    };
    return db.executeCypher(query, params).then(function (results) {
        if (results.data[0][0]) {
            expression.trigger = results.data[0][0].value;
        }

        if (results.data[0][1]) {
            expression.injector = results.data[0][1].value;
        }
        return expression;
    }, function (e) {
        console.log(e);
        return e;
    });
};

Expression.save = function (expression) {
    var query = [
        'MERGE (e:Expression {value: {value}})',
        'SET e.normalized = {normalized}',
        'SET e.validated = {validated}'
    ];

    if (expression.intent || expression.intent === "") {
        query.push('SET e.intent = {intent}');
    }

    var params = expression;

    if (expression.trigger) {
        query.unshift('MATCH (t:Trigger {value: {trigger}})');
        query.push('MERGE (e)-[:' + Expression.TRIGGER_EXPRESSION_RELATIONSHIP + ']->(t)');
    }

    if (expression.injector) {
        query.unshift('MATCH (i:Injector {value: {injector}})');
        query.push('MERGE (i)-[:' + Expression.INJECTOR_EXPRESSION_RELATIONSHIP + ']->(e)');
    }

    query.push('RETURN e');

    return db.executeCypher(query, params).then(function (results) {
        if (results.data[0]) {
            expression._id = results.data[0]._id;
        }
        return expression;
    }, function (e) {
        console.log(e);
        return e;
    });
};

Expression.TRIGGER_EXPRESSION_RELATIONSHIP = 'triggers';
Expression.INJECTOR_EXPRESSION_RELATIONSHIP = 'injects_into';

module.exports = Expression;