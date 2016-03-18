var fs = require('fs');
var path = require('path');
var $q = require('q');
var uuid = require('./../utils/uuid');

var cache = require('./../utils/cache');
var configuration = require('./configuration');

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
            });
        }
    } else {
        console.log('TTS: No message to synthesize.');
        dfd.resolve();
    }

    return dfd.promise;
};

TTS.prototype.getStream = function (text) {
    var dfd = $q.defer();
    dfd.reject("This must be overridden");
    return dfd.promise;
};

module.exports = TTS;