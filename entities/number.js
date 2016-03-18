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
    entities = entities.concat(extract(expression.normalized, 'number.number', new RegExp("(\\d+|" + expressions.writtenNumber.source + ")", 'i'), entity.extractors.number));
    return entities;
};

/**
 * Extracts a number value from a string
 * @param {String} string Containing the value to extract
 * @returns {Number} The number
 */
entity.extractors.number = function (string) {
    var extractedNumber = string.match(expressions.writtenNumber);
    var number;
    if (extractedNumber) {
        number = numberParser(extractedNumber[0]);
    } else {
        number = string.match(/\d+/)[0];
    }

    return number;
};

module.exports = {entity: entity, namespace: 'number'};