var $q = require('q');

var db = require('./../utils/db');

var memory = {
    _store: {}
};

memory.get = function (name) {
    if (!name) {
        return $q.reject('No memory name supplied');
    }

    if (memory._store[name] !== undefined) {
        var dfd = $q.defer();
        dfd.resolve(memory._store[name]);
        return dfd.promise;
    }

    var query = [
        'MATCH (c:Concept) WHERE c.name = {name} RETURN c'
    ];

    var params = {
        name: name
    };

    return db.executeCypher(query, params).then(function (results) {
        if (results.data[0]) {
            return results.data[0].value;
        }
        return null;
    });
};

memory.set = function (name, value, shortTerm) {
    if (!name || value === null || value === undefined) {
        return $q.reject('Attempted to create a memory with invalid arguments.');
    }

    var dfd = $q.defer();
    memory._store[name] = value;

    if (shortTerm !== true) {
        var query = [
            'MERGE (c:Concept {name: {name}})',
            'SET c.value = {value}'
        ];

        var params = {
            name: name,
            value: value
        };

        return db.executeCypher(query, params);
    } else {
        dfd.resolve();
    }

    return dfd.promise;
};

memory.init = function () {
    var query = [
        'MATCH (c:Concept) RETURN c'
    ];

    return db.executeCypher(query).then(function (results) {
        var i;
        for (i = 0; i < results.data.length; i++) {
            memory._store[results.data[i].name] = results.data[i].value;
        }
        console.log("Memory Initialized");
    });
};

module.exports = memory;