var moment = require('moment');

var DateTimeExtractor = function (commonExtractor, commonExpressions) {
    this.extractor = commonExtractor;
    this.expressions = commonExpressions;

    this.relativeTimeOfDay = new RegExp("(((in the )?" + this.expressions.timeOfDayInThe.source + ")|(((at|around) )?" + this.expressions.timeOfDayAt.source + ")|(the " + this.expressions.timeOfDayInThe.source + " of))", "i");
    this.relativeTime = new RegExp("((right now)|(" + this.relativeTimeOfDay.source + " )?(today|yesterday|tomorrow|tonight)( " + this.relativeTimeOfDay.source + ")?|" + this.expressions.daysOfWeek.source + "( " + this.relativeTimeOfDay.source + ")?|(this " + this.expressions.timeOfDayInThe.source + ")|((" + this.relativeTimeOfDay.source + " )?this " + this.expressions.daysOfWeek.source + "( " + this.relativeTimeOfDay.source + ")?)|((this|next|last) (" + this.expressions.daysOfWeek.source + "|" + this.expressions.timePeriods.source + "|" + this.expressions.monthOfYear.source + "))|(in the " + this.expressions.timeOfDayInThe.source + ")|((at|around) " + this.expressions.timeOfDayAt.source + "))", "i");

    this.timeLength = new RegExp("(\\d+|a|an) " + this.expressions.timePeriods.source, "i");
    this.timeFromNow = new RegExp("((in " + this.timeLength.source + " from (now|" + this.relativeTime.source + "))|(in " + this.timeLength.source + ")|(" + this.timeLength.source + " from (now|" + this.relativeTime.source + ")))", "i");
    this.timeAgo = new RegExp("(" + this.timeLength.source + " ago( " + this.relativeTime.source + ")?)", "i");
};

/**
 * Used to extract the entities from an expression
 * @param {String} normalized input
 * @returns {extractor.Entity[]}
 */
DateTimeExtractor.prototype.extract = function (normalized) {
    var entities = [];
    entities = entities.concat(this.extractor.extract(normalized, 'datetime.datetime', new RegExp("(" + this.timeFromNow.source + "|" + this.timeAgo.source + "|" + this.relativeTime.source + ")", "i"), this.extractDatetime.bind(this)));
    entities = entities.concat(this.extractor.extract(normalized, 'datetime.duration', this.timeLength, this.extractDuration.bind(this)));
    return entities;
};

/**
 * Extracts the datetime value from a string
 * @param {String} string Containing the value to extract
 * @returns {String} ISO8601 Date
 */
DateTimeExtractor.prototype.extractDatetime = function (string) {
    var date = moment();

    if (string.match(/tonight/i)) {
        date.hour(20); // 8pm
    } else if (string.match(/tomorrow/i)) {
        date.add(1, 'd');
    } else if (string.match(/yesterday/i)) {
        date.subtract(1, 'd');
    }

    var relative = string.match(new RegExp("((on|this (coming)?|(this past)|last|next) (" + this.expressions.daysOfWeek.source + "|" + this.expressions.timePeriods.source + "|" + this.expressions.monthOfYear.source + ")|(" + this.expressions.daysOfWeek.source + "|" + this.expressions.monthOfYear.source + "))", "i"));
    if (relative) {
        var past = relative[0].match(/(last|(this past))/i);
        var dayOfWeek = relative[0].match(new RegExp(this.expressions.daysOfWeek.source, "i"));
        var monthOfYear = relative[0].match(new RegExp(this.expressions.monthOfYear.source, "i"));
        var timePeriod = relative[0].match(new RegExp(this.expressions.timePeriods.source, "i"));

        if (dayOfWeek) {
            var currentDay = date.day();
            var setDay = currentDay;
            switch (dayOfWeek[0].toLowerCase()) {
            case 'monday':
                setDay = 1;
                break;
            case 'tuesday':
                setDay = 2;
                break;
            case 'wednesday':
                setDay = 3;
                break;
            case 'thursday':
                setDay = 4;
                break;
            case 'friday':
                setDay = 5;
                break;
            case 'saturday':
                setDay = 6;
                break;
            case 'sunday':
                setDay = 0;
                break;
            }

            if (past && setDay >= currentDay) {
                setDay -= 7;
            }
            if (!past && setDay < currentDay) {
                setDay += 7;
            }

            date.day(setDay);
        }

        if (monthOfYear) {
            var currentMonth = date.month();
            var setMonth = currentMonth;
            switch (monthOfYear[0].toLowerCase()) {
            case 'january':
                setMonth = 0;
                break;
            case 'february':
                setMonth = 1;
                break;
            case 'march':
                setMonth = 2;
                break;
            case 'april':
                setMonth = 3;
                break;
            case 'may':
                setMonth = 4;
                break;
            case 'june':
                setMonth = 5;
                break;
            case 'july':
                setMonth = 6;
                break;
            case 'august':
                setMonth = 7;
                break;
            case 'september':
                setMonth = 8;
                break;
            case 'october':
                setMonth = 9;
                break;
            case 'november':
                setMonth = 10;
                break;
            case 'december':
                setMonth = 11;
                break;
            }

            if (past && setMonth >= currentMonth) {
                date.subtract(1, "y");
            }
            if (!past && setMonth < currentMonth) {
                date.add(1, "y");
            }

            date.month(setMonth);
        }

        if (timePeriod) {
            switch (timePeriod[0].toLowerCase()) {
            case 'week':
                date = (past) ? date.subtract(1, "w") : date.add(1, "w");
                break;
            case 'month':
                date = (past) ? date.subtract(1, "M") : date.add(1, "M");
                break;
            case 'year':
                date = (past) ? date.subtract(1, "y") : date.add(1, "y");
                break;
            }
        }
    }

    var timeOfDay = string.match(new RegExp(this.expressions.timeOfDay.source, 'i'));
    if (timeOfDay) {
        switch (timeOfDay[0].toLowerCase()) {
        case 'dawn':
            date.hour(6); // 6am
            break;
        case 'morning':
        case 'sunrise':
            date.hour(7); // 7am
            break;
        case 'noon':
        case 'midday':
        case 'mid-day':
            date.hour(12); // 12pm
            break;
        case 'afternoon':
            date.hour(14); // 2pm
            break;
        case 'evening':
        case 'sunset':
            date.hour(18); // 6pm
            break;
        case 'dusk':
            date.hour(19); // 7pm
            break;
        case 'night':
            date.hour(20); // 8pm
            break;
        case 'midnight':
            date.hour(23).minute(59); // 11:59pm
            break;
        }
    }

    var fromNow = string.match(new RegExp(this.timeFromNow.source, 'i'));
    var ago = string.match(new RegExp(this.timeAgo.source, 'i'));
    if (fromNow || ago) {
        var number;
        if ((fromNow && fromNow[0].match(/^(a|an)/)) || (ago && ago[0].match(/^(a|an)/))) {
            number = 1;
        } else if (fromNow) {
            number = parseInt(fromNow[0].match(/\d+/)[0], 10);
        } else {
            number = parseInt(ago[0].match(/\d+/)[0], 10);
        }
        if (number) {
            var extractedTimePeriod = string.match(this.expressions.timePeriods);
            switch (extractedTimePeriod[0]) {
            case 'second':
            case 'seconds':
                date = (fromNow) ? date.add(number, 's') : date.subtract(number, 's');
                break;
            case 'minute':
            case 'minutes':
                date = (fromNow) ? date.add(number, 'm') : date.subtract(number, 'm');
                break;
            case 'hour':
            case 'hours':
                date = (fromNow) ? date.add(number, 'h') : date.subtract(number, 'h');
                break;
            case 'day':
            case 'days':
                date = (fromNow) ? date.add(number, 'd') : date.subtract(number, 'd');
                break;
            case 'week':
            case 'weeks':
                date = (fromNow) ? date.add(number, 'w') : date.subtract(number, 'w');
                break;
            case 'month':
            case 'months':
                date = (fromNow) ? date.add(number, 'M') : date.subtract(number, 'M');
                break;
            case 'year':
            case 'years':
                date = (fromNow) ? date.add(number, 'y') : date.subtract(number, 'y');
                break;
            case 'decade':
            case 'decades':
                date = (fromNow) ? date.add(number * 10, 'y') : date.subtract(number * 10, 'y');
                break;
            case 'century':
            case 'centuries':
                date = (fromNow) ? date.add(number * 100, 'y') : date.subtract(number * 100, 'y');
                break;
            case 'millennium':
            case 'millennia':
                date = (fromNow) ? date.add(number * 1000, 'y') : date.subtract(number * 1000, 'y');
                break;
            }
        }
    }

    return date.format();
};

/**
 * Extract a length of time in seconds from a string
 * @param {string} string
 * @returns {number} Seconds
 */
DateTimeExtractor.prototype.extractDuration = function (string) {
    var seconds = 0;
    var number = parseInt(string.match(/\d+/)[0], 10);

    if (number) {
        var extractedTimePeriod = string.match(this.expressions.timePeriods);
        if (extractedTimePeriod) {
            switch (extractedTimePeriod[0]) {
            case 'second':
            case 'seconds':
                seconds = number;
                break;
            case 'minute':
            case 'minutes':
                seconds = number * 60;
                break;
            case 'hour':
            case 'hours':
                seconds = number * 60 * 60;
                break;
            case 'day':
            case 'days':
                seconds = number * 60 * 60 * 24;
                break;
            case 'week':
            case 'weeks':
                seconds = number * 60 * 60 * 24 * 7;
                break;
            case 'month':
            case 'months':
                seconds = Math.round(number * 60 * 60 * 24 * 30.42);
                break;
            case 'year':
            case 'years':
                seconds = number * 60 * 60 * 24 * 365;
                break;
            case 'decade':
            case 'decades':
                seconds = number * 60 * 60 * 24 * 365 * 10;
                break;
            case 'century':
            case 'centuries':
                seconds = number * 60 * 60 * 24 * 365 * 100;
                break;
            case 'millennium':
            case 'millennia':
                seconds = number * 60 * 60 * 24 * 365 * 1000;
                break;
            }
        }
    }

    return seconds;
};

module.exports = {
    namespace: 'datetime',
    type: 'ENTITY_EXTRACTOR',
    register: function (config) {
        return new DateTimeExtractor(config.commonExtractor, config.commonExpressions);
    }
};