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

nlp.datetimeNer = require('./ner/datetime');
nlp.personNer = require('./ner/person');
nlp.urlNer = require('./ner/url');

nlp._init = function () {
    var base_folder = path.join(path.dirname(require.resolve("natural")), "brill_pos_tagger");
    var rulesFilename = base_folder + "/data/English/tr_from_posjs.txt";
    var lexiconFilename = base_folder + "/data/English/lexicon_from_posjs.json";
    var defaultCategory = 'N';

    var lexicon = new natural.Lexicon(lexiconFilename, defaultCategory);
    var rules = new natural.RuleSet(rulesFilename);

    this._tagger = new natural.BrillPOSTagger(lexicon, rules);
    this._tokenizer = new natural.WordTokenizer();
    this._classifier = new RuleClassify(function (classifier) {
        nlp._classifier = classifier;
    });
};

nlp._init();

module.exports = nlp;