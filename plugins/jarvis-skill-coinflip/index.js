var CoinFlip = function () {

    this.intent = [
        {value: "Heads or tails?", trigger: "coinflip.flip"},
        {value: "Flip a coin", trigger: "coinflip.flip"},
        {value: "Coin toss", trigger: "coinflip.flip"}
    ];

    this.triggers = {
        flip: function (dfd) {
            var state = (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
            dfd.resolve([
                "It's " + state
            ]);
        }
    };

    this.context = {};

    this.examples = [
        "Heads or tails?",
        "Flip a coin"
    ];
};

module.exports = {
    namespace: 'coinflip',
    type: 'SKILL',
    register: function () {
        return new CoinFlip();
    }
};