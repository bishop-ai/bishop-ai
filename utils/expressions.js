var expressions = {};

expressions.timePeriods = /(millennium|millennia|centuries|century|decades|decade|years|year|months|month|weeks|week|days|day|hours|hour|minutes|minute|seconds|second)/;
expressions.daysOfWeek = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/;
expressions.monthOfYear = /(january|february|march|april|may|june|july|august|september|october|november|december)/;
expressions.timeOfDay = /(morning|evening|afternoon|night|noon|dawn|dusk|sunrise|sunset|midnight|midday|mid\-day)/;
expressions.timeOfDayInThe = /(morning|evening|afternoon|night)/;
expressions.timeOfDayAt = /(night|noon|dawn|dusk|sunrise|sunset|midnight|midday|mid\-day)/;

expressions.url = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)/i;

module.exports = expressions;