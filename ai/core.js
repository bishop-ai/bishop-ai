var Brain = require('./brain');
var auth = require('./auth');

/**
 * The core is the main point of interaction. It handles input and output.
 */
function Core(io) {
    this._brain = new Brain();
    this._io = io;

    this._io.on('connection', this._handleConnection.bind(this));
}

Core.prototype._handleConnection = function (client) {
    var self = this;

    client.on('command', function (payload) {
        try {
            auth.verifyToken(payload.token, function (err, decoded) {
                self._brain.processExpression(payload.command, decoded ? decoded.user : "").then(function (result) {
                    if (result) {
                        client.emit('response', {
                            message: result.response
                        });
                    }
                });
            });
        } catch (e) {
            console.log(e);
        }
    });

};

module.exports = Core;