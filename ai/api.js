var pjson = require('./../package.json');

var router = require('express').Router();
var npmKeyword = require('npm-keyword');
var npmi = require('npmi');
var path = require('path');

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

    var triggers = [];
    var contextTriggers = [];

    var trigger;
    for (trigger in input.triggers) {
        if (input.triggers.hasOwnProperty(trigger)) {
            triggers.push(trigger);
        }
    }
    for (trigger in input.contextTriggers) {
        if (input.contextTriggers.hasOwnProperty(trigger)) {
            contextTriggers.push(trigger);
        }
    }

    return {
        name: input.name,
        description: input.description,
        namespace: input.namespace,
        options: input.options,
        enabled: input.enabled,
        triggers: contextTriggers,
        contextTriggers: contextTriggers,
        examples: input.examples
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

router.get('/packages', function (req, res) {
    npmKeyword(pjson.name + " plugin").then(function (packages) {
        res.send(packages);
    });
});

router.post('/packages', function (req, res) {
    if (!req.body || !req.body.name) {
        res.status(500).send("Invalid package");
    }

    // TODO: Install as bundle dependency
    var options = {
        name: req.body.name,
        version: 'latest',
        path: '.'
    };
    npmi(options, function (err) {
        if (err) {
            if (err.code === npmi.LOAD_ERR) {
                res.status(500).send('NPM load error: ' + err.message);
            } else {
                res.status(500).send('NPM install error: ' + err.message);
            }
            return;
        }

        res.send(options.name + '@' + options.version + ' installed successfully in ' + path.resolve(options.path));
        pluginLoader.load();
    });
});

router.get('/plugins', function (req, res) {
    res.send(sanitizePlugins(pluginLoader.getPlugins()));
});

router.get('/plugins/:name', function (req, res) {
    var plugin = pluginLoader.getPlugin(req.params.name);

    if (plugin) {
        res.send(sanitizePlugins(plugin));
    } else {
        res.status(404).send();
    }
});

router.put('/plugins/:name', function (req, res) {
    var plugin = pluginLoader.updatePlugin(req.params.name, req.body);

    if (plugin) {
        res.send(sanitizePlugins(plugin));
    } else {
        res.status(404).send();
    }
});

module.exports = router;