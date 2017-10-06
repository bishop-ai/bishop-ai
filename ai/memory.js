var extend = require('extend');

var cache = require('./cache');

var memory = {
    file: 'memory.json',
    storage: {}
};

memory.init = function () {
    extend(this.storage, cache.read(this.file));
};

memory.getShortTerm = function (memoryBank, name) {
    if (name && memoryBank[name]) {
        return memoryBank[name];
    }

    console.log('Memory Warning: No short term memory found by name: ' + name);
    return null;
};

memory.setShortTerm = function (memoryBank, name, value) {
    if (!name) {
        console.log('Memory Error: Cannot store short term memory without name.');
        return;
    }

    if (value === null || value === undefined) {
        delete memoryBank[name];
    } else {
        memoryBank[name] = value;
    }

    var getMemory = function (name) {
        return memory.getShortTerm(memoryBank, this.namespace + "." + name);
    };

    var setMemory = function (name, value) {
        memory.setShortTerm(memoryBank, this.namespace + "." + name, value);
    };

    var pluginService = require('./pluginService');
    var plugins = pluginService.getEnabledPlugins();

    var i;
    var optionName;
    for (i = 0; i < plugins.length; i++) {
        if (name.indexOf((plugins[i].namespace + ".")) === 0) {
            optionName = name.substring((plugins[i].namespace + ".").length);
            if (plugins[i].hasOwnProperty("options") && plugins[i].options.hasOwnProperty(optionName) && typeof plugins[i].options[optionName].onChange === 'function') {
                plugins[i].options[optionName].onChange(getMemory.bind(plugins[i]), setMemory.bind(plugins[i]));
            }

            break;
        }
    }
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