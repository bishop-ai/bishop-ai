var assert = require("assert");

var intentService = require("../src/intentService");

describe('Intent Service', function () {

    beforeEach(function () {
        intentService.intents = [];
    });

    describe('matchInputToIntent()', function () {

        it("Should correctly match input", function () {
            var intent = [];
            intent.push(new intentService.Matcher("(activate|enable|switch on|turn on) [(the|my)] (lights|lighting)", "turn_light_on"));
            intent.push(new intentService.Matcher("what is the weather [going to be] like tomorrow", "get_weather"));

            var result = intentService.matchInputToIntent("switch on my lights please", intent);

            assert.equal(result.intent, "turn_light_on");
            assert(result.confidence > 0.5, "The confidence was expected to be greater than 0.5 but was " + result.confidence);

            result = intentService.matchInputToIntent("what is the weather like tomorrow?", intent);

            assert.equal(result.intent, "get_weather");
            assert(result.confidence > 0.5, "The confidence was expected to be greater than 0.5 but was " + result.confidence);
        });

        it("Should find when there is no match", function () {
            var intent = new intentService.Matcher("(activate|enable|switch on|turn on) [(the|my)] (lights|lighting)", "turn_light_on");

            var result = intentService.matchInputToIntent("Switch on my", [intent]);

            assert.equal(result.intent, "");
            assert(result.confidence < 0.5, "The confidence was expected to be less than 0.5 but was " + result.confidence);
        });

        it("Should correctly handle wildcards in input", function () {
            var intent = new intentService.Matcher("ask Google [(to|for|what)] * please", "ask_google");

            var result = intentService.matchInputToIntent("ask Google what the circumference of the earth is please", [intent]);

            assert.equal(result.intent, "ask_google");
            assert(result.confidence > 0.5, "The confidence was expected to be greater than 0.5 but was " + result.confidence);
        });

        it("Should correctly handle named wildcards in input", function () {
            var intent = new intentService.Matcher("play [the song] *song [by [the artist] *artist] [from [the album] *album] [on spotify]", "play_song");

            var result = intentService.matchInputToIntent("Play the song Stairway to Heaven by Led Zeppelin on spotify", [intent]);

            assert.equal(result.intent, "play_song");
            assert.equal(result.namedWildcards.song, "Stairway to Heaven");
            assert.equal(result.namedWildcards.artist, "Led Zeppelin");
            assert(result.confidence > 0.5, "The confidence was expected to be greater than 0.5 but was " + result.confidence);
        });

    });

    describe('getInputs()', function () {

        it("Should return all possible input phrase for an intent matcher", function () {
            var intent = new intentService.Matcher("ask Google [(to|for|what)] * please", "ask_google");

            var inputs = intent.getInputs();

            assert.equal(inputs.length, 4);
            assert.equal(inputs[0], "ask Google * please");
            assert.equal(inputs[1], "ask Google to * please");
            assert.equal(inputs[2], "ask Google for * please");
            assert.equal(inputs[3], "ask Google what * please");
        });

    });

    describe('getSpecificity()', function () {

        it("Should should add up the number of required tokens to match for the intent", function () {
            var intent1 = new intentService.Matcher("ask Google [(to|for|what)] * please", "ask_google");
            var intent2 = new intentService.Matcher("play [the song] *song [by [the artist] *artist] [from [the album] *album] [on spotify]", "play_song");
            var intent3 = new intentService.Matcher("(activate|enable|switch on|turn on) [(the|my)] (lights|lighting)", "turn_light_on");
            var intent4 = new intentService.Matcher("(switch on [my really cool]|turn on my [awesome]) (lights|lighting) *", "turn_light_on");

            assert.equal(intent1.specificity, 3);
            assert.equal(intent2.specificity, 1);
            assert.equal(intent3.specificity, 2);
            assert.equal(intent4.specificity, 3);
        });

    });

});