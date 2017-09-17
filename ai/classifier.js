var natural = require('natural');
var $q = require('q');

var cache = require('./../utils/cache');
var nlp = require('./../nlp');

var tokenizer = new natural.TreebankWordTokenizer();
var phoneticProcessor = natural.Metaphone;

var classifier = {
    bayesFile: 'bayes-classifications.json',
    logicalRegressionFile: 'logical-regression-classifications.json',
    phoneticFile: 'phonetic-classifications.json',
    bayesClassifier: new natural.BayesClassifier(),
    logicalRegressionClassifier: new natural.LogisticRegressionClassifier(),
    phoneticClassifier: new natural.LogisticRegressionClassifier()
};

classifier.classify = function (inputExpression) {
    var result = {
        trigger: "",
        confidence: 0
    };

    var input = inputExpression.normalized.toLowerCase();
    var tokens = tokenizer.tokenize(input);
    var phonetics = this._getPhonetics(tokens);
    tokens = this._removeStopwords(tokens);

    // Get all classifications
    var bayesClassifications = this.bayesClassifier.getClassifications(input);
    var logicalClassifications = this.logicalRegressionClassifier.getClassifications(tokens);
    var phoneticClassifications = this.phoneticClassifier.getClassifications(phonetics);

    // Normalize the scores between 0 and 1
    this.normalizeConfidence(bayesClassifications);
    this.normalizeConfidence(logicalClassifications);
    this.normalizeConfidence(phoneticClassifications);

    var classificationLabels = {};

    var i;
    for (i = 0; i < logicalClassifications.length; i++) {
        classificationLabels[logicalClassifications[i].label] = classificationLabels[logicalClassifications[i].label] || {};
        classificationLabels[logicalClassifications[i].label].logical = logicalClassifications[i].value;
    }

    for (i = 0; i < bayesClassifications.length; i++) {
        classificationLabels[bayesClassifications[i].label] = classificationLabels[bayesClassifications[i].label] || {};
        classificationLabels[bayesClassifications[i].label].bayes = bayesClassifications[i].value;
    }

    for (i = 0; i < phoneticClassifications.length; i++) {
        classificationLabels[phoneticClassifications[i].label] = classificationLabels[phoneticClassifications[i].label] || {};
        classificationLabels[phoneticClassifications[i].label].phonetic = phoneticClassifications[i].value;
    }

    var classifications = [];

    // Average the confidences together
    var label;
    for (label in classificationLabels) {
        if (classificationLabels.hasOwnProperty(label)) {

            var v1 = classificationLabels[label].logical;
            var v2 = classificationLabels[label].bayes;
            var v3 = classificationLabels[label].phonetic;
            var v;

            if (isNaN(v1)) {
                v1 = 0;
            }
            if (isNaN(v2)) {
                v1 = 0;
            }
            if (isNaN(v3)) {
                v1 = 0;
            }

            if (v1 >= 0 && v2 >= 0 && v3 >= 0) {
                v = (v1 + v2 + v3) / 3;
            } else if (v1 >= 0 && v2 >= 0) {
                v = (v1 + v2) / 2;
            } else if (v2 >= 0 && v3 >= 0) {
                v = (v2 + v3) / 2;
            } else if (v1 >= 0 && v3 >= 0) {
                v = (v1 + v3) / 2;
            } else if (v1 >= 0) {
                v = v1;
            } else if (v2 >= 0) {
                v = v2;
            } else if (v3 >= 0) {
                v = v3;
            }

            classifications.push({
                label: label,
                value: v
            });
        }
    }

    classifications.sort(function (a, b) {
        if (a.value < b.value) {
            return 1;
        } else if (b.value < a.value) {
            return -1;
        }
        return 0;
    });

    if (logicalClassifications[0]) {
        result.trigger = classifications[0].label;
        result.confidence = classifications[0].value;
    }

    return result;
};

classifier.normalizeConfidence = function (classifications) {
    var min = null;
    var max = null;

    var i;
    var value;
    for (i = 0; i < classifications.length; i++) {
        value = classifications[i].value;

        if (min === null) {
            min = value;
        } else {
            min = Math.min(min, value);
        }

        if (max === null) {
            max = value;
        } else {
            max = Math.max(max, value);
        }
    }

    for (i = 0; i < classifications.length; i++) {
        classifications[i].value = (classifications[i].value - min) / (max - min);
    }
};

classifier.train = function (intents) {
    console.log('Classifier: Starting training');

    var i;
    var value;
    var tokens;
    var trigger;
    var phonetics;
    for (i = 0; i < intents.length; i++) {
        if (!intents[i].context) {

            trigger = intents[i].trigger;

            if (intents[i].value instanceof Array) {
                value = intents[i].value;
                tokens = intents[i].value;
            } else {
                value = nlp.normalizer.clean(intents[i].value.toLowerCase());
                value = nlp.normalizer.normalize(value);
                tokens = tokenizer.tokenize(value);
            }

            phonetics = this._getPhonetics(tokens);
            tokens = this._removeStopwords(value);

            if (value.length > 0) {
                this.bayesClassifier.addDocument(value, trigger);
                this.logicalRegressionClassifier.addDocument(tokens, trigger);
                this.phoneticClassifier.addDocument(phonetics, trigger);
            }
        }
    }

    var self = this;
    return $q.all([
        this._train(this.bayesClassifier, "Bayes Classifier"),
        this._train(this.logicalRegressionClassifier, "Logical Regression Classifier"),
        this._train(this.phoneticClassifier, "Phonetic Classifier")
    ]).then(function () {
        return self.save();
    });
};

classifier.load = function () {
    return $q.all([
        this._load(natural.BayesClassifier, 'bayesClassifier', this.bayesFile),
        this._load(natural.LogisticRegressionClassifier, 'logicalRegressionClassifier', this.logicalRegressionFile),
        this._load(natural.LogisticRegressionClassifier, 'phoneticClassifier', this.phoneticFile)
    ]);
};

classifier.save = function () {
    return $q.all([
        this._save(this.bayesClassifier, this.bayesFile),
        this._save(this.logicalRegressionClassifier, this.logicalRegressionFile),
        this._save(this.phoneticClassifier, this.phoneticFile)
    ]);
};

classifier._getPhonetics = function (tokens) {
    var phonetics = [];

    var i;
    for (i = 0; i < tokens.length; i++) {
        if (tokens[i] instanceof Array) {
            phonetics = phonetics.concat(this._getPhonetics(tokens[i]));
        } else {
            phonetics.push(phoneticProcessor.process(tokens[i].toLowerCase()));
        }
    }

    return phonetics;
};

classifier._removeStopwords = function (tokens) {
    var cleanTokens = [];

    var words = [
        'about', 'after', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'are', 'as', 'at', 'be',
        'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'came', 'can',
        'come', 'could', 'did', 'do', 'each', 'for', 'from', 'get', 'got', 'has', 'had',
        'he', 'have', 'her', 'here', 'him', 'himself', 'his', 'if', 'in', 'into',
        'is', 'it', 'like', 'make', 'many', 'might', 'more', 'most', 'much', 'must',
        'never', 'now', 'of', 'on', 'only', 'or', 'other', 'our', 'out', 'over',
        'said', 'same', 'see', 'should', 'since', 'some', 'still', 'such', 'take', 'than',
        'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
        'through', 'to', 'too', 'under', 'up', 'very', 'was', 'way', 'we', 'well', 'were',
        'while', 'with', 'a', '\'s', '\'re', '\'ll', '.', ',', '?', '!', 'who', 'how', 'what', 'why', 'when', 'where'];

    var i;
    for (i = 0; i < tokens.length; i++) {
        if (tokens[i] instanceof Array) {
            cleanTokens = cleanTokens.concat(this._removeStopwords(tokens[i]));
        } else if (words.indexOf(tokens[i].toLowerCase()) === -1) {
            cleanTokens.push(tokens[i]);
        }
    }

    return cleanTokens;
};

classifier._train = function (classifier, name) {
    var dfd = $q.defer();

    classifier.events.once('doneTraining', function () {
        console.log('Classifier: ' + name + ' training done');
        dfd.resolve();
    });

    classifier.train();

    return dfd.promise;
};

classifier._load = function (clazz, key, file) {
    var dfd = $q.defer();

    var self = this;
    clazz.load(cache.cacheDir + file, null, function (err, classifier) {
        if (err) {
            dfd.reject(err);
        } else {
            self[key] = classifier;
            dfd.resolve();
        }
    });

    return dfd.promise;
};

classifier._save = function (classifier, file) {
    var dfd = $q.defer();

    classifier.save(cache.cacheDir + file, function (err) {
        if (err) {
            dfd.reject(err);
        } else {
            dfd.resolve();
        }
    });

    return dfd.promise;
};

module.exports = classifier;
