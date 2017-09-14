var extend = require('extend');
var cache = require('./../utils/cache');

var memory = {
    file: 'memory.json',
    storage: {
        longTerm: {},
        session: {}
    },
    currentSessionId: 0
};

memory.init = function () {
    extend(this.storage, cache.read(this.file));
};

memory.get = function (name) {
    if (name && this.storage.session[this.currentSessionId] && this.storage.session[this.currentSessionId][name]) {
        return this.storage.session[this.currentSessionId][name];
    }

    if (name && this.storage.longTerm[name]) {
        return this.storage.longTerm[name];
    }

    console.log('Memory Warning: No memory found by name: ' + name);
    return null;
};

memory.set = function (name, value, session) {
    if (!name || value === null || value === undefined) {
        console.log('Memory Error: Cannot store memory with name: ' + name);
        return;
    }

    if (session) {
        this.storage.session[this.currentSessionId] = this.storage.session[this.currentSessionId] || {};
        this.storage.session[this.currentSessionId][name] = value;
    } else {
        this.storage.longTerm[name] = value;
    }

    this._commit();
};

memory._commit = function () {
    cache.write(this.file, this.storage);
};

memory.init();

module.exports = memory;