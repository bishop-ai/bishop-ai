var neo4j = require('node-neo4j');
var $q = require('q');

var configuration = require('./../ai/configuration');

var db = new neo4j(configuration.settings.neo4j.host);

db.executeCypher = function (query, params) {
    var dfd = $q.defer();

    if (query instanceof Array) {
        query = query.join('\n');
    }
    params = params || {};

    db.cypherQuery(query, params, function (err, results) {
        if (err) {
            console.log("Brain " + err);
            console.log(query);
            console.log(JSON.stringify(params, null, "  "));
            dfd.reject(err);
        } else {
            dfd.resolve(results);
        }
    });

    return dfd.promise;
};

module.exports = db;