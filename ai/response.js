var Response = function (value, context, weight) {
    this.value = "";
    this.context = "";
    this.weight = 1;

    if (typeof value === "object" && value.hasOwnProperty("value")) {
        var response = value;
        this.value = response.value;
        this.context = response.context || "";
        this.weight = response.weight || 1;
    } else {
        this.value = value || "";
        this.context = context || "";
        this.weight = weight || 1;
    }
};

module.exports = Response;