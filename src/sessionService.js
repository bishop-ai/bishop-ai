var BISHOP_AI = (function (module) {
    'use strict';

    var sessionService = {
        sessions: {}
    };

    sessionService.getOrCreateSession = function (id, username) {
        if (this.sessions.hasOwnProperty(id)) {
            return this.sessions[id];
        }

        var session = new module.Session();
        session.link(username);
        this.sessions[id] = session;

        return session;
    };

    sessionService.newSession = function () {
        var id = module.utils.generateUuid();
        var session = new module.Session();
        this.sessions[id] = session;

        return session;
    };

    sessionService.getSession = function (id) {
        if (this.sessions.hasOwnProperty(id)) {
            return this.sessions[id];
        }
        return null;
    };

    module.sessionService = sessionService;

    return module;
}(BISHOP_AI || {}));