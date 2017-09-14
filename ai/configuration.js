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
        {value: "Stop talking", trigger: "ai.configuration.disableAudio"},
        {value: "Be quiet", trigger: "ai.configuration.disableAudio"},
        {value: "Disable Audio", trigger: "ai.configuration.disableAudio"},
        {value: "Resume talking", trigger: "ai.configuration.enableAudio"},
        {value: "Enable audio", trigger: "ai.configuration.enableAudio"}
    ],

    triggers: {
        enableAudio: function (dfd) {
            configuration.enableAudio();
            dfd.resolve([
                "Can you hear me now?",
                "Is that better?"
            ]);
        },

        disableAudio: function (dfd) {
            configuration.disableAudio();
            dfd.resolve();
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

configuration.setVoice = function (voice) {
    this.settings.tts.voice = voice;
    this._commit();
};

configuration._commit = function () {
    cache.write(this.file, this.settings);
};

configuration.init();

module.exports = configuration;