var Brain = require('./brain');
var memory = require('./memory');

/**
 * The core is the main point of interaction. It handles input and output.
 */
function Core(io) {
    memory.init();
    this._brain = new Brain();
    this._io = io;

    this._io.on('connection', this._handleConnection.bind(this));
}

Core.prototype._handleConnection = function (client) {
    var self = this;

    client.on('command', function (command) {
        try {
            self._brain.processExpression(command).then(function (result) {
                if (result) {
                    client.emit('response', {
                        message: result.response
                    });
                }
            });
        } catch (e) {
            console.log(e);
        }
    });

};

module.exports = Core;