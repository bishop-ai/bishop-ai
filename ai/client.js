var sessionService = require('./sessionService');
var authService = require('./authService');

var Client = function (ioClient) {
    this.session = sessionService.newSession();
    this.ioClient = ioClient;
    this.ioClient.on('command', this.handleCommand.bind(this));
    this.ioClient.on('disconnect', this.close.bind(this));
    console.log("Client: session connected.");
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

            self.session.processExpression(payload.command, decoded ? decoded.user : "").then(function (result) {
                if (result) {
                    self.emitEvent('response', {
                        message: result.response
                    });
                }
            }, function (e) {
                console.log("Client: unexpected error: " + e);
            }, function (intermediateResponse) {
                if (intermediateResponse) {
                    self.emitEvent('response', {
                        message: intermediateResponse.response
                    });
                }
            });
        }
    });
};

Client.prototype.emitEvent = function (event, payload) {
    this.ioClient.emit(event, payload);
};

Client.prototype.close = function () {
    this.session = null;
    console.log("Client: session closed.");
};

module.exports = Client;