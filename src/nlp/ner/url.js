var entityExtractor = require('../entityExtractor');
var expressions = require("../expressions");

var urlNer = {};

/**
 * Used to extract the entities from an expression
 * @param {String} normalized input
 * @returns {{type: String, start: Number, end: Number, value: *}[]}
 */
urlNer.extract = function (normalized) {
    var entities = [];
    entities = entities.concat(entityExtractor.extract(normalized, 'url.url', expressions.url, extractUrl.bind(this)));
    return entities;
};

/**
 * Extracts a url value from a string
 * @param {String} string Containing the value to extract
 * @returns {String} The url
 */
var extractUrl = function (string) {
    return string;
};

module.exports = urlNer;