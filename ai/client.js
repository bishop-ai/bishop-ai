var sessionService = require('./sessionService');
var authService = require('./authService');

var Client = function (ioClient) {
    this.session = sessionService.newSession();
    this.ioClient = ioClient;
    this.ioClient.on('command', this.handleCommand.bind(this));
};

Client.prototype.handleCommand = function (payload) {
    var self = this;

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
                self.emitEvent('response', {
                    message: result.response
                });
            }
        });
    });
};

Client.prototype.emitEvent = function (event, payload) {
    this.ioClient.emit(event, payload);
};

module.exports = Client;