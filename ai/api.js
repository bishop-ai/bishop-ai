var pjson = require('./../package.json');

var router = require('express').Router();
var npmKeyword = require('npm-keyword');

var auth = require('./auth');
var Brain = require('./brain');
var classifier = require('./classifier');
var pluginLoader = require('./pluginLoader');

var brain = new Brain();

router.get('/auth', auth.authorize, function (req, res) {
    res.status(204).send();
});

router.post('/auth', function (req, res) {
    var token = auth.getToken(req.body.username, req.body.password);

    if (token) {
        res.status(200).send({
            'token': token,
            'username': req.body.username
        });
    } else {
        res.status(401).send('Incorrect username or password.');
    }
});

router.delete('/auth', function (req, res) {
    var token = (typeof req === "string") ? req : req.body.token || req.headers['x-access-token'];
    if (token) {
        auth.refreshUserSecret(token);
        res.status(204).send();
    }
});

router.get('/test/:message', function (req, res) {
    var message = decodeURIComponent(req.params.message);

    auth.verifyToken(req, function (err, decoded) {
        brain.processExpression(message, decoded ? decoded.user : "").then(function (result) {
            res.send(result);
        }, function (err) {
            res.status(500).send(err);
        });
    });
});

router.post('/train', auth.authorize, function (req, res) {
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

router.post('/packages', auth.authorize, function (req, res) {
    if (!req.body || !req.body.name) {
        res.status(500).send("Invalid package");
    }

    pluginLoader.installPluginPackage(req.body.name, function (err) {
        if (err) {
            res.status(500).send('NPM install error: ' + err.message);
            return;
        }

        res.send(req.body.name + '@latest installed successfully');
    });
});

router.get('/plugins', function (req, res) {
    auth.verifyToken(req, function (err) {
        res.send(pluginLoader.sanitizePlugins(pluginLoader.getPlugins(), !err));
    });
});

router.get('/plugins/:name', function (req, res) {
    var plugin = pluginLoader.getPlugin(req.params.name);

    if (plugin) {
        auth.verifyToken(req, function (err) {
            res.send(pluginLoader.sanitizePlugins(plugin, !err));
        });
    } else {
        res.status(404).send();
    }
});

router.put('/plugins/:name', auth.authorize, function (req, res) {
    var plugin = pluginLoader.updatePlugin(req.params.name, req.body);

    if (plugin) {
        auth.verifyToken(req, function (err) {
            res.send(pluginLoader.sanitizePlugins(plugin, !err));
        });
    } else {
        res.status(404).send();
    }
});

module.exports = router;