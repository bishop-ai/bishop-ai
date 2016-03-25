var fs = require('fs');

var numberParser = require('./numberParser');

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
    input = this.replaceWrittenTime(input);
    input = this.replaceWrittenNumbers(input);

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

normalizer.replaceWrittenTime = function (input) {
    var writtenNumberBase = /(one|two|three|four|five|six|seven|eight|nine)/;
    var writtenNumberBaseTeen = /(ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)/;
    var writtenTimeMultiple = /(twenty|thirty|forty|fifty)/;
    var writtenTimeMultipleBase = new RegExp(writtenTimeMultiple.source + "( |-)" + writtenNumberBase.source);
    var writtenTimeHour = new RegExp("(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)", "i");
    var writtenTime = new RegExp("(" + writtenTimeHour.source + " (((oh|o|o') " + writtenNumberBase.source + ")|" + writtenTimeMultipleBase.source + "|" + writtenTimeMultiple.source + "|" + writtenNumberBaseTeen.source + "))");

    var toExtract = new RegExp("(" + writtenTime.source + ")", "i");
    var regex = new RegExp("(^|[^\\w'-])" + toExtract.source + "([^\\w'-]|$)", "i");
    var match = input.match(regex);

    while (match) {
        var extracted = match[0].match(toExtract)[0];
        var clone = extracted;
        var writtenHour = clone.match(writtenTimeHour);
        var hour = numberParser.parse(writtenHour[0]);

        clone = clone.replace(writtenHour[0], hour);
        var writtenMinute = clone.match(new RegExp("(" + writtenNumberBase.source + "|" + writtenTimeMultipleBase.source + "|" + writtenTimeMultiple.source + "|" + writtenNumberBaseTeen.source + ")", "i"));
        var minute = numberParser.parse(writtenMinute[0]);
        if (minute < 10) {
            minute = "0" + minute;
        }

        input = input.replace(extracted, hour + ":" + minute);
        match = input.match(regex);
    }

    return input;
};

normalizer.replaceWrittenNumbers = function (input) {
    var writtenNumberUnit = /((hundred thousand)|(hundred grand)|(hundred million)|(hundred billion)|(hundred trillion)|(thousand million)|(thousand billion)|(thousand trillion)|(million trillion)|(million billion)|(million trillion)|(billion trillion)|hundred|thousand|grand|million|billion|trillion)/;
    var writtenNumberBase = /(one|two|three|four|five|six|seven|eight|nine)/;
    var writtenNumberBaseTeen = /(ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)/;
    var writtenNumberMultiple = /(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)/;
    var writtenNumberMultipleBase = new RegExp(writtenNumberMultiple.source + "( |-)" + writtenNumberBase.source);
    var writtenNumberSingle = new RegExp("((" + writtenNumberMultipleBase.source + "|" + writtenNumberMultiple.source + "|" + writtenNumberBaseTeen.source + "|" + writtenNumberBase.source + ")( " + writtenNumberUnit.source + ")?)");
    var writtenNumber = new RegExp("((" + writtenNumberSingle.source + ")( (and )?" + writtenNumberSingle.source + ")*)");

    var toExtract = new RegExp("(((a|\\d+) " + writtenNumberUnit.source + ")|" + writtenNumber.source + ")", "i");
    var regex = new RegExp("(^|[^\\w'-])" + toExtract.source + "([^\\w'-]|$)", "i");
    var match = input.match(regex);

    while (match) {
        var extracted = match[0].match(toExtract);
        var number = numberParser.parse(extracted[0]);
        input = input.replace(extracted[0], number);
        match = input.match(regex);
    }

    return input;
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