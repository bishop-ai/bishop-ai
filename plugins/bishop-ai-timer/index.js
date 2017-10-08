var Timer = function (nlp) {

    this.intent = [
        {value: "(set|start) [(a|the)] timer for *duration", trigger: "timer.startTimer"},
        {value: "(how much|what) time is (left|[left] on the (timer|stopwatch))", trigger: "timer.getRemaining"},
        {value: "(stop|cancel) [the] timer", trigger: "timer.stopTimer"}
    ];

    this.triggers = {
        startTimer: function (dfd, expression, utils, data) {
            if (data.namedValues.duration) {
                var seconds = nlp.datetimeNer.extractDuration(data.namedValues.duration);

                var timer = utils.addTimer(seconds, function () {
                    utils.setMemory("timer", null);
                    dfd.resolve("(Time's up|(The|Your) timer has finished).");
                });

                dfd.notify("The timer has been set for " + nlp.humanizeDuration(timer.getRemaining()));

                timer.start();
                utils.setMemory("timer", timer.id);

            } else {
                dfd.reject();
            }
        },
        stopTimer: function (dfd, expression, utils) {
            var timerId = utils.getMemory("timer");

            if (timerId) {
                utils.getTimer(timerId).stop();
                utils.setMemory("timer", null);
                dfd.resolve("The timer has been stopped.");
            } else {
                dfd.resolve("There is not a timer running.");
            }
        },
        getRemaining: function (dfd, expression, utils) {
            var timerId = utils.getMemory("timer");

            if (timerId) {
                var duration = nlp.humanizeDuration(utils.getTimer(timerId).getRemaining());

                if (duration.indexOf("and") >= 0 || duration.substr(duration.length - 1) === "s") {
                    dfd.resolve("There are " + duration + " left.");
                } else {
                    dfd.resolve("There is " + duration + " left.");
                }
            } else {
                dfd.resolve("There is not a timer running.");
            }
        }
    };
};

module.exports = {
    namespace: 'timer',
    examples: [
        "Set a timer for fifteen minutes",
        "How much time is left?",
        "Stop the timer."
    ],
    register: function (config, nlp) {
        return new Timer(nlp);
    }
};