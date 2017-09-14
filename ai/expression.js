var nlp = require('./../nlp/index');

var Expression = function (value, trigger, condition, context) {
    this.value = "";

    this.normalized = "";

    this.tokens = [];
    this.tags = [];
    this.qType = null;
    this.qClass = null;

    this.context = "";
    this.trigger = null;
    this.condition = null;

    if (typeof value === "object" && value.hasOwnProperty("value")) {
        var intent = value;
        this.value = intent.value;
        this.context = intent.context || "";
        this.trigger = intent.trigger || null;
        this.condition = intent.condition || null;
    } else {
        this.value = value || "";
        this.context = context || "";
        this.trigger = trigger || null;
        this.condition = condition || null;
    }
};

Expression.prototype.setTrigger = function (trigger) {
    if (typeof trigger === "string") {
        this.trigger = trigger;
    } else if (trigger && trigger.value) {
        this.trigger = trigger.value;
    } else {
        this.trigger = null;
    }
};

Expression.prototype.setCondition = function (condition) {
    this.condition = condition;
};

Expression.prototype.process = function () {
    if (this.value) {
        var value = this.value;

        // Clean the value
        this.value = nlp.normalizer.clean(value);

        // Set the normalized value
        this.normalized = nlp.normalizer.normalize(this.value);

        // Process the normalized value
        this.tokens = nlp.tokenize(this.normalized);
        this.tags = nlp.tag(this.tokens);
        this.qClass = nlp.classify(this.normalized);
        this.qType = nlp.qType(this.normalized);
    }
    return this;
};

module.exports = Expression;