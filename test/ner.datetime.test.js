var assert = require("assert");
var moment = require('moment');

var datetimeNer = require("../src/nlp/ner/datetime");

var eql = function (string, moment) {
    assert.equal(datetimeNer.extractDatetime(string), moment.format(), string);
};
var expEql = function (string, type, moment) {
    var matched = false;
    var entities = datetimeNer.extract(string);
    var i;
    for (i = 0; i < entities.length; i++) {
        if (entities[i].type === type) {
            // Assert ignores seconds since the process may take extended periods of time
            assert.equal(entities[i].value.slice(0, -9), moment.format().slice(0, -9), string);
            matched = true;
            break;
        }
    }
    assert.equal(matched, true, "An entity was not extracted: " + string);
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
            eql("13 days from tomorrow", moment().add(14, 'd'));
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
            eql("thursday night", moment(nextThursday).hour(20));
            eql("this evening", moment().hour(18));
            eql("in the evening", moment().hour(18));
            eql("next thursday evening", moment(nextThursday).hour(18));
            //eql("next week on friday", moment(nextThursday).add(1, 'd')); // TODO: Handle complex dates
        });

    });

    describe("extract()", function () {

        it("should extract datetime values", function () {
            expEql("I should drink coffee tomorrow morning.", 'datetime.datetime', moment().add(1, "d").hour(7));

            var nextThursday = moment();
            if (nextThursday.day() > 4) {
                nextThursday.day(11);
            } else {
                nextThursday.day(4);
            }
            expEql("April, would you like to go to the park next Thursday for lunch?", 'datetime.datetime', nextThursday);
            expEql("We are expecting a package 2 days from now.", 'datetime.datetime', moment().add(2, 'd'));
            expEql("In 2 weeks, we will be leaving for Paris.", 'datetime.datetime', moment().add(2, 'w'));
            expEql("1 week from tomorrow, there is a parade.", 'datetime.datetime', moment().add(1, 'd').add(1, 'w'));
            expEql("What is the weather like tomorrow?", 'datetime.datetime', moment().add(1, 'd'));
            expEql("What is the weather like in the evening?", 'datetime.datetime', moment().hour(18));
            expEql("What did you do yesterday?", 'datetime.datetime', moment().subtract(1, 'd'));
        });

    });

});