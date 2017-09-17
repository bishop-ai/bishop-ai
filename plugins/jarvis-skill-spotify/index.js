var ffi = require('ffi');

var Spotify = function () {

    this.intent = [
        {value: "Quieter", trigger: "spotify.volumeDown"},
        {value: "The music is too loud", trigger: "spotify.volumeDown"},
        {value: "Turn the music down", trigger: "spotify.volumeDown"},
        {value: "Turn the volume down", trigger: "spotify.volumeDown"},
        {value: "Mute", trigger: "spotify.mute"},
        {value: "Unmute", trigger: "spotify.mute"},
        {value: "Louder", trigger: "spotify.volumeUp"},
        {value: "The music is too quiet", trigger: "spotify.volumeUp"},
        {value: "Turn the music up", trigger: "spotify.volumeUp"},
        {value: "Turn the volume up", trigger: "spotify.volumeUp"},
        {value: "Stop playing music", trigger: "spotify.stop"},
        {value: "Stop the music", trigger: "spotify.stop"},
        {value: "Turn off the music", trigger: "spotify.stop"},
        {value: "Play the last song", trigger: "spotify.previous"},
        {value: "Play the last song again", trigger: "spotify.previous"},
        {value: "Pause music", trigger: "spotify.pause"},
        {value: "Play the next song", trigger: "spotify.next"},
        {value: "Next song", trigger: "spotify.next"},
        {value: "Play music please", trigger: "spotify.play"},
        {value: "Play music", trigger: "spotify.play"},
        {value: "Play my music", trigger: "spotify.play"},
        {value: "Turn the music on", trigger: "spotify.play"}
    ];

    this.triggers = {
        play: function (dfd) {
            Spotify.sendCmd(Spotify.commands.PAUSE_PLAY);
            dfd.resolve();
        },
        pause: function (dfd) {
            Spotify.sendCmd(Spotify.commands.PAUSE_PLAY);
            dfd.resolve();
        },
        next: function (dfd) {
            Spotify.sendCmd(Spotify.commands.NEXT);
            dfd.resolve();
        },
        previous: function (dfd) {
            Spotify.sendCmd(Spotify.commands.PREV);
            dfd.resolve();
        },
        stop: function (dfd) {
            Spotify.sendCmd(Spotify.commands.STOP);
            dfd.resolve();
        },
        volumeUp: function (dfd) {
            Spotify.sendCmd(Spotify.commands.VOLUME_UP);
            dfd.resolve();
        },
        volumeDown: function (dfd) {
            Spotify.sendCmd(Spotify.commands.VOLUME_DOWN);
            dfd.resolve();
        },
        mute: function (dfd) {
            Spotify.sendCmd(Spotify.commands.MUTE);
            dfd.resolve();
        }
    };

    this.context = {};

    this.examples = [
        "Play music",
        "Next song",
        "Turn the volume up"
    ];
};

Spotify.sendCmd = function (commandCode) {
    var window = this.user32.FindWindowA(this.WINDOW_CLASS_NAME, null);

    if (window <= 0) {
        throw Error('unable to find spotify window, FindWindow return value is:', window);
    } else {
        this.user32.SendMessageA(window, 0x0319, 0, commandCode);
    }
};

Spotify.user32 = ffi.Library('user32', {
    'FindWindowA': [
        'int32', ['string', 'string']
    ],
    'SendMessageA': [
        'int32', ['int32', 'int32', 'int32', 'int32']
    ]
});

Spotify.WINDOW_CLASS_NAME = 'SpotifyMainWindow';

Spotify.commands = {
    NEXT: 720896,
    PREV: 786432,
    PAUSE_PLAY: 917504,
    VOLUME_DOWN: 589824,
    VOLUME_UP: 655360,
    STOP: 851968,
    MUTE: 524288
};

module.exports = {
    namespace: 'spotify',
    type: 'SKILL',
    register: function () {
        return new Spotify();
    }
};