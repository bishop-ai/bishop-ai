var CoinFlip = function () {

    this.intent = [
        {value: "heads or tails", trigger: "coinflip.flip"},
        {value: "flip a coin", trigger: "coinflip.flip"},
        {value: "coin toss", trigger: "coinflip.flip"}
    ];

    this.triggers = {
        flip: function (dfd) {
            var state = (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
            dfd.resolve([
                "It's " + state
            ]);
        }
    };

};

module.exports = {
    namespace: 'coinflip',
    examples: [
        "Heads or tails?",
        "Flip a coin"
    ],
    register: function () {
        return new CoinFlip();
    }
};