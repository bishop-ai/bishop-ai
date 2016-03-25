var assert = require("assert");
var moment = require('moment');

var datetime = require("../entities/datetime").entity;

var eql = function (string, moment) {
    assert.equal(datetime.extractors.datetime(string), moment.format(), string);
};

describe('Datetime Entity', function () {

    describe('datetime()', function () {

        /*it("should handle time", function () {
            eql("6 p.m.", moment().hour(18));
            eql("6:30 in the morning", moment().hour(6).minute(30));
            eql("9:06 tomorrow evening", moment().add(1, 'd').hour(21).minute(6));
            eql("tomorrow evening at 9:06", moment().add(1, 'd').hour(21).minute(6));
        });*/

        it("should handle time from now", function () {
            eql("13 days from now", moment().add(13, 'd'));
            eql("in 9 years from now", moment().add(9, 'y'));
            eql("in 1 century", moment().add(100, 'y'));
            eql("1 minute from now", moment().add(1, 'm'));
            eql("a minute from now", moment().add(1, 'm'));
            //eql("2 hours and 3 minutes from now", moment().add(2, 'h').add(3, 'm')); // TODO Support complex amount
        });

        it("should handle time from relative", function () {
            eql("13 days from tomorrow", moment().add(14, 'd').hour(7));
            eql("2 weeks from today", moment().add(2, 'w'));

            var nextThursday = moment();
            if (nextThursday.day() > 4) {
                nextThursday.day(11);
            } else {
                nextThursday.day(4);
            }

            eql("9 years from next Thursday", nextThursday.add(9, 'y'));
        });

        it("should handle time ago", function () {
            eql("13 days ago", moment().subtract(13, 'd'));
            eql("9 years ago", moment().subtract(9, 'y'));
            eql("1 century ago", moment().subtract(100, 'y'));
            eql("1 minute ago", moment().subtract(1, 'm'));
        });

        it("should handle relative datetimes", function () {
            var nextThursday = moment();
            if (nextThursday.day() > 4) {
                nextThursday.day(11);
            } else {
                nextThursday.day(4);
            }
            eql("next Thursday", nextThursday);
            eql("this coming Thursday", nextThursday);
            eql("next month", moment().add(1, "M"));

            var lastApril = moment();
            if (lastApril.month() < 3) {
                lastApril.subtract(1, "y");
            }
            lastApril.month(3);
            eql("last April", lastApril);
            eql("this last April", lastApril);

            eql("tomorrow morning", moment().add(1, "d").hour(7));
            eql("this evening", moment().hour(18));
            eql("next thursday evening", moment(nextThursday).hour(18));
            //eql("next week on friday", moment(nextThursday).add(1, 'd')); // TODO: Handle complex dates
        });

    });

});