var request = require('request');

var Ifttt = function () {
    this.intent = [];

    var self = this;
    this.triggers = {
        maker: function (dfd, expression, utils, data) {
            var key = utils.getMemory("key");

            if (!data.triggerParams[0]) {
                dfd.resolve("I'm sorry, something went wrong. Please make sure your If This Then That plugin is correctly configured.");
                return;
            }

            self.makeCall(data.triggerParams[0], key);

            if (data.triggerParams[1]) {
                dfd.resolve(data.triggerParams[1]);
            } else {
                dfd.resolve();
            }
        }
    };

    this.options = {
        key: {name: "Key", description: "Your IFTTT key found at https://ifttt.com/services/maker_webhooks/settings"},
        eventIntents: {name: "Custom Intents", description: "Custom phrases that trigger IFTTT maker events. For the trigger enter 'ifttt.maker(eventName)' where eventName is the name of the IFTTT maker event to trigger.", intentArray: true}
    };
};

Ifttt.prototype.makeCall = function (event, key) {
    var uri = 'https://maker.ifttt.com/trigger/' + event + '/with/key/' + key;
    console.log("IFTTT call: " + uri);
    request(uri);
};

module.exports = {
    namespace: 'ifttt',
    register: function () {
        return new Ifttt();
    }
};