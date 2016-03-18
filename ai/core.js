var Brain         = require('./brain'),
    configuration = require('./configuration'),
    memory        = require('./memory'),
    STT           = require('./stt'),
    TTS           = require('./../tts/tts-apiai');

/**
 * The core is the main point of interaction. It handles input and output.
 */
function Core(io) {
    memory.init();
    this._brain = new Brain();
    this._stt = new STT();
    this._tts = new TTS();
    this._io = io;

    this._io.on('connection', this._handleConnection.bind(this));
}

Core.prototype._handleConnection = function (client) {
    var self = this;

    client.on('command', function (command) {
        try {
            self._brain.processExpression(command).then(function (result) {
                if (result) {
                    if (configuration.settings.tts.enabled) {
                        self._tts.synthesize(result.response).then(function (audioFile) {
                            if (audioFile) {
                                client.emit('response', {
                                    message: result.response,
                                    audio: audioFile
                                });
                            }
                        }, function (e) {
                            console.log('Core Error: ' + e);
                        });
                    } else {
                        client.emit('response', {
                            message: result.response,
                            audio: null
                        });
                    }
                }
            });
        } catch (e) {
            console.log(e);
        }
    });

};

module.exports = Core;