var nlp = require("./nlp/nlp");

var Expression = function (value, trigger, condition, expectations) {
    this.value = "";

    this.normalized = "";

    this.analysis = [];

    this.expectations = "";
    this.trigger = null;

    if (typeof value === "object" && value.hasOwnProperty("value")) {
        var intent = value;
        this.value = intent.value;
        this.expectations = intent.expectations || [];
        this.trigger = intent.trigger || null;
    } else {
        this.value = value || "";
        this.expectations = expectations || [];
        this.trigger = trigger || null;
    }
};

Expression.prototype.contains = function (v1, v2, v3) {
    var args = Array.prototype.slice.call(arguments);

    var value = this.value.toLowerCase();
    var normalized = this.normalized.toLowerCase();

    var i;
    var arg;
    for (i = 0; i < args.length; i++) {
        arg = args[i].toLowerCase();
        if (value.indexOf(arg) >= 0 || normalized.indexOf(arg) >= 0) {
            return true;
        }
    }

    return false;
};

Expression.prototype.process = function () {
    if (this.value) {
        var value = this.value;

        // Clean the value
        this.value = nlp.clean(value);

        // Set the normalized value
        this.normalized = nlp.normalize(this.value);

        this.analysis = nlp.analyse(this.normalized);
    }
    return this;
};

module.exports = Expression;