var fs = require('fs');

var normalizer = {
    _substitutions: [],
    _corrections: [],
    _replacements: []
};

normalizer.clean = function (input) {

    input = this.cleanChars(input);
    input = this.applyCorrections(input);
    input = this.applyReplacements(input);

    return input.trim();
};

normalizer.normalize = function (input) {

    input = this.clean(input);
    input = this.applySubstitutions(input);

    return input;
};

normalizer.cleanChars = function (input) {

    input = input.replace(new RegExp("\t", "g"), " ");
    input = input.replace(/\s+/g, " ");
    input = input.replace(/ ,/g, ",");
    input = input.replace(/ \?/g, "?");
    input = input.replace(/ \./g, ".");
    input = input.replace(/ ;/g, ";");
    input = input.replace(/(’|‘)/g, "'");
    input = input.replace(/(“|”)/g, '"');
    input = input.replace(/(–|—)/g, "—");
    input = input.replace(/[^\x00-\x7F]/g, "");
    input = input.replace(/\d,\d/g, function (v) {
        return v.replace(",", "");
    });

    return input.trim();
};

normalizer.applySubstitutions = function (input) {
    var i;
    for (i = 0; i < this._substitutions.length; i++) {
        input = this._substitutions[i].execute(input);
    }
    return input;
};

normalizer.applyCorrections = function (input) {
    var i;
    for (i = 0; i < this._corrections.length; i++) {
        input = this._corrections[i].execute(input);
    }
    return input;
};

normalizer.applyReplacements = function (input) {
    var i;
    for (i = 0; i < this._replacements.length; i++) {
        input = this._replacements[i].execute(input);
    }
    return input;
};

normalizer._Replacer = function (key, value) {
    key = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var regex = new RegExp("(^|[^\\w'-])(" + key + ")([^\\w'-]|$)", "gi");
    this.execute = function (input) {
        return input.replace(regex, function (v, b1, match, b2) {
            var replacement = v;

            if (match) {
                replacement = value;
                var matchIsUppercase = match[0] === match[0].toUpperCase();
                var replacementIsUppercase = replacement[0] === replacement[0].toUpperCase();

                if (!replacementIsUppercase && matchIsUppercase) {
                    replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
                }

                replacement = b1 + replacement + b2;
            }

            return replacement;
        });
    };
};

normalizer._init = function () {
    var data;

    this._substitutions = [];
    this._replacements = [];
    this._corrections = [];

    var substitutions = {};
    var replacements = {};
    var corrections = {};

    if (fs.existsSync('./nlp/normalizer/substitutions.json')) {
        try {
            data = fs.readFileSync('./nlp/normalizer/substitutions.json');
            substitutions = JSON.parse(data);
        } catch (err) {
            console.log('JSON Read Error: ' + err);
        }
    }

    if (fs.existsSync('./nlp/normalizer/replacements.json')) {
        try {
            data = fs.readFileSync('./nlp/normalizer/replacements.json');
            replacements = JSON.parse(data);
        } catch (err) {
            console.log('JSON Read Error: ' + err);
        }
    }

    if (fs.existsSync('./nlp/normalizer/corrections.json')) {
        try {
            data = fs.readFileSync('./nlp/normalizer/corrections.json');
            corrections = JSON.parse(data);
        } catch (err) {
            console.log('JSON Read Error: ' + err);
        }
    }

    var key;

    for (key in substitutions) {
        if (substitutions.hasOwnProperty(key)) {
            this._substitutions.push(new this._Replacer(key, substitutions[key]));
        }
    }
    for (key in replacements) {
        if (replacements.hasOwnProperty(key)) {
            this._replacements.push(new this._Replacer(key, replacements[key]));
        }
    }
    for (key in corrections) {
        if (corrections.hasOwnProperty(key)) {
            this._corrections.push(new this._Replacer(key, corrections[key]));
        }
    }
};

normalizer._init();

module.exports = normalizer;