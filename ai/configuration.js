var extend = require('extend');

var cache = require('./cache');
var uuid = require('./uuid');

var configuration = {
    file: 'configuration.json',
    settings: {
        secret: "",
        users: {},
        enabledPlugins: [],
        pluginSettings: {}
    }
};

configuration.init = function () {
    extend(this.settings, cache.read(this.file));

    if (!this.settings.secret) {
        this.settings.secret = uuid.generate();
        this._commit();
    }
};

configuration.refreshUserSecret = function (username) {
    if (this.settings.users[username]) {
        this.settings.users[username].secret = uuid.generate();
        this._commit();
    }
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