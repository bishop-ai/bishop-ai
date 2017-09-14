var Response = function (value, context, preference) {
    this.value = "";
    this.context = "";
    this.preference = 0;

    if (typeof value === "object" && value.hasOwnProperty("value")) {
        var response = value;
        this.value = response.value;
        this.context = response.context || "";
        this.preference = response.preference || 0;
    } else {
        this.value = value || "";
        this.context = context || "";
        this.preference = preference || 0;
    }
};

module.exports = Response;