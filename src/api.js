var memory = require("./memory");
var pluginService = require("./pluginService");
var sessionService = require("./sessionService");

/**
 * The API class interfaces with the core AI engine
 */
var api = {};

api.loadConfig = function (config) {
    memory.loadConfig(config);
};

api.startSession = function (userConfig) {
    return sessionService.newSession(userConfig);
};

api.getSession = function (sessionId) {
    return sessionService.getSession(sessionId);
};

api.registerPlugin = function (pluginConfig) {
    pluginService.register(pluginConfig);
};

api.getPlugins = function () {
    var plugins = pluginService.getPlugins();
    return pluginService.sanitizePlugins(plugins);
};

api.getPlugin = function (namespace) {
    var plugin = pluginService.getPlugin(namespace);
    return pluginService.sanitizePlugins(plugin);
};

api.updatePlugin = function (namespace, plugin) {
    return pluginService.updatePlugin(namespace, plugin);
};

module.exports = api;