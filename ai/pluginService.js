var pjson = require('./../package.json');

var extend = require('extend');
var EventEmitter = require('events');
var findPlugins = require('find-plugins');
var npmi = require('npmi');

var configuration = require('./configuration');
var intentService = require('./intentService');
var memory = require('./memory');
var nlp = require('../nlp');

var emitter = new EventEmitter();

var pluginService = {
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

Plugin.prototype.register = function () {
    var config = {};
    if (configuration.settings.pluginSettings[this.namespace]) {
        config = extend(config, configuration.settings.pluginSettings[this.namespace]);
    }

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
                this.intentMatchers.push(new intentService.Matcher(intent.value, intent.trigger, intent.context));
            }
        }
    }
    if (service.hasOwnProperty("options")) {
        this.options = service.options;
    }
};

pluginService.onPluginEnabled = function (listener) {
    emitter.on("pluginEnabled", listener);
};

pluginService.onPluginDisabled = function (listener) {
    emitter.on("pluginDisabled", listener);
};

pluginService.installPluginPackage = function (pkgName, cb) {
    var options = {
        name: pkgName,
        version: 'latest',
        path: '.'
    };
    npmi(options, function (err) {
        if (!err) {
            pluginService.load();
        }

        cb(err);
    });
};

pluginService.load = function () {
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

pluginService.loadModule = function (module, pkg) {
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

pluginService.getPlugins = function () {
    return this.plugins || [];
};

pluginService.getEnabledPlugins = function () {
    var plugins = this.getPlugins();

    return plugins.filter(function (plugin) {
        return plugin.enabled;
    });
};

pluginService.getPlugin = function (name) {
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

pluginService.updatePlugin = function (pluginName, updateTemplate, user) {
    var plugin = this.getPlugin(pluginName);

    if (updateTemplate && plugin) {

        // Only allow enabling and disabling plugins as an admin
        if (user && user.admin) {
            if (updateTemplate.enabled) {
                this.enablePlugin(plugin);
            } else {
                this.disablePlugin(plugin);
            }
        }

        if (updateTemplate.hasOwnProperty('options')) {
            var memories = memory.get(user.username);

            var option;
            for (option in updateTemplate.options) {
                if (updateTemplate.options.hasOwnProperty(option) && plugin.options.hasOwnProperty(option)) {
                    plugin.options[option].value = updateTemplate.options[option].value;
                    memory.setShortTerm(memories, plugin.namespace + "." + option, plugin.options[option].value);
                }
            }

            memory.set(user.username, memories);
        }
    }

    return plugin;
};

pluginService.enablePlugin = function (plugin) {
    plugin.register();
    plugin.enabled = true;

    if (configuration.setPluginAsEnabled(plugin)) {
        emitter.emit('pluginEnabled', plugin);
    }
};

pluginService.disablePlugin = function (plugin) {
    plugin.enabled = false;

    if (configuration.setPluginAsDisabled(plugin)) {
        emitter.emit('pluginDisabled', plugin);
    }
};

pluginService.sanitizePlugins = function (input, user) {
    if (input instanceof Array) {
        var plugins = [];

        var i;
        for (i = 0; i < input.length; i++) {
            plugins.push(this.sanitizePlugins(input[i]));
        }

        return plugins;
    }

    var plugin = input;

    var triggers = [];
    var contextTriggers = [];

    var trigger;
    for (trigger in plugin.triggers) {
        if (plugin.triggers.hasOwnProperty(trigger)) {
            triggers.push(trigger);
        }
    }
    for (trigger in plugin.contextTriggers) {
        if (plugin.contextTriggers.hasOwnProperty(trigger)) {
            contextTriggers.push(trigger);
        }
    }

    var options = null;

    if (user) {
        var memories = memory.get(user.username);
        var option;
        var name;
        for (option in plugin.options) {
            if (plugin.options.hasOwnProperty(option)) {
                name = plugin.namespace + "." + option;
                options = options || {};
                options[option] = extend({}, plugin.options[option]);
                if (memories[name]) {
                    options[option].value = memories[name];
                }
            }
        }
    }

    return {
        name: plugin.name,
        description: plugin.description,
        namespace: plugin.namespace,
        options: options,
        enabled: plugin.enabled,
        triggers: triggers,
        contextTriggers: contextTriggers,
        examples: plugin.examples
    };
};

module.exports = pluginService;