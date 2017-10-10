var jwt = require('jsonwebtoken');
var q = require('q');

var configuration = require('./configuration');
var userService = require('./userService');

/**
 * The Authentication Service handles all user authentication requests and manages JSON Web Tokens
 */
var authService = {};

/**
 * Middleware to authenticate an API route as user
 *
 * @param {Object} req The request
 * @param {Object} res The response
 * @param {Function} next Proceed to next middleware
 */
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

/**
 * Middleware to authenticate an API route as admin
 *
 * @param {Object} req The request
 * @param {Object} res The response
 * @param {Function} next Proceed to next middleware
 */
authService.authorizeAsAdmin = function (req, res, next) {
    authService.authorize(req, res, function () {
        if (!req.user.admin) {
            return res.status(401).send("Admin permission required.");
        }
        return next();
    });
};

/**
 * Verifies and decodes a token. This returns either an error or the decoded token with the user that it belongs to.
 *
 * @param {Object|String} token The token or a request object
 * @param {Function} cb The callback with err, decodedToken, user
 */
authService.verifyToken = function (token, cb) {
    token = (typeof token === "string") ? token : token.body.token || token.headers['x-access-token'];

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

/**
 * Invalidates all issued tokens for a given user that matches the token passed into the request.
 *
 * @param {Object} req The request
 */
authService.logout = function (req) {

    // If the token is valid, log the user out that the token is for
    this.verifyToken(req, function (err, decoded, user) {
        if (user) {
            // This will invalidate all tokens signed with the old secret
            userService.refreshUserSecret(user.username);
        }
    });
};

/**
 * Issues a token provided a valid username and password.
 *
 * @param {String} username The username
 * @param {String} password The password
 * @returns {String} The issued token
 */
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

/**
 * Creates a new user and issues a token for the user.
 *
 * @param {String} username The username
 * @param {String} password The password
 * @returns {Promise} A promise resolved with the user and token
 */
authService.register = function (username, password) {
    var dfd = q.defer();

    if (username && password) {

        // If this is the first user created, create it as the Admin user
        var isAdmin = userService.count() === 0;

        userService.createUser(username, password, isAdmin).then(function (user) {
            dfd.resolve({
                user: user,
                token: jwt.sign({user: user.username}, user.secret)
            });
        }, function (err) {
            dfd.reject(err);
        });
    } else {
        dfd.reject("Username and password are required.");
    }

    return dfd.promise;
};

module.exports = authService;