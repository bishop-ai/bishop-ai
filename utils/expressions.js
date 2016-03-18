var expressions = {};

var writtenNumberUnit = /((hundred thousand)|(hundred grand)|(hundred million)|(hundred billion)|(hundred trillion)|(thousand million)|(thousand billion)|(thousand trillion)|(million trillion)|(million billion)|(million trillion)|(billion trillion)|hundred|thousand|grand|million|billion|trillion)/;
var writtenNumberBase = /(one|two|three|four|five|six|seven|eight|nine)/;
var writtenNumberBaseTeen = /(ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)/;
var writtenNumberMultiple = /(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)/;
var writtenNumberMultipleBase = new RegExp(writtenNumberMultiple.source + " " + writtenNumberBase.source);
var writtenNumberSingle = new RegExp("(((" + writtenNumberMultipleBase.source + "|" + writtenNumberMultiple.source + "|" + writtenNumberBaseTeen.source + "|" + writtenNumberBase.source + ")( " + writtenNumberUnit.source + ")?))");

expressions.writtenNumber = new RegExp("(" + writtenNumberSingle.source + ")+( and " + writtenNumberSingle.source + ")?");
expressions.writtenNumberUnits = writtenNumberUnit;

expressions.timePeriods = /(millennium|millennia|centuries|century|decades|decade|years|year|months|month|weeks|week|days|day|hours|hour|minutes|minute|seconds|second)/;

expressions.timeLength = new RegExp("(\\d+|(a( " + expressions.writtenNumberUnits.source + ")?)|" + expressions.writtenNumber.source + ") " + expressions.timePeriods.source);
expressions.timeFromNow = new RegExp("((in " + expressions.timeLength.source + " from now)|(in " + expressions.timeLength.source + ")|(" + expressions.timeLength.source + " from now))");
expressions.timeAgo = new RegExp("(" + expressions.timeLength.source + " ago)");

expressions.age = new RegExp("(" + expressions.timeLength.source + " (old|young))");

expressions.url = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)/i;

module.exports = expressions;