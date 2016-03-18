var $q           = require('q'),
    wit          = require('node-wit'),
    BufferStream = require('./../utils/bufferStream');

var configuration = require('./configuration');

function STT() {
    this.token = configuration.settings.stt.token;
}

STT.prototype.capture = function (command) {
    if (typeof command === 'string') {
        return this.captureText(command);
    } else {
        return this.captureSpeech(command);
    }
};

STT.prototype.captureText = function (message) {
    var dfd = $q.defer();

    wit.captureTextIntent(this.token, message, function (err, res) {
        if (err) {
            dfd.reject(err);
            console.log("SST: Error: ", err);
        } else {
            console.log("SST: ");
            dfd.resolve(res);
        }
        console.log(JSON.stringify(res, null, " "));
    });

    return dfd.promise;
};

STT.prototype.captureSpeech = function (command) {
    var dfd = $q.defer();
    var stream = new BufferStream(command.blob);

    wit.captureSpeechIntent(this.token, stream, "audio/wav", function (err, res) {
        if (err) {
            dfd.reject(err);
            console.log("SST: Error: ", err);
        } else {
            console.log("SST: ");
            dfd.resolve(res);
        }
        console.log(JSON.stringify(res, null, " "));
    });

    return dfd.promise;
};

module.exports = STT;