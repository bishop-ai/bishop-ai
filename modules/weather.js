var moment = require('moment');
var $q = require('q');
var request = require('request');

var cache = require('./../utils/cache');
var configuration = require('./../ai/configuration');

var Weather = function (createTrigger) {

    createTrigger('getCurrent');
    createTrigger('getTomorrow');
    createTrigger('getCurrentTemp');
    createTrigger('getTomorrowTemp');
    createTrigger('getFutureConditionSnow');
    createTrigger('getFutureConditionRain');

    this.triggers = {
        getCurrent: function (dfd) {
            Weather.getWeather(true).then(function (weather) {
                var responses = [];

                responses.push([
                    weather.hourly.summary,
                    Weather.extractCurrentTempRangeResponses(weather)
                ].join(" "));

                responses.push([
                    Weather.extractCurrentTempRangeResponses(weather),
                    weather.hourly.summary
                ].join(" "));

                dfd.resolve(responses);
            }, function () {
                dfd.resolve(Weather.failureMessages);
            });
        },

        getTomorrow: function (dfd) {
            Weather.getWeather().then(function (weather) {
                var responses = [];

                responses.push([
                    weather.daily.data[1].summary,
                    Weather.extractTomorrowTempResponses(weather)
                ].join(" "));

                responses.push([
                    Weather.extractTomorrowTempResponses(weather),
                    weather.daily.data[1].summary
                ].join(" "));

                dfd.resolve(responses);
            }, function () {
                dfd.resolve(Weather.failureMessages);
            });
        },

        getCurrentTemp: function (dfd) {
            Weather.getWeather(true).then(function (weather) {
                var responses = [];

                responses.push([
                    Weather.extractCurrentTempResponses(weather)
                ].join(" "));

                dfd.resolve(responses);
            }, function () {
                dfd.resolve(Weather.failureMessages);
            });
        },

        getTomorrowTemp: function (dfd) {
            Weather.getWeather().then(function (weather) {
                var responses = [];

                responses.push([
                    Weather.extractTomorrowTempResponses(weather)
                ].join(" "));

                dfd.resolve(responses);
            }, function () {
                dfd.resolve(Weather.failureMessages);
            });
        },

        getCurrentConditionSnow: function (dfd) {
            Weather.getWeather(true).then(function (weather) {
                var responses = [];

                responses.push([
                    Weather.extractCurrentSnowCondition(weather)
                ].join(" "));

                dfd.resolve(responses);
            }, function () {
                dfd.resolve(Weather.failureMessages);
            });
        },

        getTomorrowConditionSnow: function (dfd) {
            Weather.getWeather().then(function (weather) {
                var responses = [];

                responses.push([
                    Weather.extractTomorrowSnowCondition(weather)
                ].join(" "));

                dfd.resolve(responses);
            }, function () {
                dfd.resolve(Weather.failureMessages);
            });
        },

        getFutureConditionSnow: function (dfd) {
            Weather.getWeather().then(function (weather) {
                var responses = [];

                responses.push([
                    Weather.extractFutureSnowCondition(weather)
                ].join(" "));

                dfd.resolve(responses);
            }, function () {
                dfd.resolve(Weather.failureMessages);
            });
        },

        getCurrentConditionRain: function (dfd) {
            Weather.getWeather(true).then(function (weather) {
                var responses = [];

                responses.push([
                    Weather.extractCurrentRainCondition(weather)
                ].join(" "));

                dfd.resolve(responses);
            }, function () {
                dfd.resolve(Weather.failureMessages);
            });
        },

        getTomorrowConditionRain: function (dfd) {
            Weather.getWeather().then(function (weather) {
                var responses = [];

                responses.push([
                    Weather.extractTomorrowRainCondition(weather)
                ].join(" "));

                dfd.resolve(responses);
            }, function () {
                dfd.resolve(Weather.failureMessages);
            });
        },

        getFutureConditionRain: function (dfd) {
            Weather.getWeather().then(function (weather) {
                var responses = [];

                responses.push([
                    Weather.extractFutureRainCondition(weather)
                ].join(" "));

                dfd.resolve(responses);
            }, function () {
                dfd.resolve(Weather.failureMessages);
            });
        }
    };
};

Weather.extractCurrentTempRangeResponses = function (weather) {
    var responses = [
        "The temperature will be between " + Weather.getRoundTemp(weather.daily.data[0].temperatureMin) + " and " + Weather.getRoundTemp(weather.daily.data[0].temperatureMax) + " and is currently " + Weather.getRoundTemp(weather.currently.temperature) + ".",
        "The temperature will be between " + Weather.getRoundTemp(weather.daily.data[0].temperatureMin) + " and " + Weather.getRoundTemp(weather.daily.data[0].temperatureMax) + " and is currently " + Weather.getApproximateTemp(weather.currently.temperature) + " degrees.",
        "The temperature will be between " + Weather.getRoundTemp(weather.daily.data[0].temperatureMin) + " and " + Weather.getApproximateTemp(weather.daily.data[0].temperatureMax) + " degrees and is currently " + Weather.getRoundTemp(weather.currently.temperature) + ".",
        "The temperature is currently " + Weather.getRoundTemp(weather.currently.temperature) + " degrees with a high of " + Weather.getRoundTemp(weather.daily.data[0].temperatureMax) + ". It could get as cool as " + Weather.getRoundTemp(weather.daily.data[0].temperatureMin) + ".",
        "The temperature is currently " + Weather.getRoundTemp(weather.currently.temperature) + " with a high of " + Weather.getApproximateTemp(weather.daily.data[0].temperatureMax) + " degrees. It could get as cool as " + Weather.getRoundTemp(weather.daily.data[0].temperatureMin) + ".",
        "The temperature is currently " + Weather.getRoundTemp(weather.currently.temperature) + " with a high of " + Weather.getRoundTemp(weather.daily.data[0].temperatureMax) + " and a low of " + Weather.getApproximateTemp(weather.daily.data[0].temperatureMin) + " degrees.",
        "It's currently " + Weather.getRoundTemp(weather.currently.temperature) + " with a high of " + Weather.getRoundTemp(weather.daily.data[0].temperatureMax) + ". It could get as cool as " + Weather.getRoundTemp(weather.daily.data[0].temperatureMin) + " degrees.",
        "It's currently " + Weather.getApproximateTemp(weather.currently.temperature) + " degrees with a high of " + Weather.getRoundTemp(weather.daily.data[0].temperatureMax) + ". It could get as cool as " + Weather.getRoundTemp(weather.daily.data[0].temperatureMin) + ".",
        "It's currently " + Weather.getRoundTemp(weather.currently.temperature) + " with a high of " + Weather.getApproximateTemp(weather.daily.data[0].temperatureMax) + " degrees. It could get as cool as " + Weather.getRoundTemp(weather.daily.data[0].temperatureMin) + ".",
        "It's currently " + Weather.getRoundTemp(weather.currently.temperature) + " with a high of " + Weather.getRoundTemp(weather.daily.data[0].temperatureMax) + " and a low of " + Weather.getApproximateTemp(weather.daily.data[0].temperatureMin) + " degrees.",
        "It's currently " + Weather.getApproximateTemp(weather.currently.temperature) + " degrees. Today's high is " + Weather.getRoundTemp(weather.daily.data[0].temperatureMax) + " with a low of " + Weather.getRoundTemp(weather.daily.data[0].temperatureMin) + ".",
        "It's currently " + Weather.getRoundTemp(weather.currently.temperature) + ". The high today will be " + Weather.getApproximateTemp(weather.daily.data[0].temperatureMax) + " degrees and it could get as cool as " + Weather.getRoundTemp(weather.daily.data[0].temperatureMin) + ".",
        "It's currently " + Weather.getRoundTemp(weather.currently.temperature) + ". Today's high is " + Weather.getRoundTemp(weather.daily.data[0].temperatureMax) + " with a low of " + Weather.getApproximateTemp(weather.daily.data[0].temperatureMin) + " degrees."
    ];

    return this.returnRandom(responses);
};

Weather.extractCurrentTempResponses = function (weather) {
    var responses = [
        "The temperature is currently " + Weather.getApproximateTemp(weather.currently.temperature) + " degrees.",
        "The temperature is currently " + Weather.getRoundTemp(weather.currently.temperature) + ".",
        "It's currently " + Weather.getRoundTemp(weather.currently.temperature) + ".",
        "It's currently " + Weather.getApproximateTemp(weather.currently.temperature) + " degrees.",
        "It's " + Weather.getRoundTemp(weather.currently.temperature) + ".",
        "It's " + Weather.getApproximateTemp(weather.currently.temperature) + " degrees.",
        Weather.getRoundTemp(weather.currently.temperature) + " degrees.",
        Weather.getApproximateTemp(weather.currently.temperature) + " degrees."
    ];

    return this.returnRandom(responses);
};

Weather.extractTomorrowTempResponses = function (weather) {
    var responses = [
        "The temperature tomorrow will be between " + Weather.getRoundTemp(weather.daily.data[1].temperatureMin) + " and " + Weather.getRoundTemp(weather.daily.data[1].temperatureMax) + " degrees.",
        "The temperature tomorrow will be between " + Weather.getRoundTemp(weather.daily.data[1].temperatureMin) + " and " + Weather.getApproximateTemp(weather.daily.data[1].temperatureMax) + " degrees.",
        "Tomorrow's temperature will be between " + Weather.getRoundTemp(weather.daily.data[1].temperatureMin) + " and " + Weather.getRoundTemp(weather.daily.data[1].temperatureMax) + " degrees.",
        "Tomorrow's temperature will be between " + Weather.getRoundTemp(weather.daily.data[1].temperatureMin) + " and " + Weather.getApproximateTemp(weather.daily.data[1].temperatureMax) + " degrees.",
        "Tomorrow has a high of " + Weather.getRoundTemp(weather.daily.data[1].temperatureMax) + ". It could get as cool as " + Weather.getRoundTemp(weather.daily.data[1].temperatureMin) + ".",
        "Tomorrow has a high of " + Weather.getApproximateTemp(weather.daily.data[1].temperatureMax) + " degrees. It could get as cool as " + Weather.getRoundTemp(weather.daily.data[1].temperatureMin) + ".",
        "Tomorrow has a high of " + Weather.getRoundTemp(weather.daily.data[1].temperatureMax) + " with a low of " + Weather.getApproximateTemp(weather.daily.data[1].temperatureMin) + " degrees."
    ];

    return this.returnRandom(responses);
};

Weather.extractCurrentSnowCondition = function (weather) {
    var responses = [];

    if (weather.currently.summary.match(/((light snow)|(sleet))/i)) {
        responses.push("Looks like there might some light snow right now.");
    } else if (weather.daily.data[0].summary.match(/((light snow)|(sleet))/i)) {
        responses.push(weather.daily.data[0].summary);
    } else if (weather.currently.summary.match(/((snow)|(flurries))/i)) {
        responses.push("Looks like it might be snowing right now.");
    } else if (weather.daily.data[0].summary.match(/((snow)|(flurries))/i)) {
        responses.push(weather.daily.data[0].summary);
    } else {
        responses = [
            "It does not look like it is snowing.",
            "I don't think it is snowing right now."
        ];
    }

    return this.returnRandom(responses);
};

Weather.extractTomorrowSnowCondition = function (weather) {
    var responses = [];

    if (weather.daily.data[1].summary.match(/((light snow)|(sleet))/i)) {
        responses.push("Looks like there might be some light snow tomorrow. " + weather.daily.data[1].summary);
    } else if (weather.daily.data[1].summary.match(/((snow)|(flurries))/i)) {
        responses.push("Looks like it may snow tomorrow. " + weather.daily.data[1].summary);
    } else {
        responses = [
            "It does not look like it is going to snow tomorrow.",
            "I don't think it is going to snow tomorrow."
        ];
    }

    return this.returnRandom(responses);
};

Weather.extractFutureSnowCondition = function (weather) {
    var responses = [];

    if (weather.daily.data[1].summary.match(/((light snow)|(sleet))/i)) {
        responses.push("Looks like there might be some light snow tomorrow. " + weather.daily.data[1].summary);
    } else if (weather.daily.summary.match(/((light snow)|(sleet))/i)) {
        responses.push("Looks like there might be some light snow later this week. " + weather.daily.summary);
    } else if (weather.daily.data[1].summary.match(/((snow)|(flurries))/i)) {
        responses.push("Looks like it may snow tomorrow. " + weather.daily.data[1].summary);
    } else if (weather.daily.summary.match(/((snow)|(flurries))/i)) {
        responses.push("Looks like it may snow later this week. " + weather.daily.summary);
    } else {
        responses = [
            "It does not look like it is going to snow.",
            "I don't think it is going to snow."
        ];
    }

    return this.returnRandom(responses);
};

Weather.extractCurrentRainCondition = function (weather) {
    var responses = [];

    if (weather.currently.summary.match(/((light rain)|(drizzle))/i)) {
        responses.push("Looks like there might some light rain right now.");
    } else if (weather.daily.data[0].summary.match(/((light rain)|(drizzle))/i)) {
        responses.push(weather.daily.data[0].summary);
    } else if (weather.currently.summary.match(/rain/i)) {
        responses.push("Looks like it might be raining right now.");
    } else if (weather.daily.data[0].summary.match(/rain/i)) {
        responses.push(weather.daily.data[0].summary);
    } else {
        responses = [
            "It does not look like it is raining.",
            "I don't think it is raining right now."
        ];
    }

    return this.returnRandom(responses);
};

Weather.extractTomorrowRainCondition = function (weather) {
    var responses = [];

    if (weather.daily.data[1].summary.match(/((light rain)|(drizzle))/i)) {
        responses.push("Looks like there might be some light rain tomorrow. " + weather.daily.data[1].summary);
    } else if (weather.daily.data[1].summary.match(/rain/i)) {
        responses.push("Looks like it may rain tomorrow. " + weather.daily.data[1].summary);
    } else {
        responses = [
            "It does not look like it is going to rain tomorrow.",
            "I don't think it is going to rain tomorrow."
        ];
    }

    return this.returnRandom(responses);
};

Weather.extractFutureRainCondition = function (weather) {
    var responses = [];

    if (weather.daily.data[1].summary.match(/((light rain)|(drizzle))/i)) {
        responses.push("Looks like there might be some light rain tomorrow. " + weather.daily.data[1].summary);
    } else if (weather.daily.summary.match(/((light rain)|(drizzle))/i)) {
        responses.push("Looks like there might be some light rain later this week. " + weather.daily.summary);
    } else if (weather.daily.data[1].summary.match(/rain/i)) {
        responses.push("Looks like it may rain tomorrow. " + weather.daily.data[1].summary);
    } else if (weather.daily.summary.match(/rain/i)) {
        responses.push("Looks like it may rain later this week. " + weather.daily.summary);
    } else {
        responses = [
            "It does not look like it is going to rain.",
            "I don't think it is going to rain."
        ];
    }

    return this.returnRandom(responses);
};

Weather.getRoundTemp = function (temp) {
    temp = Math.round(temp);

    return temp;
};

Weather.getApproximateTemp = function (temp) {
    temp = Math.round(temp);

    // Reduce the likelihood of saying "close to..."
    var responses = [
        temp,
        temp,
        temp,
        temp,
        temp
    ];

    if (Math.ceil(temp / 10) === Math.round((temp - 3) / 10) || Math.floor(temp / 10) === Math.round((temp + 3) / 10)) {
        responses.push("close to " + temp);
        responses.push("around " + temp);
        responses.push("about " + temp);
    }

    return Weather.returnRandom(responses);
};

Weather.returnRandom = function (responses) {
    return responses[Math.floor(Math.random() * responses.length)];
};

Weather.getWeather = function (current) {
    var dfd = $q.defer();
    var weather = cache.read('weather.json');

    var startOfDay = moment().startOf('day');
    var lastHour = moment().subtract(1, 'hour');
    if (weather && weather.currently && moment.unix(weather.currently.time).isAfter(startOfDay) && (current !== true || moment.unix(weather.currently.time).isAfter(lastHour))) {
        dfd.resolve(weather);
    } else {
        console.log('Fetching weather');
        var uri = 'https://api.forecast.io/forecast/' + configuration.settings.modules.forecast.apiKey + '/' + configuration.settings.modules.forecast.location;

        request(uri, function (error, response, body) {
            if (error) {
                console.log(error);
                dfd.reject(error);
            } else {
                var obj = JSON.parse(body);
                cache.write('weather.json', obj);
                dfd.resolve(obj);
            }
        });
    }

    return dfd.promise;
};

Weather.failureMessages = [
    "I could not check the weather right now."
];

module.exports = {Constructor: Weather, namespace: 'weather'};