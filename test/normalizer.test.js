var assert = require("assert");

var normalizer = require("../src/nlp/normalizer");

describe('Normalizer', function () {

    describe('clean()', function () {

        it("should replace substitutes", function () {
            assert.equal(normalizer.clean("Nov 1st I weighed 90 kgs. total"), "November 1st I weighed 90 kilograms total");
            assert.equal(normalizer.clean("I shared it on FB w/ friends, ie: you"), "I shared it on Facebook with friends, for example: you");
        });

        it("should not expand contractions", function () {
            assert.equal(normalizer.clean("I'm on the yelow zebra"), "I'm on the yellow zebra");
            assert.equal(normalizer.clean("I'll listen to y'all"), "I'll listen to you all");
            assert.equal(normalizer.clean("don't make it right"), "don't make it right");
            assert.equal(normalizer.clean("it's all good"), "it's all good");
        });

        it("should replace alternate spellings", function () {
            assert.equal(normalizer.normalize("armour axe coloured gold"), "armor ax colored gold");
        });

        it("should fix spelling", function () {
            assert.equal(normalizer.normalize("are we sceduled thrsday for teh restraunt"), "are we scheduled Thursday for the restaurant");
        });

        it("should not remove +", function () {
            assert.equal(normalizer.normalize("3+4=7"), "3+4=7");
        });

        it("should remove extra spaces", function () {
            assert.equal(normalizer.normalize("this    is     spaced 		out"), "this is spaced out");
            assert.equal(normalizer.normalize("Well , I could not help it, could I"), "Well, I could not help it, could I");
        });

        it("should remove commas from numbers", function () {
            assert.equal(normalizer.normalize("how much is 1,000.00"), "how much is 1000.00");
        });

        it("should replace ASCII characters", function () {
            assert.equal(normalizer.normalize("What’s up"), "What is up");
            assert.equal(normalizer.normalize("What's up"), "What is up");
            assert.equal(normalizer.normalize("I said “shut up”"), 'I said "shut up"');
            assert.equal(normalizer.normalize("œ"), '');
        });

    });

    describe('normalize()', function () {

        it("should replace substitutes", function () {
            assert.equal(normalizer.normalize("Nov 1st I weighed 90 kgs. total"), "November 1st I weighed 90 kilograms total");
            assert.equal(normalizer.normalize("I shared it on FB w/ friends, ie: you"), "I shared it on Facebook with friends, for example: you");
        });

        it("should expand contractions", function () {
            assert.equal(normalizer.normalize("I'm on the yelow zebra"), "I am on the yellow zebra");
            assert.equal(normalizer.normalize("I'll listen to y'all"), "I will listen to you all");
            assert.equal(normalizer.normalize("don't make it right"), "do not make it right");
            assert.equal(normalizer.normalize("it's all good"), "it is all good");
        });

        it("should replace alternate spellings", function () {
            assert.equal(normalizer.normalize("armour axe coloured gold"), "armor ax colored gold");
        });

        it("should fix spelling", function () {
            assert.equal(normalizer.normalize("are we sceduled thrsday for teh restraunt"), "are we scheduled Thursday for the restaurant");
        });

        it("should replace written numbers", function () {
            assert.equal(normalizer.normalize("Nov 1st I spent One hundred ninety five thousand and twenty three dollars"), "November 1st I spent 195023 dollars");
        });

        it("should replace written time", function () {
            assert.equal(normalizer.normalize("At one thirty two I spent One hundred ninety five thousand and twenty three dollars"), "At 1:32 I spent 195023 dollars");
        });

        it("should not remove +", function () {
            assert.equal(normalizer.normalize("3+4=7"), "3+4=7");
        });

        it("should remove extra spaces", function () {
            assert.equal(normalizer.normalize("this    is     spaced 		out"), "this is spaced out");
            assert.equal(normalizer.normalize("Well , I could not help it, could I"), "Well, I could not help it, could I");
        });

        it("should remove commas from numbers", function () {
            assert.equal(normalizer.normalize("how much is 1,000.00"), "how much is 1000.00");
        });

        it("should replace ASCII characters", function () {
            assert.equal(normalizer.normalize("What’s up"), "What is up");
            assert.equal(normalizer.normalize("What's up"), "What is up");
            assert.equal(normalizer.normalize("I said “shut up”"), 'I said "shut up"');
            assert.equal(normalizer.normalize("œ"), '');
        });

    });

    describe('cleanChars()', function () {

        it("should remove extra spaces", function () {
            assert.equal(normalizer.cleanChars("this    is     spaced 		out"), "this is spaced out");
            assert.equal(normalizer.cleanChars("Well , I could not help it, could I"), "Well, I could not help it, could I");
        });

        it("should remove commas from numbers", function () {
            assert.equal(normalizer.cleanChars("how much is 1,000.00"), "how much is 1000.00");
        });

        it("should replace ASCII characters", function () {
            assert.equal(normalizer.cleanChars("What’s up"), "What's up");
            assert.equal(normalizer.cleanChars("What's up"), "What's up");
            assert.equal(normalizer.cleanChars("I said “shut up”"), 'I said "shut up"');
            assert.equal(normalizer.cleanChars("œ"), '');
        });

    });

    describe('replaceWrittenTime()', function () {

        it("should replace written numbers", function () {
            assert.equal(normalizer.replaceWrittenTime("twelve thirty five"), "12:35");
            assert.equal(normalizer.replaceWrittenTime("three thirty"), "3:30");
            assert.equal(normalizer.replaceWrittenTime("six oh five"), "6:05");
            assert.equal(normalizer.replaceWrittenTime("sixteen thirty"), "sixteen thirty");
        });

    });

    describe('replaceWrittenNumbers()', function () {

        it("should replace written numbers", function () {
            assert.equal(normalizer.replaceWrittenNumbers("One hundred and ninety five thousand and twenty three"), "195023");
            assert.equal(normalizer.replaceWrittenNumbers("a hundred thousand"), "100000");
            assert.equal(normalizer.replaceWrittenNumbers("twenty-three million twelve hundred one"), "23001201");
            assert.equal(normalizer.replaceWrittenNumbers("One hundred thirty-five"), "135");
            assert.equal(normalizer.replaceWrittenNumbers("Two thousand three hundred seventy-seven"), "2377");
            assert.equal(normalizer.replaceWrittenNumbers("Sixteen million three hundred twenty thousand"), "16320000");
            assert.equal(normalizer.replaceWrittenNumbers("Two million and four"), "2000004");
            assert.equal(normalizer.replaceWrittenNumbers("2 hundred"), "200");
        });

    });
});