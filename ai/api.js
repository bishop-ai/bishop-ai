var router = require('express').Router();

var Brain = new require('./brain');
var db = require('./../utils/db');
var Expression = require('./../models/expression');
var normalizer = require('./../nlp').normalizer;
var seeder = require('./../utils/seeder');
var scraper = require('./../utils/scraper');

var brain = new Brain(true);

router.get('/seed', function (req, res) {
    seeder.plant().then(function (result) {
        res.send(result);
    }, function (err) {
        res.status(500).send(err);
    });
});

router.get('/seed/:name', function (req, res) {
    seeder.plant(req.params.name).then(function (result) {
        res.send(result);
    }, function (err) {
        res.status(500).send(err);
    });
});

router.get('/test/:message', function (req, res) {
    var message = decodeURIComponent(req.params.message);
    brain.processExpression(message).then(function (result) {
        res.send(result);
    }, function (err) {
        res.status(500).send(err);
    });
});

router.get('/expressions', function (req, res) {
    var query = [
        'MATCH (e:Expression) RETURN e'
    ];
    var params = {};

    db.executeCypher(query, params).then(function (results) {
        res.send(results.data);
    }, function (err) {
        res.status(500).send(err);
    });
});

router.get('/inbox', function (req, res) {
    var query = [
        'MATCH (e1:Expression)-[r]->(e2:Expression) WHERE r.validated = false RETURN e1, e2, r, type(r)'
    ];
    var params = {};

    db.executeCypher(query, params).then(function (results) {
        var response = [];
        var result;
        var i;
        for (i = 0; i < results.data.length; i++) {
            result = {
                from: results.data[i][0],
                to: results.data[i][1],
                rel: results.data[i][2],
                relType: results.data[i][3]
            };
            response.push(result);
        }

        res.send(response);
    }, function (err) {
        res.status(500).send(err);
    });
});

router.post('/expression-chain', function (req, res) {
    if (!req.body.value) {
        return res.status(409).send('Incorrectly formed post body.');
    }
    var query = [
        'MERGE (e:Expression {value: {value}})',
        'SET e.normalized = {normalized}',
        'SET e.validated = true'
    ];
    var params = {
        value: normalizer.clean(req.body.value),
        normalized: normalizer.normalize(req.body.value)
    };

    var fromStateRel = (req.body.fromStateTransfer !== false) ? 'transfer' : 'continue';
    var toStateRel = (req.body.toStateTransfer !== false) ? 'transfer' : 'continue';

    var i;
    var token;
    var rToken;
    if  (req.body.fromExpressions && req.body.fromExpressions.length > 0) {
        for (i = 0; i < req.body.fromExpressions.length; i++) {
            token = 'fe' + i;
            rToken = 'fer' + i;
            query.unshift('MATCH (' + token + ':Expression) WHERE ID(' + token + ') = {' + token + '}');
            query.push('MERGE (' + token + ')-[' + rToken + ':' + fromStateRel + ']->(e)');
            query.push('ON CREATE SET ' + rToken + '.weight = 1, ' + rToken + '.validated = true');
            query.push('ON MATCH SET ' + rToken + '.weight = ' + rToken + '.weight + 1, ' + rToken + '.validated = true');
            params[token] = req.body.fromExpressions[i];
        }
    }
    if  (req.body.toExpressions && req.body.toExpressions.length > 0) {
        for (i = 0; i < req.body.toExpressions.length; i++) {
            token = 'te' + i;
            rToken = 'ter' + i;
            query.unshift('MATCH (' + token + ':Expression) WHERE ID(' + token + ') = {' + token + '}');
            query.push('MERGE (e)-[' + rToken + ':' + toStateRel + ']->(' + token + ')');
            query.push('ON CREATE SET ' + rToken + '.weight = 1, ' + rToken + '.validated = true');
            query.push('ON MATCH SET ' + rToken + '.weight = ' + rToken + '.weight + 1, ' + rToken + '.validated = true');
            params[token] = req.body.toExpressions[i];
        }
    }
    if (req.body.trigger) {
        query.unshift('MATCH (t:Trigger) WHERE ID(t) = {triggerId}');
        query.push('MERGE (e)-[:' + Expression.TRIGGER_EXPRESSION_RELATIONSHIP + ']->(t)');
        params.triggerId = req.body.trigger;
    }
    if (req.body.injector) {
        query.unshift('MATCH (i:Injector) WHERE ID(i) = {injectorId}');
        query.push('MERGE (i)-[:' + Expression.INJECTOR_EXPRESSION_RELATIONSHIP + ']->(e)');
        params.injectorId = req.body.injector;
    }

    query.push('RETURN e');

    db.executeCypher(query, params).then(function (results) {
        res.send(results.data[0]);
    }, function (err) {
        res.status(500).send(err);
    });
});

router.post('/validate-expression', function (req, res) {
    if (!req.body.id) {
        return res.status(409).send('Incorrectly formed post body.');
    }

    var query = [
        'MATCH (e:Expression) WHERE ID(e) = ' + req.body.id,
        'OPTIONAL MATCH (e)-[r]-(:Expression)'
    ];

    if (req.body.validated === true) {
        query.push('SET r.validated = true');
    } else {
        query.push('DELETE e, r');
    }

    db.executeCypher(query).then(function () {
        res.status(204).send();
    }, function (err) {
        res.status(500).send(err);
    });
});

router.post('/validate-rel', function (req, res) {
    if (!req.body.id) {
        return res.status(409).send('Incorrectly formed post body.');
    }

    var query = ['MATCH (:Expression)-[r]-(:Expression) WHERE ID(r) = ' + req.body.id];

    if (req.body.validated === true) {
        query.push('SET r.validated = true');
    } else {
        query.push('DELETE r');
    }

    db.executeCypher(query).then(function () {
        res.status(204).send();
    }, function (err) {
        res.status(500).send(err);
    });
});

router.get('/triggers', function (req, res) {
    var query = [
        'MATCH (t:Trigger) RETURN t'
    ];
    var params = {};

    db.executeCypher(query, params).then(function (results) {
        res.send(results.data);
    }, function (err) {
        res.status(500).send(err);
    });
});

router.get('/injectors', function (req, res) {
    var query = [
        'MATCH (i:Injector) RETURN i'
    ];
    var params = {};

    db.executeCypher(query, params).then(function (results) {
        res.send(results.data);
    }, function (err) {
        res.status(500).send(err);
    });
});

router.get('/scrape', function (req, res) {
    if (req.query.term) {
        scraper.search(req.query.term).then(function (results) {
            res.send(results);
        }, function (err) {
            res.status(500).send(err);
        });
    } else {
        res.status(200).send([]);
    }
});

module.exports = router;