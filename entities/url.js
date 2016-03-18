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
    entities = entities.concat(extract(expression.normalized, 'url.url', expressions.url, entity.extractors.url));
    return entities;
};

/**
 * Extracts a url value from a string
 * @param {String} string Containing the value to extract
 * @returns {String} The url
 */
entity.extractors.url = function (string) {
    return string;
};

module.exports = {entity: entity, namespace: 'url'};