var Session = require('./session');
var uuid = require('./uuid');

var sessionService = {
    sessions: {}
};

sessionService.newSession = function () {
    var id = uuid.generate();
    var session = new Session();
    this.sessions[id] = session;

    return session;
};

sessionService.getSession = function (id) {
    if (this.sessions.hasOwnProperty(id)) {
        return this.sessions[id];
    }
    return null;
};

module.exports = sessionService;