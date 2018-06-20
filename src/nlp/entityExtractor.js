var entityExtractor = {};

entityExtractor.Entity = function (raw, type, value, source, confidence) {
    this.type = type;
    this.raw = raw;
    this.template = source.replace(raw, "{{" + type + "}}");
    this.start = source.indexOf(raw);
    this.end = source.indexOf(raw) + raw.length;
    this.value = value;
    this.confidence = confidence;
};

entityExtractor.extract = function (string, type, regexp, getValue) {
    var entities = [];
    var originalString = string;
    var match = string.trim().match(regexp);
    var entity;
    var value;

    while (match) {
        value = getValue(match[0]);
        entity = new entityExtractor.Entity(match[0], type, value, originalString, 1);
        entities.push(entity);
        string = string.replace(match[0], "");
        match = string.match(regexp);
    }

    return entities;
};

module.exports = entityExtractor;