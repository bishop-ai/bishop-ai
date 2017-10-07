var xml = require('libxmljs');
var request = require('request');

var Wolfram = function (config) {

    this.intent = [
        {value: "Ask Wolfram *", trigger: "wolfram.query"}
    ];

    this.triggers = {
        query: function (dfd, expression, getMemory) {

            var appId = config.appId || getMemory('appId');

            var query = expression.normalized.substr("Ask Wolfram ".length);

            this.query(appId, query, null, function (error, pods) {
                if (error) {
                    dfd.reject(error);
                } else {
                    dfd.resolve(pods[0].primary);
                }
            });
        }
    };

    this.context = {};

    if (!config || !config.appId) {
        this.options = {
            appId: {name: "AppID", description: "Your WolframAlpha AppID found at https://developer.wolframalpha.com/portal/myapps/"}
        };
    }
};

Wolfram.prototype.query = function (appId, query, params, cb) {
    if (!appId) {
        return cb("Application key not set", null);
    }

    params = (params instanceof Array) ? params.join('&') : (params) ? ("&" + params) : "";
    var uri = 'http://api.wolframalpha.com/v2/query?input=' + encodeURIComponent(query) + params + '&primary=true&appid=' + appId;

    request(uri, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var doc = xml.parseXml(body), root = doc.root();

            if (root.attr('error').value() !== 'false') {
                var message = root.get('//error/msg').text();
                return cb(message, null);
            } else {
                var pods = root.find('pod').map(function (pod) {
                    var title = pod.attr('title').value();
                    var subpods = pod.find('subpod').map(function (node) {
                        return {
                            title: node.attr('title').value(),
                            value: node.get('plaintext').text(),
                            image: node.get('img').attr('src').value()
                        };
                    });
                    var primary = (pod.attr('primary') && pod.attr('primary').value()) === 'true';
                    return {title: title, subpods: subpods, primary: primary};
                });
                return cb(null, pods);
            }
        } else {
            return cb(error, null);
        }
    });
};

module.exports = {
    namespace: 'wolfram',
    examples: [
        "Ask Wolfram how big the earth is"
    ],
    register: function (config) {
        return new Wolfram(config);
    }
};