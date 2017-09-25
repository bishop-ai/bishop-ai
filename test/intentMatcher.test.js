var assert = require("assert");

var intentMatcher = require("../ai/intentMatcher");

describe('Intent Matcher', function () {

    beforeEach(function () {
        intentMatcher.intents = [];
    });

    describe('matchInputToIntent()', function () {

        it("Should correctly match input", function () {
            intentMatcher.addIntent("[please] (activate|enable|switch on|turn on) [(the|my)] (lights|lighting) [please]", "turn_light_on");

            var result = intentMatcher.matchInputToIntent("switch on my lights please");

            assert.equal(result.intent, "turn_light_on");
            assert(result.confidence > 0.5, "The confidence was expected to be greater than 0.5 but was " + result.confidence);
        });

        it("Should find when there is no match", function () {
            intentMatcher.addIntent("[please] (activate|enable|switch on|turn on) [(the|my)] (lights|lighting) [please]", "turn_light_on");

            var result = intentMatcher.matchInputToIntent("Switch on my");

            assert.equal(result.intent, "");
            assert(result.confidence < 0.5, "The confidence was expected to be less than 0.5 but was " + result.confidence);
        });

        it("Should correctly wildcards input", function () {
            intentMatcher.addIntent("ask Google [(to|for|what)] * please", "ask_google");

            var result = intentMatcher.matchInputToIntent("ask Google what the circumference of the earth is please");

            assert.equal(result.intent, "ask_google");
            assert(result.confidence > 0.5, "The confidence was expected to be greater than 0.5 but was " + result.confidence);
        });

    });

    describe('getInputs()', function () {

        it ("Should return all possible input phrase for an intent matcher", function () {
            var matcher = intentMatcher.addIntent("ask Google [(to|for|what)] * please", "ask_google");

            var inputs = matcher.getInputs();

            assert.equal(inputs.length, 4);
            assert.equal(inputs[0], "ask Google * please");
            assert.equal(inputs[1], "ask Google to * please");
            assert.equal(inputs[2], "ask Google for * please");
            assert.equal(inputs[3], "ask Google what * please");
        });

    });

});