var fs = require("fs");
var path = require("path");
var $q = require('q');

var db = require('./db');
var Expression = require('./../models/expression');
var ExpressionLink = require('./../models/expressionLink');

var seeder = {};

seeder.plant = function (seedName) {
    var dfd = $q.defer();
    var self = this;
    var normalizedPath = path.join(__dirname, "../seeds");

    var linkMap = [];
    var expressions = [];
    var links = [];

    fs.readdirSync(normalizedPath).forEach(function (file) {
        if (!seedName || file.match(seedName)) {
            var seed = require("./../seeds/" + file);
            if (seed instanceof Array) {
                var result = self._loadSeed(seed);
                linkMap = linkMap.concat(result.linkMap);
                expressions = expressions.concat(result.expressions);
                links = links.concat(result.links);
            } else {
                console.log('Seeder: Invalid seed: ' + file);
            }
        }
    });

    var expressionDfd = $q.defer();
    var saveExpression = function (index) {
        Expression.save(expressions[index]).then(function () {
            if (expressions[index + 1]) {
                saveExpression(index + 1);
            } else {
                expressionDfd.resolve();
            }
        });
    };

    var linkDfd = $q.defer();
    var saveLink = function (index) {
        ExpressionLink.save(links[index]).then(function () {
            if (links[index + 1]) {
                saveLink(index + 1);
            } else {
                linkDfd.resolve();
            }
        });
    };

    saveExpression(0);
    expressionDfd.promise.then(function () {
        saveLink(0);
    });

    linkDfd.promise.then(function () {
        dfd.resolve(linkMap);
    });

    return dfd.promise;
};

seeder._loadSeed = function (seed) {
    var links = [];
    var linkMap = [];
    var expressions = [];
    var expressionMap = [];
    var pointers = {};

    var loadNode = function (node, lastNode, intent, transfer) {
        if (node.pointer >= 0) {
            pointers[node.pointer] = node;
        }

        var pointer = {};
        if (node._pointer >= 0) {
            if (pointers[node._pointer]) {
                pointer = pointers[node._pointer];
            } else {
                console.log('Seeder: Could not find pointer: ' + node._pointer);
                return;
            }
        }

        var nodeExpressions = [];
        if (node.expressions) {
            nodeExpressions = nodeExpressions.concat(node.expressions);
        }
        if (pointer.expressions) {
            nodeExpressions = nodeExpressions.concat(pointer.expressions);
        }

        node = {
            intent: node.intent,
            condition: node.condition,
            expressions: nodeExpressions,
            follow: node.follow || pointer.follow || [],
            transfer: node.transfer || pointer.transfer || []
        };

        if ((node.intent === null || node.intent === undefined) && (pointer.intent || pointer.intent === "")) {
            node.intent = pointer.intent;
        }
        if ((node.condition === null || node.condition === undefined) && (pointer.condition || pointer.condition === "")) {
            node.condition = pointer.condition;
        }

        var e;
        var le;
        var link;
        if (lastNode) {
            for (le = 0; le < lastNode.expressions.length; le++) {
                for (e = 0; e < node.expressions.length; e++) {
                    link = lastNode.expressions[le].value + "  -->  " + ((intent) ? (" [" + intent + "] ") : "") + ((node.condition) ? (" [" + node.condition + "] ") : "") + ((transfer) ? (" [transfer] ") : "") + ((intent || node.condition || transfer) ? ("  -->  ") : "") + node.expressions[e].value + ((node.intent || node.intent === "") ? (" [" + node.intent + "]") : "");
                    if (linkMap.indexOf(link) === -1) {
                        linkMap.push(link);
                        link = new ExpressionLink(intent, lastNode.expressions[le], node.expressions[e], transfer, node.condition);
                        link.validated = true;
                        links.push(link);
                    }
                }
            }
        }

        var expression;
        for (e = 0; e < node.expressions.length; e++) {
            if (expressionMap.indexOf(node.expressions[e].value) === -1) {
                expressionMap.push(node.expressions[e].value);
                expression = new Expression(node.expressions[e].value);
                expression.validated = true;
                expression.intent = node.intent;
                expression.clean();
                if (node.expressions[e].trigger) {
                    expression.setTrigger(node.expressions[e].trigger);
                }
                if (node.expressions[e].injector) {
                    expression.setInjector(node.expressions[e].injector);
                }
                expressions.push(expression);
            }
        }

        if (node.intent === "") {
            intent = "";
        } else if (node.intent) {
            intent = node.intent;
        }

        for (e = 0; e < node.follow.length; e++) {
            loadNode(node.follow[e], node, intent, false);
        }
        for (e = 0; e < node.transfer.length; e++) {
            loadNode(node.transfer[e], node, intent, true);
        }

        lastNode = null;
    };

    var i;
    for (i = 0; i < seed.length; i++) {
        loadNode(seed[i]);
    }

    return {
        expressions: expressions,
        links: links,
        linkMap: linkMap
    };
};

module.exports = seeder;