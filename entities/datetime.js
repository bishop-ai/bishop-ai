var moment = require('moment');
var numberParser = require('./../utils/numberParser');
var expressions = require('./../utils/expressions');
var extract = require('./../utils/entityExtractor').extract;

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
    entities = entities.concat(extract(expression.normalized, 'datetime.timeFromNow', new RegExp(expressions.timeFromNow.source, 'i'), entity.extractors.timeFromNow));
    entities = entities.concat(extract(expression.normalized, 'datetime.timeAgo', new RegExp(expressions.timeAgo.source, 'i'), entity.extractors.timeAgo));
    entities = entities.concat(extract(expression.normalized, 'datetime.timeLength', new RegExp(expressions.timeLength.source, 'i'), entity.extractors.timeLength));
    return entities;
};

/**
 * Extracts the timeFromNow value from a string
 * @param {String} string Containing the value to extract
 * @returns {String} ISO8601 Date
 */
entity.extractors.timeFromNow = function (string) {
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
                date.add(parseInt(number, 10), 's');
                break;
            case 'minute':
            case 'minutes':
                date.add(parseInt(number, 10), 'm');
                break;
            case 'hour':
            case 'hours':
                date.add(parseInt(number, 10), 'h');
                break;
            case 'day':
            case 'days':
                date.add(parseInt(number, 10), 'd');
                break;
            case 'week':
            case 'weeks':
                date.add(parseInt(number, 10), 'w');
                break;
            case 'month':
            case 'months':
                date.add(parseInt(number, 10), 'M');
                break;
            case 'year':
            case 'years':
                date.add(parseInt(number, 10), 'y');
                break;
            case 'decade':
            case 'decades':
                date.add(parseInt(number, 10) * 10, 'y');
                break;
            case 'century':
            case 'centuries':
                date.add(parseInt(number, 10) * 100, 'y');
                break;
            case 'millennium':
            case 'millennia':
                date.add(parseInt(number, 10) * 1000, 'y');
                break;
            }
        }
    }

    return date.format();
};

/**
 * Extracts the timeAgo value from a string
 * @param {String} string Containing the value to extract
 * @returns {String} ISO8601 Date
 */
entity.extractors.timeAgo = function (string) {
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
 * Extract a length of time in seconds from a string
 * @param {string} string
 * @returns {number} Seconds
 */
entity.extractors.timeLength = function (string) {
    var seconds = 0;
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
                seconds = parseInt(number, 10);
                break;
            case 'minute':
            case 'minutes':
                seconds = parseInt(number, 10) * 60;
                break;
            case 'hour':
            case 'hours':
                seconds = parseInt(number, 10) * 60 * 60;
                break;
            case 'day':
            case 'days':
                seconds = parseInt(number, 10) * 60 * 60 * 24;
                break;
            case 'week':
            case 'weeks':
                seconds = parseInt(number, 10) * 60 * 60 * 24 * 7;
                break;
            case 'month':
            case 'months':
                seconds = Math.round(parseInt(number, 10) * 60 * 60 * 24 * 30.42);
                break;
            case 'year':
            case 'years':
                seconds = parseInt(number, 10) * 60 * 60 * 24 * 365;
                break;
            case 'decade':
            case 'decades':
                seconds = parseInt(number, 10) * 60 * 60 * 24 * 365 * 10;
                break;
            case 'century':
            case 'centuries':
                seconds = parseInt(number, 10) * 60 * 60 * 24 * 365 * 100;
                break;
            case 'millennium':
            case 'millennia':
                seconds = parseInt(number, 10) * 60 * 60 * 24 * 365 * 1000;
                break;
            }
        }
    }

    return seconds;
};

module.exports = {entity: entity, namespace: 'datetime'};