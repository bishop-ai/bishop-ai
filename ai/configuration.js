var extend = require('extend');
var cache = require('./../utils/cache');

var configuration = {
    file: 'configuration.json',
    settings: {
        tts: {
            enabled: true
        },
        enabledPlugins: {
            "TTS": [],
            "ENTITY_EXTRACTOR": [],
            "SKILL": []
        },
        plugins: {
            "TTS": {},
            "ENTITY_EXTRACTOR": {},
            "SKILL": {}
        }
    }
};

configuration.skillService = {

    namespace: 'ai.configuration',

    intent: [
        {value: "Stop talking", trigger: "ai.configuration.configureAudio"},
        {value: "Be quiet", trigger: "ai.configuration.configureAudio"},
        {value: "Disable Audio", trigger: "ai.configuration.configureAudio"},
        {value: "Resume talking", trigger: "ai.configuration.configureAudio"},
        {value: "Enable audio", trigger: "ai.configuration.configureAudio"},
        {value: "Speak up", trigger: "ai.configuration.configureAudio"}
    ],

    triggers: {
        configureAudio: function (dfd, expression) {
            if (expression.contains("start", "enable", "louder", "up", "hear")) {
                configuration.enableAudio();
                dfd.resolve([
                    "Can you hear me now?",
                    "Is that better?"
                ]);
            } else {
                configuration.disableAudio();
                dfd.resolve([
                    "Done.",
                    "Of course."
                ]);
            }
        }
    }
};

configuration.init = function () {
    extend(this.settings, cache.read(this.file));
};

configuration.disableAudio = function () {
    this.settings.tts.enabled = false;
    this._commit();
};

configuration.enableAudio = function () {
    this.settings.tts.enabled = true;
    this._commit();
};

configuration.setSkillSetting = function (namespace, key, value) {
    this.settings.plugins.SKILL[namespace] = this.settings.plugins.SKILL[namespace] || {};
    this.settings.plugins.SKILL[namespace][key] = value;
    this._commit();
};

configuration._commit = function () {
    cache.write(this.file, this.settings);
};

configuration.init();

module.exports = configuration;