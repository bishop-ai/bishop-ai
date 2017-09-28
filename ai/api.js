var router = require('express').Router();

var Brain = require('./brain');
var classifier = require('./classifier');
var pluginLoader = require('./pluginLoader');

var brain = new Brain();

var sanitizePlugins = function (input) {
    if (input instanceof Array) {
        var plugins = [];

        var i;
        for (i = 0; i < input.length; i++) {
            plugins.push(sanitizePlugins(input[i]));
        }

        return plugins;
    }

    return {
        namespace: input.namespace,
        description: input.description,
        enabled: input.enabled
    };
};

router.get('/test/:message', function (req, res) {
    var message = decodeURIComponent(req.params.message);
    brain.processExpression(message).then(function (result) {
        res.send(result);
    }, function (err) {
        res.status(500).send(err);
    });
});

router.post('/train', function (req, res) {
    classifier.train().then(function () {
        res.send();
    }, function (err) {
        res.status(500).send(err);
    });
});

router.get('/plugins', function (req, res) {
    res.send(sanitizePlugins(pluginLoader.getPlugins()));
});

router.get('/plugins/:namespace', function (req, res) {
    var plugin = pluginLoader.getPlugin(req.params.namespace);

    if (plugin) {
        res.send(sanitizePlugins(plugin));
    } else {
        res.status(404).send();
    }
});

router.put('/plugins/:namespace', function (req, res) {
    var plugin = pluginLoader.updatePlugin(req.params.namespace, req.body);

    if (plugin) {
        res.send(sanitizePlugins(plugin));
    } else {
        res.status(404).send();
    }
});

module.exports = router;