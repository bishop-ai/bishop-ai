var BISHOP_AI = (function (module) {
    'use strict';

    /**
     * The API class interfaces with the core AI engine
     */
    var api = {
        handlers: [],
        userConfig: null,
        session: null
    };

    api.sendResponse = function (data) {
        var i;
        for (i = 0; i < this.handlers.length; i++) {
            this.handlers[i](data);
        }
    };

    module.loadConfig = function (config) {
        module.memory.loadConfig(config);
    };

    module.startSession = function () {
        api.session = module.sessionService.newSession();
        if (api.userConfig) {
            api.session.loadConfig(api.userConfig);
            api.userConfig = null;
        }
    };

    module.loadUserConfig = function (config) {
        if (api.session) {
            api.session.loadConfig(config);
        } else {
            api.userConfig = config;
        }
    };

    module.linkSession = function (username) {
        api.session.link(username);
    };

    module.unlinkSession = function () {
        api.session.unlink();
    };

    module.sendCommand = function (message) {
        if (api.session) {
            api.session.processExpression(message, api.session).then(function (result) { // TODO: Pass in the user
                if (result) {
                    api.sendResponse(result);
                }
            }, function (e) {
                console.error("API: unexpected error: " + e);
            }, function (intermediateResponse) {
                if (intermediateResponse) {
                    api.sendResponse(intermediateResponse);
                }
            });
        }
    };

    module.onResponse = function (handler) {
        if (api.handlers.indexOf(handler) >= 0) {
            return;
        }
        api.handlers.push(handler);

        return function () {
            var idx = self.handlers.indexOf(handler);
            if (idx >= 0) {
                api.handlers.splice(idx, 1);
            }
        };
    };

    module.getPlugins = function () {
        var plugins = module.pluginService.getPlugins();
        return module.pluginService.sanitizePlugins(plugins, api.session);
    };

    module.getPlugin = function (namespace) {
        var plugin = module.pluginService.getPlugin(namespace);
        return module.pluginService.sanitizePlugins(plugin, api.session);
    };

    module.updatePlugin = function (namespace, plugin) {
        return module.pluginService.updatePlugin(namespace, plugin, api.session);
    };

    return module;
}(BISHOP_AI || {}));