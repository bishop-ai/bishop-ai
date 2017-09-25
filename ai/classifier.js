var natural = require('natural');
var $q = require('q');

var cache = require('./../utils/cache');
var intentMatcher = require('./intentMatcher');
var nlp = require('./../nlp');

var classifier = {
    bayesFile: 'bayes-classifications.json',
    bayesClassifier: new natural.BayesClassifier()
};

classifier.classify = function (inputExpression) {
    var result = {
        trigger: "",
        confidence: 0
    };

    var input = inputExpression.normalized.toLowerCase();

    var bayesClassifications = this.bayesClassifier.getClassifications(input);

    bayesClassifications.sort(function (a, b) {
        if (a.value < b.value) {
            return 1;
        } else if (b.value < a.value) {
            return -1;
        }
        return 0;
    });

    if (bayesClassifications[0]) {
        result.trigger = bayesClassifications[0].label;
        result.confidence = bayesClassifications[0].value;
    }

    return result;
};

classifier.train = function () {
    var dfd = $q.defer();

    console.log('Classifier: Starting training');

    var intents = intentMatcher.getInputs();

    var i;
    var value;
    var trigger;
    for (i = 0; i < intents.length; i++) {
        if (!intents[i].context) {

            trigger = intents[i].trigger;
            value = nlp.normalizer.clean(intents[i].value);
            value = nlp.normalizer.normalize(value).toLowerCase();

            if (value.length > 0) {
                this.bayesClassifier.addDocument(value, trigger);
            }
        }
    }

    this.bayesClassifier.events.once('doneTraining', function () {
        console.log('Classifier: Bayes Classifier training done');
        dfd.resolve();
    });

    this.bayesClassifier.train();

    return dfd.promise;
};

classifier.load = function () {
    var dfd = $q.defer();

    var self = this;
    natural.BayesClassifier.load(cache.cacheDir + this.bayesFile, null, function (err, classifier) {
        if (err) {
            dfd.reject(err);
        } else {
            self.bayesClassifier = classifier;
            dfd.resolve();
        }
    });

    return dfd.promise;
};

classifier.save = function () {
    var dfd = $q.defer();

    this.bayesClassifier.save(cache.cacheDir + this.bayesFile, function (err) {
        if (err) {
            dfd.reject(err);
        } else {
            dfd.resolve();
        }
    });

    return dfd.promise;
};

module.exports = classifier;
