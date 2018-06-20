var Session = require("./session");
var utils = require("./utils");

var sessionService = {
    sessions: {}
};

sessionService.getOrCreateSession = function (id, username) {
    if (this.sessions.hasOwnProperty(id)) {
        return this.sessions[id];
    }

    var session = new Session();
    session.link(username);
    this.sessions[id] = session;

    return session;
};

sessionService.newSession = function (userConfig) {
    var id = utils.generateUuid();
    var session = new Session();
    this.sessions[id] = session;

    if (userConfig) {
        session.loadUserConfig(config);
    }

    return session;
};

sessionService.getSession = function (id) {
    if (this.sessions.hasOwnProperty(id)) {
        return this.sessions[id];
    }
    return null;
};

module.exports = sessionService;