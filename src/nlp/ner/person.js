var BISHOP_AI = (function (module) {
    'use strict';

    var moment = require("moment");

    var personNer = {};

    /**
     * Used to extract the entities from an expression
     * @param {String} normalized input
     * @param {{analysis: []}} data additional NLP data
     * @returns {{type: String, start: Number, end: Number, value: *}[]}
     */
    personNer.extract = function (normalized, data) {
        var entities = [];

        if (this.expressions = null) {
            this.expressions = module.nlp.expressions;

            this.timeLength = new RegExp("\\d+ " + this.expressions.timePeriods.source);
            this.age = new RegExp("(" + this.timeLength.source + " (old|young))");
        }

        entities = entities.concat(module.nlp.entityExtractor.extract(normalized, 'person.age', new RegExp(this.age.source, 'i'), extractBirthday.bind(this)));
        entities = entities.concat(extractName.bind(this)(normalized, data.analysis));
        return entities;
    };

    /**
     * Extracts the birthday from the age value from a string
     * @param {String} string Containing the value to extract
     * @returns {String} "4 years old"
     */
    var extractBirthday = function (string) {
        var date = moment();
        var number = parseInt(string.match(/\d+/)[0], 10);

        if (number) {
            var extractedTimePeriod = string.match(this.expressions.timePeriods);
            if (extractedTimePeriod) {
                switch (extractedTimePeriod[0]) {
                case 'second':
                case 'seconds':
                    date.subtract(number, 's');
                    break;
                case 'minute':
                case 'minutes':
                    date.subtract(number, 'm');
                    break;
                case 'hour':
                case 'hours':
                    date.subtract(number, 'h');
                    break;
                case 'day':
                case 'days':
                    date.subtract(number, 'd');
                    break;
                case 'week':
                case 'weeks':
                    date.subtract(number, 'w');
                    break;
                case 'month':
                case 'months':
                    date.subtract(number, 'M');
                    break;
                case 'year':
                case 'years':
                    date.subtract(number, 'y');
                    break;
                case 'decade':
                case 'decades':
                    date.subtract(number * 10, 'y');
                    break;
                case 'century':
                case 'centuries':
                    date.subtract(number * 100, 'y');
                    break;
                case 'millennium':
                case 'millennia':
                    date.subtract(number * 1000, 'y');
                    break;
                }
            }
        }

        return date.format();
    };

    /**
     * Extracts a person's name value from a string
     * @param {String} string Containing the value to extract
     * @param {Array} analysis
     * @returns {entityExtractor.Entity[]} Entities
     */
    var extractName = function (string, analysis) {
        var entities = [];

        var i;
        var r;
        var name;
        if (analysis[0]) {
            for (i = 0; i < analysis[0].tokens.length;) {
                r = i;
                name = null;

                while (analysis[0].tokens[r] && (analysis[0].tokens[r].pos === "NNP" || analysis[0].tokens[r].pos === "JJ")) {
                    if (name) {
                        name += " " + analysis[0].tokens[r].raw;
                    } else {
                        name = analysis[0].tokens[r].raw;
                    }
                    r++;
                }

                if (name) {
                    entities.push(new module.nlp.entityExtractor.Entity(name, 'person.name', name, string, 1));
                }

                i = r + 1;
            }

            for (i = 0; i < analysis[0].tokens.length;) {
                r = i;
                name = null;

                var firstChar = analysis[0].tokens[r].raw.charAt(0);
                while (analysis[0].tokens[r] && analysis[0].tokens[r].pos === "N" && firstChar === firstChar.toUpperCase()) {
                    if (name) {
                        name += " " + analysis[0].tokens[r].raw;
                    } else {
                        name = analysis[0].tokens[r].raw;
                    }
                    r++;
                }

                if (name) {
                    entities.push(new module.nlp.entityExtractor.Entity(name, 'person.name', name, string, 0.5));
                }

                i = r + 1;
            }
        }

        return entities;
    };

    module.nlp = module.nlp || {};
    module.nlp.personNer = personNer;

    return module;
}(BISHOP_AI || {}));