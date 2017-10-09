var pjson = require('./../package.json');

var router = require('express').Router();
var npmKeyword = require('npm-keyword');

var authService = require('./authService');
var classifier = require('./classifier');
var pluginService = require('./pluginService');

router.get('/auth', authService.authorize, function (req, res) {
    res.status(200).send(req.user);
});

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

router.delete('/auth', function (req, res) {
    authService.logout(req);
    res.status(204).send();
});

router.post('/train', authService.authorizeAsAdmin, function (req, res) {
    classifier.train().then(function () {
        res.send();
    }, function (err) {
        res.status(500).send(err);
    });
});

router.get('/packages', function (req, res) {
    npmKeyword(pjson.name + " plugin").then(function (packages) {
        res.send(packages);
    });
});

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

router.get('/plugins', function (req, res) {
    authService.verifyToken(req, function (err, decoded, user) {
        res.send(pluginService.sanitizePlugins(pluginService.getPlugins(), user));
    });
});

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