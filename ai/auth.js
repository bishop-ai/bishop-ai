var jwt = require('jsonwebtoken');
var jws = require('jws');

var configuration = require('./configuration');

var auth = {};

auth.authorize = function (req, res, next) {
    auth.verifyToken(req, function (err) {
        if (err) {
            return res.status(401).send(err);
        } else {
            return next();
        }
    });
};

auth.verifyToken = function (req, cb) {
    var token = req.body.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, configuration.settings.secret, function (err, decoded) {
            if (err) {
                console.error('JWT Verification Error', err);
                return cb(err);
            } else {
                req.decoded = decoded;
                return cb();
            }
        });
    } else {
        cb('Token not provided');
    }
};

auth.getToken = function (username, password) {
    var token = null;

    if (username && password) {

        if (configuration.settings.users[username]) {
            var sig = jws.sign({
                header: { alg: 'HS256' },
                payload: password,
                secret: configuration.settings.secret
            });

            if (sig === configuration.settings.users[username]) {
                token = jwt.sign({user: username}, configuration.settings.secret, {expiresIn: 24 * 60 * 60});
            }
        }
    }

    return token;
};

module.exports = auth;