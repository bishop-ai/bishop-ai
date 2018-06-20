var moment = require("moment");

var utils = require("./utils");

var Timer = function (seconds, onFinish, onStop) {
    this.id = utils.generateUuid();
    this.running = false;
    this.duration = seconds;
    this.interval = null;
    this.onFinish = onFinish;
    this.onStop = onStop;
};

Timer.prototype.checkTime = function () {
    if (this.running && moment().isAfter(this.endTime)) {
        clearInterval(this.interval);
        this.onFinish();
        this.onStop();
    }
};

Timer.prototype.start = function () {
    if (!this.running) {

        console.log("Timer: timer started for " + this.duration + " seconds.");

        this.startTime = moment();
        this.endTime = moment(this.startTime).add(this.duration, "s");
        this.running = true;
        this.interval = setInterval(this.checkTime.bind(this), 1000);
    }
};

Timer.prototype.pause = function () {
    if (this.running) {
        this.duration = this.getRemaining();

        clearInterval(this.interval);
        this.running = false;
    }
};

Timer.prototype.stop = function () {
    clearInterval(this.interval);
    this.running = false;
    this.onStop();
};

Timer.prototype.getRemaining = function () {
    if (this.endTime) {
        var duration = moment.duration(this.endTime.diff(moment()));
        return duration.asSeconds();
    }

    return this.duration;
};

module.exports = Timer;