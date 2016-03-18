var moment = require('moment');
var numberParser = require('./../utils/numberParser');
var path = require("path");

var expressions = require('./../utils/expressions');
var extractor = require('./../utils/entityExtractor');

var entity = {
    extractors: {}
};

/**
 * Used to extract the entities from an expression
 * @param {Expression} expression
 * @returns {{type: String, start: Number, end: Number, value: *}[]}
 */
entity.extract = function (expression) {
    var entities = [];
    entities = entities.concat(extractor.extract(expression.normalized, 'person.age', new RegExp(expressions.age.source, 'i'), entity.extractors.birthday));
    entities = entities.concat(entity.extractors.name(expression.normalized, expression.tags));
    return entities;
};

/**
 * Extracts the birthday from the age value from a string
 * @param {String} string Containing the value to extract
 * @returns {String} "4 years old"
 */
entity.extractors.birthday = function (string) {
    var date = moment();
    var extractedNumber = string.match(expressions.writtenNumber);
    var number;
    if (extractedNumber) {
        number = numberParser(extractedNumber[0]);
        string = string.replace(extractedNumber[0], number);
    }
    extractedNumber = string.match(/\d+/);
    if (extractedNumber) {
        number = extractedNumber[0];
    }

    if (number) {
        var extractedTimePeriod = string.match(expressions.timePeriods);
        if (extractedTimePeriod) {
            switch (extractedTimePeriod[0]) {
            case 'second':
            case 'seconds':
                date.subtract(parseInt(number, 10), 's');
                break;
            case 'minute':
            case 'minutes':
                date.subtract(parseInt(number, 10), 'm');
                break;
            case 'hour':
            case 'hours':
                date.subtract(parseInt(number, 10), 'h');
                break;
            case 'day':
            case 'days':
                date.subtract(parseInt(number, 10), 'd');
                break;
            case 'week':
            case 'weeks':
                date.subtract(parseInt(number, 10), 'w');
                break;
            case 'month':
            case 'months':
                date.subtract(parseInt(number, 10), 'M');
                break;
            case 'year':
            case 'years':
                date.subtract(parseInt(number, 10), 'y');
                break;
            case 'decade':
            case 'decades':
                date.subtract(parseInt(number, 10) * 10, 'y');
                break;
            case 'century':
            case 'centuries':
                date.subtract(parseInt(number, 10) * 100, 'y');
                break;
            case 'millennium':
            case 'millennia':
                date.subtract(parseInt(number, 10) * 1000, 'y');
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
entity.extractors.name = function (string, tags) {
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
                entities.push(new extractor.Entity(name, 'person.name', name, string, 1));
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
                entities.push(new extractor.Entity(name, 'person.name', name, string, 0.5));
            }

            i = r + 1;
        }
    }

    return entities;
};

module.exports = {entity: entity, namespace: 'person'};