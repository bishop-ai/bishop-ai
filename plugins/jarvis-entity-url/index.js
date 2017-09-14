var UrlExtractor = function (commonExtractor, commonExpressions) {
    this.extractor = commonExtractor;
    this.expressions = commonExpressions;
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

module.exports = {
    namespace: 'url',
    type: 'ENTITY_EXTRACTOR',
    register: function (config) {
        return new UrlExtractor(config.commonExtractor, config.commonExpressions);
    }
};