var fs = require("fs");
var path = require("path");

var configuration = require('./configuration');
var commonExtractor = require('../utils/entityExtractor');
var commonExpressions = require('../utils/expressions');

var pluginLoader = {
    plugins: {
        "TTS": [],
        "ENTITY_EXTRACTOR": [],
        "SKILL": []
    },
    types: {
        "TTS": {
            "getStream": "function"
        },
        "ENTITY_EXTRACTOR": {
            "extract": "function"
        },
        "SKILL": {
            "intent": "object",
            "triggers": "object"
        }
    }
};

var Plugin = function (service, namespace, type) {
    this.service = service;
    this.namespace = namespace;
    this.type = type;
    this.enabled = false;
};

pluginLoader.load = function () {
    console.log('Plugin Loader: Initializing plugins');

    var self = this;
    var normalizedPath = path.join(__dirname, "../plugins");

    var namespaces = {
        "TTS": [],
        "ENTITY_EXTRACTOR": [],
        "SKILL": []
    };

    fs.readdirSync(normalizedPath).forEach(function (file) {
        var module = require("./../plugins/" + file);

        if (typeof module.register === 'function' && module.type && module.namespace) {

            if (!self.plugins.hasOwnProperty(module.type)) {
                console.log('Plugin Loader: Invalid plugin type: ' + module.type + " : " + module.namespace);
                return;
            }

            if (namespaces[module.type].indexOf(module.namespace) >= 0) {
                console.log('Plugin Loader: Module Namespace conflict: ' + module.namespace);
                return;
            }

            var config = {};
            if (module.type === "ENTITY_EXTRACTOR") {
                config = {
                    commonExtractor: commonExtractor,
                    commonExpressions: commonExpressions
                };
            } else if (configuration.settings.plugins[module.type][module.namespace]) {
                config = configuration.settings.plugins[module.type][module.namespace];
            }

            var plugin = new Plugin(module.register(config), module.namespace, module.type);

            var prop;
            for (prop in self.types[module.type]) {
                if (self.types[module.type].hasOwnProperty(prop)) {
                    if (typeof plugin.service[prop] !== self.types[module.type][prop]) {
                        console.log('Plugin Loader: Invalid plugin service signature: ' + module.namespace);
                        return;
                    }
                }
            }

            self.plugins[module.type].push(plugin);
            namespaces[module.type].push(module.namespace);

            if (configuration.settings.enabledPlugins[module.type].indexOf(plugin.namespace) >= 0) {

                plugin.enabled = true;
                console.log('Plugin Loader: Plugin enabled: "' + module.namespace + '"');
            } else {
                console.log('Plugin Loader: Plugin loaded: "' + module.namespace + '"');
            }

        }  else {
            console.log('Plugin Loader: Invalid plugin: "plugins/' + file + '"');
        }
    });

    console.log('Plugin Loader: Done initializing plugins');
};

module.exports = pluginLoader;