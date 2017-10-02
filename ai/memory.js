var extend = require('extend');

var cache = require('./cache');

var memory = {
    file: 'memory.json',
    storage: {
        longTerm: {},
        session: {}
    }
};

memory.init = function () {
    extend(this.storage, cache.read(this.file));
};

memory.get = function (name, username) {
    if (name && username && this.storage.session[username] && this.storage.session[username][name]) {
        return this.storage.session[username][name];
    }

    if (name && this.storage.longTerm[name]) {
        return this.storage.longTerm[name];
    }

    console.log('Memory Warning: No memory found by name: ' + name);
    return null;
};

memory.set = function (name, value) {
    if (!name || value === null || value === undefined) {
        console.log('Memory Error: Cannot store memory with name: ' + name);
        return;
    }

    this.storage.longTerm[name] = value;

    this._commit();
};

memory.setSessionMemory = function (name, value, username) {
    if (!name || value === null || value === undefined || !username) {
        console.log('Memory Error: Cannot store session memory with name: ' + name);
        return;
    }

    this.storage.session[username] = this.storage.session[username] || {};
    this.storage.session[username][name] = value;

    this._commit();
};

memory._commit = function () {
    cache.write(this.file, this.storage);
};

memory.init();

module.exports = memory;