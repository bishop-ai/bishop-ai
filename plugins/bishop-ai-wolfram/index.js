var request = require('request');

var Wolfram = function (config) {

    this.intent = [
        {value: "Ask Wolfram [Alpha] *query", trigger: "wolfram.query"}
    ];

    this.triggers = {
        query: function (dfd, expression, utils, data) {

            var appId = config.appId || utils.getMemory('appId');

            var query = data.namedValues.query || "";

            Wolfram.query(appId, query, function (error, result) {
                if (error) {
                    console.log("Wolfram: error while querying: " + error);
                    dfd.resolve("Sorry, something went wrong. Please make sure your Wolfram Alpha plugin is set up correctly.");
                } else if (result) {
                    dfd.resolve(result);
                } else {
                    dfd.resolve("I (was unable to|could not|couldn't) find (the|an) answer. [Try (asking|saying) your question (another|a different) way.]");
                }
            });
        }
    };

    if (!config || !config.appId) {
        this.options = {
            appId: {name: "AppID", description: "Your WolframAlpha AppID found at https://developer.wolframalpha.com/portal/myapps/"}
        };
    }
};

Wolfram.query = function (appId, query, cb) {
    if (!appId) {
        return cb("Application key not set", null);
    }

    var uri = 'http://api.wolframalpha.com/v1/spoken?i=' + encodeURIComponent(query) + '&appid=' + appId;

    request(uri, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            return cb(null, body);
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