var pjson = require('./../package.json');

var EventEmitter = require('events');
var findPlugins = require('find-plugins');
var npmi = require('npmi');

var configuration = require('./configuration');
var intentMatcher = require('./intentMatcher');
var nlp = require('../nlp');

var emitter = new EventEmitter();

var pluginLoader = {
    plugins: [],
    namespaces: []
};

var Plugin = function (module, pkg) {
    this.registrationFunction = module.register;
    this.name = pkg.name;
    this.description = pkg.description || "";

    this.namespace = module.namespace;
    this.examples = module.examples || [];

    this.enabled = false;

    this.intentMatchers = [];
    this.triggers = {};
    this.contextTriggers = {};
    this.options = null;
};

Plugin.prototype.register = function (config) {
    var service = this.registrationFunction(config, nlp);

    this.intentMatchers = [];
    this.triggers = {};
    this.contextTriggers = {};

    var i;

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
        var intent;
        for (i = 0; i < service.intent.length; i++) {
            intent = service.intent[i];
            if (intent.value && intent.trigger && this.triggers.hasOwnProperty(intent.trigger) && (!intent.context || this.contextTriggers.hasOwnProperty(intent.context))) {
                this.intentMatchers.push(new intentMatcher.Matcher(intent.value, intent.trigger, intent.context));
            }
        }
    }
    if (service.hasOwnProperty("options")) {
        this.options = service.options;
    }
};

pluginLoader.onPluginEnabled = function (listener) {
    emitter.on("pluginEnabled", listener);
};

pluginLoader.onPluginDisabled = function (listener) {
    emitter.on("pluginDisabled", listener);
};

pluginLoader.installPluginPackage = function (pkgName, cb) {
    var options = {
        name: pkgName,
        version: 'latest',
        path: '.'
    };
    npmi(options, function (err) {
        if (!err) {
            pluginLoader.load();
        }

        cb(err);
    });
};

pluginLoader.load = function () {
    console.log('Plugin Loader: Initializing plugins');

    var packages = findPlugins({
        keyword: pjson.name + " plugin"
    }) || [];

    var self = this;
    packages.forEach(function (result) {
        var pkg = result.pkg;
        var module = require(pkg.name);

        if (typeof module.register === 'function' && module.namespace) {

            if (self.namespaces.indexOf(module.namespace) >= 0) {
                console.log('Plugin Loader: Module Namespace conflict: ' + module.namespace);
                return;
            }

            self.loadModule(module, pkg);

        }  else {
            console.log('Plugin Loader: Invalid plugin: "' + pkg.name + '"');
        }
    });

    console.log('Plugin Loader: Done initializing plugins');
};

pluginLoader.loadModule = function (module, pkg) {
    var plugin = new Plugin(module, pkg);

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

pluginLoader.getPlugin = function (name) {
    var plugin = null;

    var plugins = this.getPlugins();
    var i;
    for (i = 0; i < plugins.length; i++) {
        if (plugins[i].name === name) {
            plugin = plugins[i];
            break;
        }
    }

    return plugin;
};

pluginLoader.updatePlugin = function (name, updateTemplate) {
    var plugin = this.getPlugin(name);

    if (updateTemplate && plugin) {
        if (updateTemplate.enabled) {
            this.enablePlugin(plugin);
        } else {
            this.disablePlugin(plugin);
        }

        if (updateTemplate.hasOwnProperty('options')) {
            plugin.options = updateTemplate.options;

            var option;
            for (option in plugin.options) {
                if (plugin.options.hasOwnProperty(option)) {
                    configuration.setPluginSetting(plugin.namespace, option, plugin.options[option].value);
                }
            }
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

    var option;
    for (option in plugin.options) {
        if (plugin.options.hasOwnProperty(option) && config[option]) {
            plugin.options[option].value = config[option];
        }
    }

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

pluginLoader.sanitizePlugins = function (input, allowOptions) {
    if (input instanceof Array) {
        var plugins = [];

        var i;
        for (i = 0; i < input.length; i++) {
            plugins.push(this.sanitizePlugins(input[i]));
        }

        return plugins;
    }

    var triggers = [];
    var contextTriggers = [];

    var trigger;
    for (trigger in input.triggers) {
        if (input.triggers.hasOwnProperty(trigger)) {
            triggers.push(trigger);
        }
    }
    for (trigger in input.contextTriggers) {
        if (input.contextTriggers.hasOwnProperty(trigger)) {
            contextTriggers.push(trigger);
        }
    }

    return {
        name: input.name,
        description: input.description,
        namespace: input.namespace,
        options: allowOptions ? input.options : null,
        enabled: input.enabled,
        triggers: contextTriggers,
        contextTriggers: contextTriggers,
        examples: input.examples
    };
};

module.exports = pluginLoader;