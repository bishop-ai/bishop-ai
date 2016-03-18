var ffi = require('ffi');

var Spotify = function (createTrigger) {
    createTrigger('play');
    createTrigger('pause');
    createTrigger('next');
    createTrigger('previous');
    createTrigger('stop');
    createTrigger('volumeUp');
    createTrigger('volumeDown');
    createTrigger('mute');

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

module.exports = {Constructor: Spotify, namespace: 'spotify'};