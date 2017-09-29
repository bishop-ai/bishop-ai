var ffi = require('ffi');

var Spotify = function () {

    this.intent = [
        {value: "quieter [please]", trigger: "spotify.volumeDown"},
        {value: "(the|my) music is too loud", trigger: "spotify.volumeDown"},
        {value: "turn [(the|my)] (music|volume) down [please]", trigger: "spotify.volumeDown"},
        {value: "mute [(music|volume|sound)] [please]", trigger: "spotify.mute"},
        {value: "unmute [(music|volume|sound)] [please]", trigger: "spotify.mute"},
        {value: "louder [please]", trigger: "spotify.volumeUp"},
        {value: "[(the|my)] music is too quiet", trigger: "spotify.volumeUp"},
        {value: "turn [(the|my)] (music|volume) up [please]", trigger: "spotify.volumeUp"},
        {value: "stop [playing] [(the|my)] music [please]", trigger: "spotify.stop"},
        {value: "turn off [(the|my)] music [please]", trigger: "spotify.stop"},
        {value: "turn [(the|my)] music off [please]", trigger: "spotify.stop"},
        {value: "[play [the]] last song [again] [please]", trigger: "spotify.previous"},
        {value: "pause [(the|my)] music [please]", trigger: "spotify.pause"},
        {value: "[play [the]] next song [please]", trigger: "spotify.next"},
        {value: "play [(the|my)] music [please]", trigger: "spotify.play"},
        {value: "turn [(the|my)] music on [please]", trigger: "spotify.play"},
        {value: "turn on [(the|my)] music [please]", trigger: "spotify.play"}
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
    examples: [
        "Play music",
        "Next song",
        "Turn the volume up"
    ],
    register: function () {
        return new Spotify();
    }
};