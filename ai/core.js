var sessionService = require('./sessionService');
var authService = require('./authService');

/**
 * The core is the main point of interaction. It handles input and output.
 */
function Core(io) {
    this._io = io;
    this.session = null;
    this._io.on('connection', this._handleConnection.bind(this));
}

Core.prototype._handleConnection = function (client) {
    var self = this;

    this.session = sessionService.newSession();

    client.on('command', function (payload) {
        try {
            authService.verifyToken(payload.token, function (err, decoded) {

                if (self.session) {
                    if (err) {
                        self.session.unlink();
                    } else {
                        self.session.link(decoded.user);
                    }
                }

                self.session.processExpression(payload.command, decoded ? decoded.user : "").then(function (result) {
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