var extend = require('extend');
var cache = require('./../utils/cache');

var configuration = {
    file: 'configuration.json',
    settings: {
        neo4j: {
            host: "http://localhost:7474"
        },
        tts: {
            enabled: true,
            username: null,
            password: null,
            voice: null
        },
        stt: {
            token: null
        },
        modules: {}
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