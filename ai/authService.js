var jwt = require('jsonwebtoken');
var jws = require('jws');

var configuration = require('./configuration');

var authService = {};

authService.authorize = function (req, res, next) {
    authService.verifyToken(req, function (err, decoded) {
        if (err) {
            return res.status(401).send(err);
        } else {
            req.decoded = decoded;
            return next();
        }
    });
};

authService.verifyToken = function (req, cb) {
    var token = (typeof req === "string") ? req : req.body.token || req.headers['x-access-token'];
    if (token) {
        var decoded = jwt.decode(token);

        if (decoded && decoded.user && configuration.settings.users[decoded.user]) {
            var secret = configuration.settings.users[decoded.user].secret;

            jwt.verify(token, secret, function (err, decoded) {
                if (err) {
                    console.log('JWT Verification Error: ' + err);
                    return cb(err);
                } else {
                    return cb(null, decoded);
                }
            });
        } else {
            cb('Token invalid');
        }
    } else {
        cb('Token not provided');
    }
};

authService.refreshUserSecret = function (token) {
    if (token) {
        var decoded = jwt.decode(token);
        var username = decoded.user;
        configuration.refreshUserSecret(username);
    }
};

authService.getToken = function (username, password) {
    var token = null;

    if (username && password) {

        if (configuration.settings.users[username]) {
            var sig = jws.sign({
                header: { alg: 'HS256' },
                payload: password,
                secret: configuration.settings.secret
            });

            if (!configuration.settings.users[username].secret) {
                this.refreshUserSecret(username);
            }

            if (sig === configuration.settings.users[username].password) {
                token = jwt.sign({user: username}, configuration.settings.users[username].secret);
            }
        }
    }

    return token;
};

module.exports = authService;