var jwt = require('jsonwebtoken');

var configuration = require('./configuration');
var userService = require('./userService');

var authService = {};

authService.authorize = function (req, res, next) {
    authService.verifyToken(req, function (err, decoded, user) {
        if (err) {
            return res.status(401).send(err);
        } else {
            req.decoded = decoded;
            req.user = user;
            return next();
        }
    });
};

authService.authorizeAsAdmin = function (req, res, next) {
    authService.authorize(req, res, function () {
        if (!req.user.admin) {
            return res.status(401).send("Admin permission required.");
        }
        return next();
    });
};

authService.verifyToken = function (req, cb) {
    var token = (typeof req === "string") ? req : req.body.token || req.headers['x-access-token'];
    if (token) {
        var decoded = jwt.decode(token);

        var user;
        if (decoded && decoded.user) {
            user = userService.getUser(decoded.user);
        }

        if (user) {

            // Remove the user secret from the user entity.
            var sanitizedUser = userService.sanitizeUser(user);

            jwt.verify(token, user.secret, function (err, decoded) {
                if (err) {
                    console.log('JWT Verification Error: ' + err);
                    return cb(err);
                } else {
                    return cb(null, decoded, sanitizedUser);
                }
            });
        } else {
            cb('Token invalid');
        }
    } else {
        cb('Token not provided');
    }
};

authService.logout = function (req) {

    // If the token is valid, log the user out that the token is for
    this.verifyToken(req, function (err, decoded, user) {
        if (user) {
            // This will invalidate all tokens signed with the old secret
            userService.refreshUserSecret(user.username);
        }
    });
};

authService.login = function (username, password) {
    var token = null;

    if (username && password) {
        var user = userService.getUser(username);

        if (user && userService.validatePassword(user, password)) {
            token = jwt.sign({user: username}, user.secret);
        }
    }

    return token;
};

module.exports = authService;