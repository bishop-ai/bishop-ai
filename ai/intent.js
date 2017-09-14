var Expression = require('./expression');

var Intent = function (value, trigger, responses, context, namespace) {
    this.value = null;
    this.expression = null;
    this.responses = [];
    this.namespace = "";

    if (typeof value === "object" && value.hasOwnProperty("value")) {
        var intent = value;
        this.value = intent.value || "";
        this.responses = intent.responses || [];
        this.namespace = intent.preference || "";

        trigger = intent.trigger || "";
        context = intent.context || "";

    } else {
        this.value = value || "";
        this.responses = responses || [];
        this.namespace = namespace || "";
    }

    if (this.value) {
        this.expression = new Expression(this.value, trigger, null, context);
        this.expression.process();
    }
};

module.exports = Intent;