var $q = require('q');
var request = require('request');

var configuration = require('./../ai/configuration');
var TTS = require('./../ai/tts');

var TTSApiAI = function () {
    TTS.call(this);
};

TTSApiAI.prototype = Object.create(TTS.prototype);
TTSApiAI.prototype.constructor = TTS;

TTSApiAI.prototype.getStream = function (text) {
    var dfd = $q.defer();
    var uri = 'https://api.api.ai/v1/tts?v=20160301&text=' + encodeURIComponent(text);

    request.debug = true;
    var pipe = request.get({
        url: uri,
        method: 'GET',
        headers: {
            'Authorization': "Bearer " + configuration.settings.tts.apiai.token,
            'ocp-apim-subscription-key': configuration.settings.tts.apiai.key,
            'Accept-Language': "en-US"
        }
    }).on('response', function (response) {
        console.log(response.statusCode);
        console.log(response.headers['content-type']);
    }).on('error', function (err) {
        console.log(err);
    });
    dfd.resolve(pipe);

    return dfd.promise;
};

module.exports = TTSApiAI;