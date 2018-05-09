var BISHOP_AI = (function (module) {
    'use strict';

    var compendium = require("compendium-js");
    var humanizeDuration = require("humanize-duration");

    var nlp = module.nlp || {};

    nlp.clean = function (input) {
        return module.nlp.normalizer.clean(input);
    };

    nlp.normalize = function (input) {
        return module.nlp.normalizer.normalize(input);
    };

    nlp.tokenize = function (input) {
        return input.split(/[\s.,!?]+/);
    };

    nlp.ner = function (normalized, expression) {
        var entities = module.nlp.datetimeNer.extract(normalized, expression);
        entities = entities.concat(module.nlp.personNer.extract(normalized, expression));
        entities = entities.concat(module.nlp.urlNer.extract(normalized, expression));
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

    module.nlp = nlp;

    return module;
}(BISHOP_AI || {}));