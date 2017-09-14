var configuration = require('./../../ai/configuration');

var Configuration = function () {

    this.intent = [
        {value: "Stop talking", trigger: "configuration.disableAudio"},
        {value: "Be quiet", trigger: "configuration.disableAudio"},
        {value: "Disable Audio", trigger: "configuration.disableAudio"},
        {value: "Resume talking", trigger: "configuration.enableAudio"},
        {value: "Enable audio", trigger: "configuration.enableAudio"}
    ];

    this.triggers = {
        enableAudio: function (dfd) {
            configuration.enableAudio();
            dfd.resolve([
                "Can you hear me now?",
                "Is that better?"
            ]);
        },

        disableAudio: function (dfd) {
            configuration.disableAudio();
            dfd.resolve();
        }
    };
};

module.exports = {
    Constructor: Configuration,
    namespace: 'configuration'
};