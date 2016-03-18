module.exports = [
    {
        intent: "",
        expressions: [
            {value: "Stop talking", trigger: "configuration.disableAudio"},
            {value: "Be quiet", trigger: "configuration.disableAudio"},
            {value: "Disable Audio", trigger: "configuration.disableAudio"}
        ]
    },
    {
        intent: "",
        expressions: [
            {value: "Resume talking", trigger: "configuration.enableAudio"},
            {value: "Enable audio", trigger: "configuration.enableAudio"}
        ],
        transfer: [
            {
                expressions: [
                    {value: "Can you hear me now?"},
                    {value: "Is that better?"}
                ]
            }
        ]
    }
];