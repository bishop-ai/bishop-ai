var moment = require('moment');

var entityExtractor = require("./../entityExtractor");
var expressions = require("./../expressions");

var PersonExtractor = function () {
    this.extractor = entityExtractor;
    this.expressions = expressions;

    this.timeLength = new RegExp("\\d+ " + this.expressions.timePeriods.source);
    this.age = new RegExp("(" + this.timeLength.source + " (old|young))");
};

/**
 * Used to extract the entities from an expression
 * @param {String} normalized input
 * @param {{tokens: [], tags: [], qType: String, qClass: String, value: String}} data additional NLP data
 * @returns {{type: String, start: Number, end: Number, value: *}[]}
 */
PersonExtractor.prototype.extract = function (normalized, data) {
    var entities = [];
    entities = entities.concat(this.extractor.extract(normalized, 'person.age', new RegExp(this.age.source, 'i'), this.extractBirthday.bind(this)));
    entities = entities.concat(this.extractName(normalized, data.tags));
    return entities;
};

/**
 * Extracts the birthday from the age value from a string
 * @param {String} string Containing the value to extract
 * @returns {String} "4 years old"
 */
PersonExtractor.prototype.extractBirthday = function (string) {
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
 * @param {Array} tags
 * @returns {extractor.Entity[]} Entities
 */
PersonExtractor.prototype.extractName = function (string, tags) {
    var entities = [];

    var i;
    var r;
    var name;
    if (tags) {
        for (i = 0; i < tags.length;) {
            r = i;
            name = null;

            while (tags[r] && tags[r][1] === "NNP") {
                if (name) {
                    name += " " + tags[r][0];
                } else {
                    name = tags[r][0];
                }
                r++;
            }

            if (name) {
                entities.push(new this.extractor.Entity(name, 'person.name', name, string, 1));
            }

            i = r + 1;
        }

        for (i = 0; i < tags.length;) {
            r = i;
            name = null;

            var firstChar = tags[r][0].charAt(0);
            while (tags[r] && tags[r][1] === "N" && firstChar === firstChar.toUpperCase()) {
                if (name) {
                    name += " " + tags[r][0];
                } else {
                    name = tags[r][0];
                }
                r++;
            }

            if (name) {
                entities.push(new this.extractor.Entity(name, 'person.name', name, string, 0.5));
            }

            i = r + 1;
        }
    }

    return entities;
};

module.exports = new PersonExtractor();