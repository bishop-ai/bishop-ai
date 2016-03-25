var assert = require("assert");
var moment = require('moment');

var datetime = require("../entities/datetime").entity;

var ext = function (string) {
    return datetime.extractors.datetime(string);
};

describe('Datetime Entity', function () {

    describe('datetime()', function () {

        it("should handle time from now", function () {
            assert.equal(ext("13 days from now"), moment().add(13, 'd').format(), "13 days from now");
            assert.equal(ext("in 9 years from now"), moment().add(9, 'y').format(), "9 years from now");
            assert.equal(ext("in 1 century"), moment().add(100, 'y').format(), "1 century from now");
            assert.equal(ext("1 minute from now"), moment().add(1, 'm').format(), "1 minute from now");
            assert.equal(ext("a minute from now"), moment().add(1, 'm').format(), "a minute from now");
            //assert.equal(ext("2 hours and 3 minutes from now"), moment().add(2, 'h').add(3, 'm').format(), "2 hours and 3 minutes from now"); // TODO Support complex amount
        });

        it("should handle time from relative", function () {
            assert.equal(ext("13 days from tomorrow"), moment().add(14, 'd').hour(7).format(), "13 days from tomorrow");
            assert.equal(ext("2 weeks from today"), moment().add(2, 'w').format(), "2 weeks from today");

            var nextThursday = moment();
            if (nextThursday.day() > 4) {
                nextThursday.day(11);
            } else {
                nextThursday.day(4);
            }

            assert.equal(ext("9 years from next Thursday"), nextThursday.add(9, 'y').format(), "9 years from next Thursday");
        });

        it("should handle time ago", function () {
            assert.equal(ext("13 days ago"), moment().subtract(13, 'd').format(), "13 days ago");
            assert.equal(ext("9 years ago"), moment().subtract(9, 'y').format(), "9 years ago");
            assert.equal(ext("1 century ago"), moment().subtract(100, 'y').format(), "1 century ago");
            assert.equal(ext("1 minute ago"), moment().subtract(1, 'm').format(), "1 minute ago");
        });

        it("should handle relative time", function () {
            var nextThursday = moment();
            if (nextThursday.day() > 4) {
                nextThursday.day(11);
            } else {
                nextThursday.day(4);
            }
            assert.equal(ext("next Thursday"), nextThursday.format(), "next Thursday");
            assert.equal(ext("this coming Thursday"), nextThursday.format(), "this coming Thursday");
            assert.equal(ext("next month"), moment().add(1, "M").format(), "next month");

            var lastApril = moment();
            if (lastApril.month() < 3) {
                lastApril.subtract(1, "y");
            }
            lastApril.month(3);
            assert.equal(ext("last April"), lastApril.format(), "last April");
            assert.equal(ext("this last April"), lastApril.format(), "this last April");

            assert.equal(ext("tomorrow morning"), moment().add(1, "d").hour(7).format(), "tomorrow morning");
            assert.equal(ext("this evening"), moment().hour(18).format(), "this evening");
            assert.equal(ext("next thursday evening"), moment(nextThursday).hour(18).format(), "next thursday evening");
        });

    });

});