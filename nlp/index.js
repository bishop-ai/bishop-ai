var natural = require('natural');
var path = require('path');
var RuleClassify = require("qtypes");

var normalizer = require('./normalizer');

var nlp = {
    normalizer: normalizer,
    _tokenizer: null,
    _tagger: null,
    _classifier: null
};

nlp.tokenize = function (input) {
    return this._tokenizer.tokenize(input);
};

nlp.tag = function (tokens) {
    return this._tagger.tag(tokens);
};

nlp.classify = function (input) {
    return this._classifier.classify(input);
};

nlp.qType = function (input) {
    this._classifier.questionType(input);
};

nlp.JaroWinklerDistance = function (s1, s2) {
    return natural.JaroWinklerDistance(s1, s2);
};

nlp.LevenshteinDistance = function (s1, s2) {
    return natural.LevenshteinDistance(s1, s2);
};

nlp.DiceCoefficient = function (s1, s2) {
    return natural.DiceCoefficient(s1, s2);
};

nlp._init = function () {
    var normalizedPath = path.join(__dirname, "../node_modules/natural");
    var base_folder = normalizedPath + "/lib/natural/brill_pos_tagger";
    var rules_file = base_folder + "/data/English/tr_from_posjs.txt";
    var lexicon_file = base_folder + "/data/English/lexicon_from_posjs.json";
    var default_category = 'N';

    this._tokenizer = new natural.WordTokenizer();
    this._tagger = new natural.BrillPOSTagger(lexicon_file, rules_file, default_category, function (error) {
        if (error) {
            console.log(error);
        }
    });

    this._classifier = new RuleClassify(function (classifier) {
        nlp._classifier = classifier;
    });
};

nlp._init();

module.exports = nlp;