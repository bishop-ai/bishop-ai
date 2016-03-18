var should = require("should");

var normalizer = require("../nlp/normalizer/index");

describe('Normalizer', function () {

    describe('clean()', function () {

        it("should replace substitutes", function () {
            normalizer.clean("Nov 1st I weighed 90 kgs. total").should.eql("November 1st I weighed 90 kilograms total");
            normalizer.clean("I shared it on FB w/ friends, ie: you").should.eql("I shared it on Facebook with friends, for example: you");
        });

        it("should not expand contractions", function () {
            normalizer.clean("I'm on the yelow zebra").should.eql("I'm on the yellow zebra");
            normalizer.clean("I'll listen to y'all").should.eql("I'll listen to you all");
            normalizer.clean("don't make it right").should.eql("don't make it right");
            normalizer.clean("it's all good").should.eql("it's all good");
        });

        it("should replace alternate spellings", function () {
            normalizer.normalize("armour axe coloured gold").should.eql("armor ax colored gold");
        });

        it("should fix spelling", function () {
            normalizer.normalize("are we sceduled thrsday for teh restraunt").should.eql("are we scheduled Thursday for the restaurant");
        });

        it("should not remove +", function () {
            normalizer.normalize("3+4=7").should.eql("3+4=7");
        });

        it("should remove extra spaces", function () {
            normalizer.normalize("this    is     spaced 		out").should.eql("this is spaced out");
            normalizer.normalize("Well , I could not help it, could I").should.eql("Well, I could not help it, could I");
        });

        it("should remove commas from numbers", function () {
            normalizer.normalize("how much is 1,000.00").should.eql("how much is 1000.00");
        });

        it("should replace ASCII characters", function () {
            normalizer.normalize("What’s up").should.eql("What is up");
            normalizer.normalize("What's up").should.eql("What is up");
            normalizer.normalize("I said “shut up”").should.eql('I said "shut up"');
            normalizer.normalize("œ").should.eql('');
        });

    });

    describe('normalize()', function () {

        it("should replace substitutes", function () {
            normalizer.normalize("Nov 1st I weighed 90 kgs. total").should.eql("November 1st I weighed 90 kilograms total");
            normalizer.normalize("I shared it on FB w/ friends, ie: you").should.eql("I shared it on Facebook with friends, for example: you");
        });

        it("should expand contractions", function () {
            normalizer.normalize("I'm on the yelow zebra").should.eql("I am on the yellow zebra");
            normalizer.normalize("I'll listen to y'all").should.eql("I will listen to you all");
            normalizer.normalize("don't make it right").should.eql("do not make it right");
            normalizer.normalize("it's all good").should.eql("it is all good");
        });

        it("should replace alternate spellings", function () {
            normalizer.normalize("armour axe coloured gold").should.eql("armor ax colored gold");
        });

        it("should fix spelling", function () {
            normalizer.normalize("are we sceduled thrsday for teh restraunt").should.eql("are we scheduled Thursday for the restaurant");
        });

        it("should not remove +", function () {
            normalizer.normalize("3+4=7").should.eql("3+4=7");
        });

        it("should remove extra spaces", function () {
            normalizer.normalize("this    is     spaced 		out").should.eql("this is spaced out");
            normalizer.normalize("Well , I could not help it, could I").should.eql("Well, I could not help it, could I");
        });

        it("should remove commas from numbers", function () {
            normalizer.normalize("how much is 1,000.00").should.eql("how much is 1000.00");
        });

        it("should replace ASCII characters", function () {
            normalizer.normalize("What’s up").should.eql("What is up");
            normalizer.normalize("What's up").should.eql("What is up");
            normalizer.normalize("I said “shut up”").should.eql('I said "shut up"');
            normalizer.normalize("œ").should.eql('');
        });

    });


    describe('cleanChars()', function () {

        it("should remove extra spaces", function () {
            normalizer.cleanChars("this    is     spaced 		out").should.eql("this is spaced out");
            normalizer.cleanChars("Well , I could not help it, could I").should.eql("Well, I could not help it, could I");
        });

        it("should remove commas from numbers", function () {
            normalizer.cleanChars("how much is 1,000.00").should.eql("how much is 1000.00");
        });

        it("should replace ASCII characters", function () {
            normalizer.cleanChars("What’s up").should.eql("What's up");
            normalizer.cleanChars("What's up").should.eql("What's up");
            normalizer.cleanChars("I said “shut up”").should.eql('I said "shut up"');
            normalizer.cleanChars("œ").should.eql('');
        });

    });
});