var db = require('./../utils/db');

var ExpressionLink = function (intent, prevExpression, nextExpression, transfer, condition) {
    this._id = null;
    this.intent = intent || "general";
    this.validated = false;
    this.transfer = transfer !== false;
    this.condition = condition || null;

    this.weight = null;
    this.prevExpression = prevExpression || null;
    this.nextExpression = nextExpression || null;
};

ExpressionLink.save = function (link) {
    var query = [
        'MATCH (e1:Expression {value: {e1v}})',
        'MATCH (e2:Expression {value: {e2v}})',
        'MERGE (e1)-[r:LEADS_TO {transfer: {transfer}, intent: {intent}}]->(e2)',
        'ON CREATE SET r.weight = 1, r.validated = {validated}',
        'ON MATCH SET r.weight = r.weight + 1',
        'SET r.condition = {condition}'
    ];

    if (link.validated === true) {
        query[query.length - 1] += ', r.validated = {validated}';
    }

    var params = {
        e1v: link.prevExpression.value,
        e2v: link.nextExpression.value,
        transfer: link.transfer,
        intent: link.intent,
        validated: link.validated,
        condition: link.condition
    };

    query.push('RETURN r');

    return db.executeCypher(query, params).then(function (results) {
        if (results.data[0]) {
            link._id = results.data[0]._id;
            link.weight = results.data[0].weight;
            link.validated = results.data[0].validated;
        }
        return link;
    }, function (e) {
        console.log(e);
        return e;
    });
};

module.exports = ExpressionLink;