var localStorage = require("./localStorage");
var utils = require("./utils");

var memory = {
    file: 'memory.json',
    storage: {}
};

var init = function () {
    var mem = localStorage.get(localStorage.keys.MEMORY);
    memory.storage = mem ? JSON.parse(mem) : {};
};

var commit = function () {
    localStorage.set(localStorage.keys.MEMORY, JSON.stringify(memory.storage));
};

memory.loadConfig = function (config) {
    this.storage = utils.extend(config, this.storage);
    commit();
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
};

memory.get = function (username) {
    this.storage[username] = this.storage[username] || {};
    return this.storage[username];
};

memory.set = function (username, memories) {
    this.storage[username] = memories;
    commit();
};

memory.getPluginSettings = function (pluginNamespace) {
    this.storage.pluginSettings = this.storage.pluginSettings || {};
    return this.storage.pluginSettings[pluginNamespace] || {};
};

memory.setPluginSettings = function (pluginNamespace, settings) {
    this.storage.pluginSettings = this.storage.pluginSettings || {};
    this.storage.pluginSettings[pluginNamespace] = settings;
    commit();
};

memory.isEnabledPlugin = function (pluginNamespace) {
    this.storage.enabledPlugins = this.storage.enabledPlugins || {};
    return this.storage.enabledPlugins[pluginNamespace] === true;
};

memory.setEnabledPlugin = function (pluginNamespace, enabled) {
    this.storage.enabledPlugins = this.storage.enabledPlugins || {};
    this.storage.enabledPlugins[pluginNamespace] = enabled;
    commit();
};

init();

module.exports = memory;