var compendium = require("compendium-js");
var humanizeDuration = require("humanize-duration");

var normalizer = require("./normalizer");
var datetimeNer = require("./ner/datetime");
var personNer = require("./ner/person");
var urlNer = require("./ner/url");

var nlp = {};

nlp.clean = function (input) {
    return normalizer.clean(input);
};

nlp.normalize = function (input) {
    return normalizer.normalize(input);
};

nlp.tokenize = function (input) {
    return input.split(/[\s.,!?]+/);
};

nlp.ner = function (normalized, expression) {
    var entities = datetimeNer.extract(normalized);
    entities = entities.concat(personNer.extract(normalized, expression));
    entities = entities.concat(urlNer.extract(normalized));
    return entities;
};

nlp.shuffle = function (array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
};

nlp.analyse = function (input) {
    return compendium.analyse(input, 'en');
};

nlp.humanizeDuration = function (seconds) {
    return humanizeDuration(seconds * 1000, { largest: 2, round: true, conjunction: ' and ', serialComma: false });
};

module.exports = nlp;