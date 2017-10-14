var Response = function (value, expectations, weight) {
    this.value = "";
    this.expectations = [];
    this.weight = 1;

    if (typeof value === "object" && value.hasOwnProperty("value")) {
        var response = value;
        this.value = response.value;
        this.expectations = response.expectations || [];
        this.weight = response.weight || 1;
    } else {
        this.value = value || "";
        this.expectations = expectations || [];
        this.weight = weight || 1;
    }
};

module.exports = Response;