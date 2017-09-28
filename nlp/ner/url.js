var entityExtractor = require("./../entityExtractor");
var expressions = require("./../expressions");

var UrlExtractor = function () {
    this.extractor = entityExtractor;
    this.expressions = expressions;
};

/**
 * Used to extract the entities from an expression
 * @param {String} normalized input
 * @returns {{type: String, start: Number, end: Number, value: *}[]}
 */
UrlExtractor.prototype.extract = function (normalized) {
    var entities = [];
    entities = entities.concat(this.extractor.extract(normalized, 'url.url', this.expressions.url, this.extractUrl.bind(this)));
    return entities;
};

/**
 * Extracts a url value from a string
 * @param {String} string Containing the value to extract
 * @returns {String} The url
 */
UrlExtractor.prototype.extractUrl = function (string) {
    return string;
};

module.exports = new UrlExtractor();