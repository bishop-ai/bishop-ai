#!/bin/env node
var bodyParser = require('body-parser');
var express = require('express');
var http = require('http');
var methodOverride = require('method-override');
var socket = require('socket.io');
var path = require('path');

var Brain = require('./ai/brain');
var classifier = require('./ai/classifier');
var Core = require('./ai/core');
var pluginLoader = require('./ai/pluginLoader');

var Server = function () {

    var self = this;

    this.ipaddress = "localhost";
    this.port = 3000;

    var apiRoutes = require('./ai/api');

    this.app = express();

    this.app.use(bodyParser.json());
    this.app.use(methodOverride('X-HTTP-Method-Override'));

    this.app.use(express.static(__dirname + '/public'));
    this.app.use('/lib', express.static(__dirname + '/node_modules'));
    this.app.use('/cache', express.static(__dirname + '/cache'));
    this.app.use('/cache', express.static(__dirname + '/cache'));
    this.app.use('/api', apiRoutes);

    this.server = http.createServer(this.app);

    this.server.listen(this.port, this.ipaddress, function () {
        console.log('Server started on %s:%d ...', self.ipaddress, self.port);
    });

    pluginLoader.load();

    Brain.initialize();

    classifier.load();
    classifier.train(Brain.intents);

    this.io = socket(this.server);
    this.Core = new Core(this.io);
};

var server = new Server();