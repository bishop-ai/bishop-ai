var configuration = require('./../ai/configuration');

var Configuration = function (createTrigger) {

    createTrigger('enableAudio');
    createTrigger('disableAudio');

    this.triggers = {
        enableAudio: function (dfd) {
            configuration.enableAudio();
            dfd.resolve();
        },

        disableAudio: function (dfd) {
            configuration.disableAudio();
            dfd.resolve();
        }
    };
};

module.exports = {Constructor: Configuration, namespace: 'configuration'};