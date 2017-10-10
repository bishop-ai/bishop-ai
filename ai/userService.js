var extend = require('extend');
var jws = require('jws');
var q = require('q');

var configuration = require('./configuration');
var uuid = require('./uuid');

var UserService = function () {};

/**
 * Encrypts a password using the system secret
 *
 * @param {String} password The password to encrypt
 * @returns {String} The encrypted password
 */
UserService.encryptPassword = function (password) {
    return jws.sign({
        header: { alg: 'HS256' },
        payload: password,
        secret: configuration.settings.secret
    });
};

/**
 * Returns a count of the number of users stored in the system
 *
 * @returns {Number} The total count
 */
UserService.prototype.count = function () {
    return Object.keys(configuration.settings.users).length;
};

/**
 * Creates a new user
 *
 * @param {String} username The username
 * @param {String} password The password
 * @param {Boolean} isAdmin If true, sets the new user as a admin
 * @returns {Promise} A promise resolved with the new user
 */
UserService.prototype.createUser = function (username, password, isAdmin) {
    var dfd = q.defer();

    var existing = this.getUser(username);

    if (existing) {
        dfd.reject("A user with that username already exists.");
    } else {
        var user = {
            username: username,
            password: UserService.encryptPassword(password),
            admin: isAdmin,
            secret: uuid.generate()
        };
        configuration.storeUser(user);

        dfd.resolve(user);
    }

    return dfd.promise;
};

/**
 * Gets a user by the username (case insensitive)
 *
 * @param {String} username The username of the user to find
 * @returns {Object} The user or null
 */
UserService.prototype.getUser = function (username) {
    var user = null;

    if (username && configuration.settings.users[username.toLowerCase()]) {
        user = configuration.settings.users[username.toLowerCase()];
    }

    return user;
};

/**
 * Validates a user's password.
 *
 * @param {Object} user The user containing the password to validate against
 * @param {String} password The password to validate
 * @returns {Boolean} True if the password matches the user's password
 */
UserService.prototype.validatePassword = function (user, password) {
    var valid = false;

    if (user && UserService.encryptPassword(password) === user.password) {
        valid = true;
    }

    return valid;
};

/**
 * Updates a user by the username in the template passed in
 *
 * @param {String} username The username of the user to update
 * @param {Object} userTemplate The user object with updates
 * @returns {Object} The updated user
 */
UserService.prototype.updateUser = function (username, userTemplate) {
    var user = null;

    if (username) {
        user = this.getUser(username);

        if (user) {

            // Only update password right now
            user.password = UserService.encryptPassword(userTemplate.password);
            configuration.storeUser(user);
        }
    }

    return user;
};

/**
 * Refreshes a user's secret used to sign auth tokens
 *
 * @param {String} username The username of the user to reset the token for
 */
UserService.prototype.refreshUserSecret = function (username) {
    var user = this.getUser(username);

    if (user) {
        user.secret = uuid.generate();
        configuration.storeUser(user);
    }
};

/**
 * Cleans the user object to remove the password and secret
 *
 * @param {Object} user The user to sanitize
 * @returns {Object} The sanitized user
 */
UserService.prototype.sanitizeUser = function (user) {
    user = extend({}, user);
    delete user.secret;
    delete user.password;
    return user;
};

module.exports = new UserService();