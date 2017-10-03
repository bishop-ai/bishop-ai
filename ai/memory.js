var extend = require('extend');

var cache = require('./cache');

var memory = {
    file: 'memory.json',
    storage: {}
};

memory.init = function () {
    extend(this.storage, cache.read(this.file));
};

memory.get = function (username) {
    this.storage[username] = this.storage[username] || {};
    return this.storage[username];
};

memory.set = function (username, memories) {
    this.storage[username] = memories;
    this._commit();
};

memory._commit = function () {
    cache.write(this.file, this.storage);
};

memory.init();

module.exports = memory;