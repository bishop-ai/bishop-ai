var axios = require('axios');

var intentService = require("./intentService");
var memory = require("./memory");
var nlp = require("./nlp/nlp");
var utils = require("./utils");

var pluginService = {
    plugins: [],
    namespaces: []
};

var Plugin = function (plugin) {
    this.registrationFunction = plugin.register;
    this.description = plugin.description || "";

    this.namespace = plugin.namespace;
    this.examples = plugin.examples || [];

    this.enabled = false;

    this.intentMatchers = [];
    this.triggers = {};
    this.options = null;
};

Plugin.prototype.register = function () {
    var config = utils.extend({}, memory.getPluginSettings(this.namespace) || {});

    var service = this.registrationFunction(config, nlp, axios);

    this.intentMatchers = [];
    this.triggers = {};

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
    if (service.hasOwnProperty("intent")) {
        var intent;
        for (i = 0; i < service.intent.length; i++) {
            intent = service.intent[i];
            if (intent.value && intent.trigger && this.triggers.hasOwnProperty(intent.trigger)) {
                this.intentMatchers.push(new intentService.Matcher(intent.value, intent.trigger, intent.expectations));
            }
        }
    }
    if (service.hasOwnProperty("options")) {
        this.options = service.options;
    }
};

pluginService.register = function (plugin) {
    plugin = new Plugin(plugin);

    this.plugins.push(plugin);
    this.namespaces.push(plugin.namespace);

    if (memory.isEnabledPlugin(plugin.namespace)) {
        this.enablePlugin(plugin);
        console.log('Plugin Loader: Plugin enabled: "' + plugin.namespace + '"');
    } else {
        this.disablePlugin(plugin);
        console.log('Plugin Loader: Plugin loaded: "' + plugin.namespace + '"');
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

pluginService.getPlugin = function (namespace) {
    var plugin = null;

    var plugins = this.getPlugins();
    var i;
    for (i = 0; i < plugins.length; i++) {
        if (plugins[i].namespace === namespace) {
            plugin = plugins[i];
            break;
        }
    }

    return plugin;
};

pluginService.updatePlugin = function (pluginNamespace, updateTemplate, session) {
    var plugin = this.getPlugin(pluginNamespace);

    if (updateTemplate && plugin) {

        if (!plugin.enabled && updateTemplate.enabled) {
            this.enablePlugin(plugin);
        } else if (plugin.enabled && !updateTemplate.enabled) {
            this.disablePlugin(plugin);
        }

        if (updateTemplate.hasOwnProperty('options') && session) {
            var option;
            for (option in updateTemplate.options) {
                if (updateTemplate.options.hasOwnProperty(option) && plugin.options.hasOwnProperty(option)) {
                    plugin.options[option].value = updateTemplate.options[option].value;
                    session.setMemory(plugin.namespace + "." + option, plugin.options[option].value);
                }
            }
        }
    }

    return plugin;
};

pluginService.enablePlugin = function (plugin) {
    plugin.register();
    plugin.enabled = true;
    memory.setEnabledPlugin(plugin.namespace, true);
};

pluginService.disablePlugin = function (plugin) {
    plugin.enabled = false;
    memory.setEnabledPlugin(plugin.namespace, false);
};

pluginService.sanitizePlugins = function (input, session) {
    if (!input) {
        return input;
    }

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

    var trigger;
    for (trigger in plugin.triggers) {
        if (plugin.triggers.hasOwnProperty(trigger)) {
            triggers.push(trigger);
        }
    }

    var options = null;

    if (session) {
        var memories = memory.get(session.username);
        var option;
        var name;
        for (option in plugin.options) {
            if (plugin.options.hasOwnProperty(option)) {
                name = plugin.namespace + "." + option;
                options = options || {};
                options[option] = utils.extend({}, plugin.options[option]);
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
        examples: plugin.examples
    };
};

module.exports = pluginService;