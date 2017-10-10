var pjson = require('./../package.json');

var router = require('express').Router();
var npmKeyword = require('npm-keyword');

var authService = require('./authService');
var classifier = require('./classifier');
var pluginService = require('./pluginService');

// Get Authentication Status and Token User
router.get('/auth', authService.authorize, function (req, res) {
    res.status(200).send(req.user);
});

// Login
router.post('/auth', function (req, res) {
    var token = authService.login(req.body.username, req.body.password);

    if (token) {
        res.status(200).send({
            'token': token,
            'user': req.user
        });
    } else {
        res.status(401).send('Incorrect username or password.');
    }
});

// Logout
router.delete('/auth', function (req, res) {
    authService.logout(req);
    res.status(204).send();
});

// Register
router.post('/users', function (req, res) {
    authService.register(req.body.username, req.body.password).then(function (response) {
        res.status(200).send({
            'token': response.token,
            'user': response.user
        });
    }, function (e) {
        res.status(500).send(e);
    });
});

// Train Classifier
router.post('/train', authService.authorizeAsAdmin, function (req, res) {
    classifier.train().then(function () {
        res.send();
    }, function (err) {
        res.status(500).send(err);
    });
});

// Get Available Plugins
router.get('/packages', function (req, res) {
    npmKeyword(pjson.name + " plugin").then(function (packages) {
        res.send(packages);
    });
});

// Install New Plugin
router.post('/packages', authService.authorizeAsAdmin, function (req, res) {
    if (!req.body || !req.body.name) {
        res.status(500).send("Invalid package");
    }

    pluginService.installPluginPackage(req.body.name, function (err) {
        if (err) {
            res.status(500).send('NPM install error: ' + err.message);
            return;
        }

        res.send(req.body.name + '@latest installed successfully');
    });
});

// Get Installed Plugins
router.get('/plugins', function (req, res) {
    authService.verifyToken(req, function (err, decoded, user) {
        res.send(pluginService.sanitizePlugins(pluginService.getPlugins(), user));
    });
});

// Get Installed Plugin
router.get('/plugins/:name', function (req, res) {
    var plugin = pluginService.getPlugin(req.params.name);

    if (plugin) {
        authService.verifyToken(req, function (err, decoded, user) {
            res.send(pluginService.sanitizePlugins(plugin, user));
        });
    } else {
        res.status(404).send();
    }
});

// Update Installer Plugin
router.put('/plugins/:name', authService.authorize, function (req, res) {
    var plugin = pluginService.getPlugin(req.params.name);

    if (plugin) {
        plugin = pluginService.updatePlugin(req.params.name, req.body, req.user);
        res.send(pluginService.sanitizePlugins(plugin, req.user));
    } else {
        res.status(404).send();
    }
});

module.exports = router;