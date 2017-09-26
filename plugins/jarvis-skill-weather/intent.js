module.exports = [
    {value: "what is the weather like [today]", trigger: "weather.getCurrent"},
    {value: "what is the weather [going to be] like tomorrow?", trigger: "weather.getTomorrow"},
    {value: "what is the temperature", trigger: "weather.getCurrentTemp"},
    {value: "what temperature is it", trigger: "weather.getCurrentTemp"},
    {value: "what is the temperature like tomorrow", trigger: "weather.getTomorrowTemp"},
    {value: "what temperature is it going to be tomorrow", trigger: "weather.getTomorrowTemp"},
    {value: "is it (hot|warm|cool|cold|freezing [cold]|burning [hot]) [(out|outside)] [today]", trigger: "weather.getCurrentTemp"},
    {value: "how (hot|warm|cool|cold) is it [(out|outside)] [today]", trigger: "weather.getCurrentTemp"},
    {value: "(will it|is it going to) be (hot|warm|cool|cold|freezing [cold]|burning [hot]) [(out|outside)] tomorrow", trigger: "weather.getTomorrowTemp"},
    {value: "is it snowing", trigger: "weather.getCurrentConditionSnow"},
    {value: "(will there be|is it going to) snow tomorrow", trigger: "weather.getTomorrowConditionSnow"},
    {value: "(will there be|is it going to) snow [later [this week]]", trigger: "weather.getFutureConditionSnow"},
    {value: "is it raining", trigger: "weather.getCurrentConditionRain"},
    {value: "do I need (an umbrella|a [rain] coat)", trigger: "weather.getCurrentConditionRain"},
    {value: "(will there be|is it going to) rain tomorrow", trigger: "weather.getTomorrowConditionRain"},
    {value: "will I need (an umbrella|a [rain] coat) tomorrow?", trigger: "weather.getTomorrowConditionRain"},
    {value: "(will there be|is it going to) rain [later [this week]]", trigger: "weather.getFutureConditionRain"}
];