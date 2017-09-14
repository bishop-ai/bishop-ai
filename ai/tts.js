var fs = require('fs');
var path = require('path');
var $q = require('q');
var uuid = require('./../utils/uuid');

var cache = require('./../utils/cache');
var configuration = require('./configuration');
var pluginLoader = require('./pluginLoader');

var TTS = function () {
    this._audioUrl = cache.cacheUrl + 'audio/';
    this._audioDir = cache.cacheDir + 'audio/';
    this.audioCache = cache.read('audio.json');
};

TTS.prototype.getCachedAudioFile = function (message) {
    if (this.audioCache && this.audioCache[message] && fs.existsSync(this._audioDir + this.audioCache[message])) {
        return this.audioCache[message];
    }
    return null;
};

TTS.prototype.cacheResponse = function (message, fileName) {
    if (!this.audioCache) {
        this.audioCache = {};
    }
    this.audioCache[message] = fileName;
    cache.write('audio.json', this.audioCache);
};

TTS.prototype.writeAudio = function (audioStream, text) {
    var self = this;
    var dfd = $q.defer();
    var fileName = uuid.generate() + '.wav';

    if (!fs.existsSync(this._audioDir)) {
        fs.mkdirSync(this._audioDir);
    }

    var wstream = fs.createWriteStream(this._audioDir + fileName);
    wstream.on('finish', function () {
        if (cache !== false) {
            self.cacheResponse(text, fileName);
        }

        dfd.resolve(self._audioUrl + fileName);
    });
    wstream.on('error', function (error) {
        console.log('TTS: Error: ' + error);
        dfd.reject(error);
    });

    audioStream.pipe(wstream);

    return dfd.promise;
};

TTS.prototype.synthesize = function (text, cache) {
    var dfd = $q.defer();
    var self = this;

    if (text) {
        var fileName;
        if (cache !== false) {
            fileName = this.getCachedAudioFile(text);
        }

        if (fileName) {
            console.log('TTS: Sending Cached Message: "' + text + '"');
            dfd.resolve(this._audioUrl + fileName);
        } else {
            console.log('TTS: Fetching Audio: "' + text + '"');

            return this.getStream(text).then(function (stream) {
                return self.writeAudio(stream, text);
            }, function (e) {
                console.log('TTS: Could not get message to synthesize: ' + e);
                dfd.resolve();
            });
        }
    } else {
        console.log('TTS: No message to synthesize.');
        dfd.resolve();
    }

    return dfd.promise;
};

TTS.prototype.getStream = function (text) {
    var ttsPlugin = null;
    if (pluginLoader.plugins.TTS && pluginLoader.plugins.TTS.length > 0) {
        var i;
        for (i = 0; i < pluginLoader.plugins.TTS.length; i++) {
            if (pluginLoader.plugins.TTS[i].enabled) {
                ttsPlugin = pluginLoader.plugins.TTS[i];
                break;
            }
        }
    }

    if (!ttsPlugin) {
        return $q.reject("No TTS plugin was enabled.");
    }

    return ttsPlugin.service.getStream(text);
};

module.exports = TTS;