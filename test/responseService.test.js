var assert = require("assert");

var responseService = require("../src/responseService");

describe('Response Service', function () {

    describe('getResponses()', function () {

        it ("Should return all possible response phrase for a response template", function () {

            var template = "(Hello|Hi). [(How can I (help [you]|be of assistance)|What can I (help you with|do for you)), Steve?]";

            /*
            hello
            hi
            hello. how can I help
            hi. how can I help
            hello how can I help you
            hi. how can i help you
            hello how can I be of assistance
            hi how can i be of assistance
            hello what can i help you with
            hi what can i help you with
            hello what can i do for you
            hi what can I do for you
             */

            var inputs = responseService.getResponses(template);

            assert.equal(inputs.length, 12);
            assert.equal(inputs[0].value, "Hello.");
            assert.equal(inputs[1].value, "Hi.");
            assert.equal(inputs[2].value, "Hello. How can I help, Steve?");
            assert.equal(inputs[3].value, "Hi. How can I help, Steve?");
            assert.equal(inputs[4].value, "Hello. How can I help you, Steve?");
            assert.equal(inputs[5].value, "Hi. How can I help you, Steve?");
            assert.equal(inputs[6].value, "Hello. How can I be of assistance, Steve?");
            assert.equal(inputs[7].value, "Hi. How can I be of assistance, Steve?");
            assert.equal(inputs[8].value, "Hello. What can I help you with, Steve?");
            assert.equal(inputs[9].value, "Hi. What can I help you with, Steve?");
            assert.equal(inputs[10].value, "Hello. What can I do for you, Steve?");
            assert.equal(inputs[11].value, "Hi. What can I do for you, Steve?");
        });

        it ("Should take a simple string and return the same text", function () {

            var simpleResponse = "Hey there!";

            var inputs = responseService.getResponses(simpleResponse);

            assert.equal(inputs.length, 1);
            assert.equal(inputs[0].value, "Hey there!");
        });

    });

});