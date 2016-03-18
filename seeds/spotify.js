module.exports = [
    {
        intent: "",
        expressions: [
            {value: "Quieter", trigger: "spotify.volumeDown"},
            {value: "The music is too loud", trigger: "spotify.volumeDown"},
            {value: "Turn the music down", trigger: "spotify.volumeDown"},
            {value: "Turn the volume down", trigger: "spotify.volumeDown"}
        ]
    },
    {
        intent: "",
        expressions: [
            {value: "Mute", trigger: "spotify.mute"},
            {value: "Unmute", trigger: "spotify.mute"}
        ]
    },
    {
        intent: "",
        expressions: [
            {value: "Louder", trigger: "spotify.volumeUp"},
            {value: "The music is too quiet", trigger: "spotify.volumeUp"},
            {value: "Turn the music up", trigger: "spotify.volumeUp"},
            {value: "Turn the volume up", trigger: "spotify.volumeUp"}
        ]
    },
    {
        intent: "",
        expressions: [
            {value: "Stop playing music", trigger: "spotify.stop"},
            {value: "Stop the music", trigger: "spotify.stop"},
            {value: "Turn off the music", trigger: "spotify.stop"}
        ]
    },
    {
        intent: "",
        expressions: [
            {value: "Play the last song", trigger: "spotify.previous"},
            {value: "Play the last song again", trigger: "spotify.previous"}
        ]
    },
    {
        intent: "",
        expressions: [
            {value: "Pause music", trigger: "spotify.pause"}
        ]
    },
    {
        intent: "",
        expressions: [
            {value: "Play the next song", trigger: "spotify.next"},
            {value: "Next song", trigger: "spotify.next"}
        ]
    },
    {
        intent: "",
        expressions: [
            {value: "Play music please", trigger: "spotify.play"},
            {value: "Play music", trigger: "spotify.play"},
            {value: "Play my music", trigger: "spotify.play"},
            {value: "Turn the music on", trigger: "spotify.play"}
        ]
    }
];