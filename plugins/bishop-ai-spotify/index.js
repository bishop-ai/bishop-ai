var axios = require('axios');
var querystring = require('querystring');

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Content-Type'] = 'application/json';

var redirect = "http://localhost:3000/oauth.html";

var Spotify = function (config) {

    this.intent = [
        {value: "play [(the|my)] music", trigger: "spotify.play"},
        {value: "turn [(the|my)] music on", trigger: "spotify.play"},
        {value: "turn on [(the|my)] music", trigger: "spotify.play"},
        {value: "play [the] ((artist|band) *artist|(album|cd|disk|record|single) *album [(from|by) [[the] (artist|band)] *artist]) [on spotify]", trigger: "spotify.play"},
        {value: "play [[the] (song|track)] *song [by [the (artist|band)] *artist] [(from|on) the (album|cd|disk|record|single) *album] [on spotify]", trigger: "spotify.play"},
        {value: "(turn off|stop [playing]) [(the|my)] music", trigger: "spotify.pause"},
        {value: "turn [(the|my)] music off", trigger: "spotify.pause"},
        {value: "pause [(the|my)] music", trigger: "spotify.pause"},
        {value: "play (that [song] again|the last song [again])", trigger: "spotify.last"},
        {value: "[play [the]] previous song", trigger: "spotify.previous"},
        {value: "[play [the]] next song", trigger: "spotify.next"},
        {value: "what (was the last (song|track)|(song|track) played last|(song|track) was (that|last played|played last)|was that (song|track))", trigger: "spotify.lastInfo"},
        {value: "what ((song|track) is this|is this (song|track)|[(song|track)] (is playing|(are we|am i) listening to))", trigger: "spotify.currentInfo"}
    ];

    // TODO: "Save this song", "Set Volume", "Play playlist", "Add this song to playlist", "Play songs like this"

    this.triggers = {
        play: function (dfd, expression, utils, data) {
            var song = data.namedValues.song;
            var artist = data.namedValues.artist;
            var album = data.namedValues.album;

            Spotify.play(song, album, artist, utils.getMemory, utils.setMemory, config, function (response) {
                dfd.resolve(response);
            });
        },
        pause: function (dfd, expression, utils) {
            Spotify.sendCmd(Spotify.commands.PAUSE, null, utils.getMemory, utils.setMemory, config, function (response) {
                dfd.resolve(response);
            });
        },
        next: function (dfd, expression, utils) {
            Spotify.sendCmd(Spotify.commands.NEXT, null, utils.getMemory, utils.setMemory, config, function (response) {
                dfd.resolve(response);
            });
        },
        previous: function (dfd, expression, utils) {
            Spotify.sendCmd(Spotify.commands.PREV, null, utils.getMemory, utils.setMemory, config, function (response) {
                dfd.resolve(response);
            });
        },
        last: function (dfd, expression, utils) {
            Spotify.playLast(utils.getMemory, utils.setMemory, config, function (response) {
                dfd.resolve(response);
            });
        },
        lastInfo: function (dfd, expression, utils) {
            Spotify.getLastSongInfo(utils.getMemory, utils.setMemory, config, function (response) {
                dfd.resolve(response);
            });
        },
        currentInfo: function (dfd, expression, utils) {
            Spotify.getCurrentSongInfo(utils.getMemory, utils.setMemory, config, function (response) {
                dfd.resolve(response);
            });
        }
    };

    var redirectUrl = encodeURIComponent(redirect);

    this.options = {};

    var clientIdString = "{{plugin.options['clientId'].value}}";
    if (config) {
        if (config.clientId) {
            clientIdString = config.clientId;
        } else {
            this.options.clientId = {name: "Client ID", description: "Your Spotify application Client ID found at https://developer.spotify.com/my-applications/#!/applications"};
        }

        if (!config.clientSecret) {
            this.options.clientSecret = {name: "Client Secret", description: "Your Spotify application Client Secret found at https://developer.spotify.com/my-applications/#!/applications"};
        }
    }

    var scopes = [
        "playlist-read-private",
        "playlist-read-collaborative",
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-playback-state",
        "user-read-private",
        "user-read-recently-played"
    ];

    this.options.authCode = {
        name: "Auth Code",
        description: "",
        oauth: {
            url: "https://accounts.spotify.com/authorize?client_id=" + clientIdString + "&response_type=code&redirect_uri=" + redirectUrl + "&scope=" + scopes.join("%20"),
            urlParam: "code"
        },
        onChange: function (getMemory, setMemory) {

            var clientId = config.clientId || getMemory("clientId");
            var clientSecret = config.clientSecret || getMemory("clientSecret");
            var authCode = getMemory("authCode");

            if (clientId && clientSecret && authCode) {
                Spotify.getTokenFromAuth(clientId, clientSecret, authCode).then(function (response) {
                    if (response.refreshToken) {
                        setMemory("refreshToken", response.refreshToken);
                        setMemory("authCode", null);
                    }
                }, function (err) {
                    console.log(err.message);
                    console.log(JSON.stringify(err.response.data));
                });
            }
        }
    };
};

Spotify.playFromData = function (token, callback, data, song, album, artist) {
    axios.put("https://api.spotify.com/v1/me/player/play", data, {
        headers: {'Authorization': 'Bearer ' + token}
    }).then(function () {
        if (song && artist) {
            callback("Playing " + song + " by " + artist + "[ on Spotify].");
        } else if (album && artist) {
            callback("Playing " + album + " by " + artist + "[ on Spotify].");
        } else if (artist) {
            callback("Playing " + artist + "[ on Spotify].");
        } else {
            callback();
        }
    }).catch(function (err) {
        console.log(err.message);
        console.log(JSON.stringify(err.response.data));
        callback("Sorry, something went wrong. Please make sure your Spotify plugin is set up correctly.");
    });
};

Spotify.getLastTrack = function (token, callback) {
    axios.get("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
        headers: {'Authorization': 'Bearer ' + token}
    }).then(function (response) {
        if (response.data.items && response.data.items.length > 0) {
            return callback(response.data.items[0].track);
        }
        callback(null);
    }).catch(function (err) {
        console.log(err.message);
        console.log(JSON.stringify(err.response.data));
        callback();
    });
};

Spotify.getCurrentTrack = function (token, callback) {
    axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {'Authorization': 'Bearer ' + token}
    }).then(function (response) {
        if (response.data.item) {
            return callback(response.data.item);
        }
        callback(null);
    }).catch(function (err) {
        console.log(err.message);
        console.log(JSON.stringify(err.response.data));
        callback();
    });
};

Spotify.play = function (song, album, artist, getMemory, setMemory, config, callback) {
    Spotify.getToken(getMemory, setMemory, config, function (err, token) {
        if (err) {
            console.log(JSON.stringify(err.response.data));
            callback("Sorry, something went wrong. Please make sure your Spotify plugin is set up correctly.");
            return;
        }

        if (song || album || artist) {

            var queryParts = [];
            var type = "track";

            if (song) {
                type = "track";
                if (album) {
                    queryParts.push("album:" + album);
                }
                if (artist) {
                    queryParts.push("artist:" + artist);
                }
                if (song) {
                    queryParts.push("track:" + song);
                }

            } else if (album) {
                type = "album";
                if (album) {
                    queryParts.push("album:" + album);
                }
                if (artist) {
                    queryParts.push("artist:" + artist);
                }
                if (song) {
                    queryParts.push("track:" + song);
                }

            } else if (artist) {
                type = "artist";
                if (album) {
                    queryParts.push("album:" + album);
                }
                if (artist) {
                    queryParts.push("artist:" + artist);
                }
                if (song) {
                    queryParts.push("track:" + song);
                }
            }

            var query = encodeURIComponent(queryParts.join(" "));

            axios.get("https://api.spotify.com/v1/search?q=" + query + "&type=" + type + "&market=from_token&limit=1", {
                headers: {'Authorization': 'Bearer ' + token}
            }).then(function (response) {
                var data;
                var resultSong;
                var resultArtist;
                var resultAlbum;

                if (type === "track") {
                    if (response.data.tracks && response.data.tracks.items.length > 0) {
                        data = {uris: [response.data.tracks.items[0].uri]};
                        resultSong = response.data.tracks.items[0].name;
                        resultArtist = response.data.tracks.items[0].artists[0].name;
                        Spotify.playFromData(token, callback, data, resultSong, null, resultArtist);
                    } else {
                        callback("I was unable to find the song " + song + "[ on Spotify].");
                    }
                } else if (type === "album") {
                    if (response.data.albums && response.data.albums.items.length > 0) {
                        data = {context_uri: response.data.albums.items[0].uri};
                        resultArtist = response.data.albums.items[0].artists[0].name;
                        resultAlbum = response.data.albums.items[0].name;
                        Spotify.playFromData(token, callback, data, null, resultAlbum, resultArtist);
                    } else {
                        callback("I was unable to find the album " + album + "[ on Spotify].");
                    }
                } else if (type === "artist") {
                    if (response.data.artists && response.data.artists.items.length > 0) {
                        data = {context_uri: response.data.artists.items[0].uri};
                        resultArtist = response.data.artists.items[0].name;
                        Spotify.playFromData(token, callback, data, resultArtist);
                    } else {
                        callback("I was unable to find the artist " + artist + "[ on Spotify].");
                    }
                }
            }).catch(function (err) {
                console.log(err.message);
                console.log(JSON.stringify(err.response.data));
                callback("Sorry, something went wrong. Please make sure your Spotify plugin is set up correctly.");
            });
        } else {
            Spotify.playFromData(token, callback);
        }

    });
};

Spotify.playLast = function (getMemory, setMemory, config, callback) {
    Spotify.getToken(getMemory, setMemory, config, function (err, token) {
        if (err) {
            console.log(JSON.stringify(err.response.data));
            callback("Sorry, something went wrong. Please make sure your Spotify plugin is set up correctly.");
            return;
        }

        Spotify.getLastTrack(token, function (track) {
            if (track) {
                var data = {uris: [track.uri]};
                var resultSong = track.name;
                var resultArtist = track.artists[0].name;
                Spotify.playFromData(token, callback, data, resultSong, null, resultArtist);
            } else if (track === null) {
                callback("I was unable to determine what song was last played[ on Spotify].");
            } else {
                callback("Sorry, something went wrong. Please make sure your Spotify plugin is set up correctly.");
            }
        });
    });
};

Spotify.getLastSongInfo = function (getMemory, setMemory, config, callback) {
    Spotify.getToken(getMemory, setMemory, config, function (err, token) {
        if (err) {
            console.log(JSON.stringify(err.response.data));
            callback("Sorry, something went wrong. Please make sure your Spotify plugin is set up correctly.");
            return;
        }

        Spotify.getLastTrack(token, function (track) {
            if (track) {
                var resultSong = track.name;
                var resultArtist = track.artists[0].name;
                callback("[(That|It) was ]" + resultSong + " by " + resultArtist + ".");
            } else if (track === null) {
                callback("I was unable to determine what song was last played[ on Spotify].");
            } else {
                callback("Sorry, something went wrong. Please make sure your Spotify plugin is set up correctly.");
            }
        });
    });
};

Spotify.getCurrentSongInfo = function (getMemory, setMemory, config, callback) {
    Spotify.getToken(getMemory, setMemory, config, function (err, token) {
        if (err) {
            console.log(JSON.stringify(err.response.data));
            callback("Sorry, something went wrong. Please make sure your Spotify plugin is set up correctly.");
            return;
        }

        Spotify.getCurrentTrack(token, function (track) {
            if (track) {
                var resultSong = track.name;
                var resultArtist = track.artists[0].name;
                callback("[It is ]" + resultSong + " by " + resultArtist + ".");
            } else if (track === null) {
                callback("There is not a song playing right now[ on Spotify].");
            } else {
                callback("Sorry, something went wrong. Please make sure your Spotify plugin is set up correctly.");
            }
        });
    });
};

Spotify.sendCmd = function (commandCode, data, getMemory, setMemory, config, callback) {
    Spotify.getToken(getMemory, setMemory, config, function (err, token) {

        if (err) {
            console.log(err.message);
            console.log(JSON.stringify(err.response.data));
            callback("Sorry, something went wrong. Please make sure your Spotify plugin is set up correctly.");
            return;
        }

        var handleError = function (err) {
            console.log(err.message);
            console.log(JSON.stringify(err.response.data));
            callback("Sorry, something went wrong. Please make sure your Spotify plugin is set up correctly.");
        };

        switch (commandCode) {
        case Spotify.commands.NEXT:
            axios.post("https://api.spotify.com/v1/me/player/next", null, {
                headers: {'Authorization': 'Bearer ' + token}
            }).catch(handleError);
            break;
        case Spotify.commands.PREV:
            axios.post("https://api.spotify.com/v1/me/player/previous", null, {
                headers: {'Authorization': 'Bearer ' + token}
            }).catch(handleError);
            break;
        case Spotify.commands.PLAY:
            axios.put("https://api.spotify.com/v1/me/player/play", data, {
                headers: {'Authorization': 'Bearer ' + token}
            }).catch(handleError);
            break;
        case Spotify.commands.PAUSE:
            axios.put("https://api.spotify.com/v1/me/player/pause", null, {
                headers: {'Authorization': 'Bearer ' + token}
            }).catch(handleError);
            break;
        }

    });
};

Spotify.getTokenFromAuth = function (clientId, clientSecret, authCode) {

    var data = querystring.stringify({
        grant_type: "authorization_code",
        code: authCode,
        redirect_uri: redirect,
        client_id: clientId,
        client_secret: clientSecret
    });

    return axios.post("https://accounts.spotify.com/api/token", data, {
        headers: {
            'Content-Type':'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        return {token: response.data.access_token, refreshToken: response.data.refresh_token};
    }).catch(function (error) {
        throw error;
    });
};

Spotify.getTokenFromRefresh = function (clientId, clientSecret, refreshToken) {

    var data = querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
    });

    return axios.post("https://accounts.spotify.com/api/token", data, {
        headers: {
            'Content-Type':'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        return {token: response.data.access_token, refreshToken: response.data.refresh_token};
    }).catch(function (error) {
        throw error;
    });
};

Spotify.getToken = function (getMemory, setMemory, config, callback) {
    var clientId = config.clientId || getMemory("clientId");
    var clientSecret = config.clientSecret || getMemory("clientSecret");
    var authCode = getMemory("authCode");
    var refreshToken = getMemory("refreshToken");

    if (refreshToken) {
        Spotify.getTokenFromRefresh(clientId, clientSecret, refreshToken).then(function (response) {
            if (response.refreshToken) {
                setMemory("refreshToken", response.refreshToken);
                setMemory("authCode", null);
            }
            callback(null, response.token);
        }, function (err) {
            callback(err);
        });
    } else {
        Spotify.getTokenFromAuth(clientId, clientSecret, authCode).then(function (response) {
            if (response.refreshToken) {
                setMemory("refreshToken", response.refreshToken);
                setMemory("authCode", null);
            }
            callback(null, response.token);
        }, function (err) {
            callback(err);
        });
    }
};

Spotify.commands = {
    NEXT: 'NEXT',
    PREV: 'PREV',
    PLAY: 'PLAY',
    PAUSE: 'PAUSE'
};

module.exports = {
    namespace: 'spotify',
    examples: [
        "Play Stairway to Heaven by Led Zeppelin on Spotify",
        "Play the next song",
        "Pause the music",
        "Play the artist Oh Wonder",
        "Play the album The Wall by Pink Floyd on Spotify"
    ],
    register: function (config) {
        return new Spotify(config);
    }
};