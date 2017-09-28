var fs = require("fs");
var path = require("path");
var EventEmitter = require('events');

var configuration = require('./configuration');
var intentMatcher = require('./intentMatcher');
var nlp = require('../nlp');

var emitter = new EventEmitter();

var pluginLoader = {
    plugins: [],
    namespaces: []
};

var Plugin = function (module) {
    this.registrationFunction = module.register;
    this.namespace = module.namespace;
    this.description = module.description || "";

    this.enabled = false;

    this.intentMatchers = [];
    this.triggers = {};
    this.contextTriggers = {};
    this.examples = [];
};

Plugin.prototype.register = function (config) {
    var service = this.registrationFunction(config, nlp);

    this.intentMatchers = [];
    this.triggers = {};
    this.contextTriggers = {};
    this.examples = [];

    if (service.hasOwnProperty("triggers")) {
        var trigger;
        for (trigger in service.triggers) {
            if (service.triggers.hasOwnProperty(trigger) && typeof service.triggers[trigger] === "function") {
                this.triggers[this.namespace + "." + trigger] = {
                    method: service.triggers[trigger],
                    namespace: this.namespace
                };
            }
        }
    }
    if (service.hasOwnProperty("context")) {
        var context;
        for (context in service.context) {
            if (service.context.hasOwnProperty(context) && this.triggers.hasOwnProperty(service.context[context])) {
                this.contextTriggers[this.namespace + "." + context] = service.context[context];
            }
        }
    }
    if (service.hasOwnProperty("intent")) {
        var i;
        var intent;
        for (i = 0; i < service.intent.length; i++) {
            intent = service.intent[i];
            if (intent.value && intent.trigger && this.triggers.hasOwnProperty(intent.trigger) && (!intent.context || this.contextTriggers.hasOwnProperty(intent.context))) {
                this.intentMatchers.push(new intentMatcher.Matcher(intent.value, intent.trigger, intent.context));
            }
        }
    }

    this.examples = service.examples || [];
};

pluginLoader.onPluginEnabled = function (listener) {
    emitter.on("pluginEnabled", listener);
};

pluginLoader.onPluginDisabled = function (listener) {
    emitter.on("pluginDisabled", listener);
};

pluginLoader.load = function () {
    console.log('Plugin Loader: Initializing plugins');

    var self = this;
    var normalizedPath = path.join(__dirname, "../plugins");

    fs.readdirSync(normalizedPath).forEach(function (file) {
        var module = require("./../plugins/" + file);

        if (typeof module.register === 'function' && module.namespace) {

            if (self.namespaces.indexOf(module.namespace) >= 0) {
                console.log('Plugin Loader: Module Namespace conflict: ' + module.namespace);
                return;
            }

            self.loadModule(module);

        }  else {
            console.log('Plugin Loader: Invalid plugin: "plugins/' + file + '"');
        }
    });

    console.log('Plugin Loader: Done initializing plugins');
};

pluginLoader.loadModule = function (module) {
    var plugin = new Plugin(module);

    this.plugins.push(plugin);
    this.namespaces.push(module.namespace);

    if (configuration.settings.enabledPlugins.indexOf(plugin.namespace) >= 0) {
        this.enablePlugin(plugin);
        console.log('Plugin Loader: Plugin enabled: "' + module.namespace + '"');
    } else {
        this.disablePlugin(plugin);
        console.log('Plugin Loader: Plugin loaded: "' + module.namespace + '"');
    }

    return plugin;
};

pluginLoader.getPlugins = function () {
    return this.plugins || [];
};

pluginLoader.getEnabledPlugins = function () {
    var plugins = this.getPlugins();

    return plugins.filter(function (plugin) {
        return plugin.enabled;
    });
};

pluginLoader.getPlugin = function (namespace) {
    var plugin = null;

    var plugins = this.getPlugins();
    var i;
    for (i = 0; i < plugins.length; i++) {
        if (plugins[i].namespace.toLowerCase() === namespace.toLowerCase()) {
            plugin = plugins[i];
            break;
        }
    }

    return plugin;
};

pluginLoader.updatePlugin = function (namespace, updateTemplate) {
    var plugin = this.getPlugin(namespace);

    if (updateTemplate && plugin) {
        if (updateTemplate.enabled) {
            this.enablePlugin(plugin);
        } else {
            this.disablePlugin(plugin);
        }
    }

    return plugin;
};

pluginLoader.enablePlugin = function (plugin) {
    var config = {};
    if (configuration.settings.plugins[plugin.namespace]) {
        config = configuration.settings.plugins[plugin.namespace];
    }

    plugin.register(config); // TODO: Just use long-term/session memory?

    plugin.enabled = true;

    if (configuration.setPluginAsEnabled(plugin)) {
        emitter.emit('pluginEnabled', plugin);
    }
};

pluginLoader.disablePlugin = function (plugin) {
    plugin.enabled = false;

    if (configuration.setPluginAsDisabled(plugin)) {
        emitter.emit('pluginDisabled', plugin);
    }
};

module.exports = pluginLoader;