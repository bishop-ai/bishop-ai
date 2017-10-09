var extend = require('extend');
var jws = require('jws');

var configuration = require('./configuration');
var uuid = require('./uuid');

var UserService = function () {};

UserService.encryptPassword = function (password) {
    return jws.sign({
        header: { alg: 'HS256' },
        payload: password,
        secret: configuration.settings.secret
    });
};

UserService.prototype.createUser = function (username, password, isAdmin) {
    var user = {
        username: username,
        password: UserService.encryptPassword(password),
        admin: isAdmin,
        secret: uuid.generate()
    };
    configuration.storeUser(user);

    return user;
};

UserService.prototype.getUser = function (username) {
    var user = null;

    if (username && configuration.settings.users[username]) {
        user = configuration.settings.users[username];
    }

    return user;
};

UserService.prototype.validatePassword = function (user, password) {
    var valid = false;

    if (user && UserService.encryptPassword(password) === user.password) {
        valid = true;
    }

    return valid;
};

UserService.prototype.updateUser = function (userTemplate) {
    var user = null;

    if (userTemplate.username) {
        user = this.getUser(userTemplate.username);
        user.password = UserService.encryptPassword(userTemplate.password);
        configuration.storeUser(user);
    }

    return user;
};

UserService.prototype.refreshUserSecret = function (username) {
    var user = this.getUser(username);

    if (user) {
        user.secret = uuid.generate();
        configuration.storeUser(user);
    }
};

UserService.prototype.sanitizeUser = function (user) {
    user = extend({}, user);
    delete user.secret;
    delete user.password;
    return user;
};

module.exports = new UserService();