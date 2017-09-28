var extend = require('extend');

var cache = require('./cache');

var configuration = {
    file: 'configuration.json',
    settings: {
        enabledPlugins: [],
        plugins: {}
    }
};

configuration.init = function () {
    extend(this.settings, cache.read(this.file));
};

configuration.setPluginSetting = function (namespace, key, value) {
    this.settings.plugins[namespace] = this.settings.plugins[namespace] || {};
    this.settings.plugins[namespace][key] = value;
    this._commit();
};

configuration.setPluginAsEnabled = function (plugin) {
    var changed = false;

    this.settings.enabledPlugins = this.settings.enabledPlugins || [];
    if (this.settings.enabledPlugins.indexOf(plugin.namespace) === -1) {
        this.settings.enabledPlugins.push(plugin.namespace);
        this._commit();
        changed = true;
    }

    return changed;
};

configuration.setPluginAsDisabled = function (plugin) {
    var changed = false;

    this.settings.enabledPlugins = this.settings.enabledPlugins || [];
    var index = this.settings.enabledPlugins.indexOf(plugin.namespace);
    if (index >= 0) {
        this.settings.enabledPlugins.splice(index, 1);
        this._commit();
        changed = true;
    }

    return changed;
};

configuration._commit = function () {
    cache.write(this.file, this.settings);
};

configuration.init();

module.exports = configuration;