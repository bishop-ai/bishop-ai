var moment = require('moment');
var speak = require("speakeasy-nlp");
var shuffle = require('knuth-shuffle').knuthShuffle;

var SmallTalk = function () {

    this.intent = [
        {value: "(hi|hello|hey) *", trigger: "smalltalk.greeting"},
        {value: "You are *", trigger: "smalltalk.compliment"},
        {value: "I (love|adore|can not live without|like|dislike|can not stand|despise|hate) you", trigger: "smalltalk.compliment"},
        {value: "(thank you|thanks)", trigger: "smalltalk.gratitude"},
        {value: "how (are|have) you [been] [(doing|feeling)]", trigger: "smalltalk.getAiInfo"},
        {value: "what (is your name|do you call yourself|should I call you)", trigger: "smalltalk.getAiInfo"},
        {value: "who are you", trigger: "smalltalk.getAiInfo"},
        {value: "who am I talking to", trigger: "smalltalk.getAiInfo"},
        {value: "where are you", trigger: "smalltalk.getAiInfo"},
        {value: "do I know [who] you [are]", trigger: "smalltalk.getAiInfo"},
        {value: "what [(other|else|[kind of] (things|tasks|jobs))] (can I ask you to|are you able to|can you) do [for me]", trigger: "smalltalk.getAiInfo"},
        {value: "what [(other|else|[kind of] (things|questions))] can (I ask [you [about]]|you answer [for me])", trigger: "smalltalk.getAiInfo"},
        {value: "do you know ([what] my name [is]|who I am|me|who you are (talking|speaking) (to|with))", trigger: "smalltalk.getUserName"},
        {value: "(what is my name|who am I)", trigger: "smalltalk.getUserName"}
    ];

    this.triggers = {

        greeting: function (dfd, expression, entities, getMemory) {
            var name = getMemory('userName');

            var responses = [
                "(Hello|Hi). [(How can I (help [you]|be of assistance)|What can I (help you with|do for you))?]",
                "Hey there!"
            ];

            var dt = new Date().getHours();
            if (dt >= 0 && dt <= 11) {
                responses.push({value: "Good morning.", weight: 2});
            } else if (dt >= 12 && dt <= 17) {
                responses.push({value: "Good afternoon.", weight: 2});
            } else {
                responses.push({value: "Good evening.", weight: 2});
            }

            if (name) {
                responses = responses.concat([
                    {value: "(Hello|Hi) " + name + ". [(How can I (help [you]|be of assistance)|What can I (help you with|do for you))?]", weight: 3},
                    {value: "(Hello|Hi). (How can I (help [you]|be of assistance)|What can I (help you with|do for you)), " + name + "?", weight: 3},
                    {value: name + "! Nice to see you again.", weight: 3}
                ]);
                if (dt >= 0 && dt <= 11) {
                    responses.push({value: "Good morning " + name + ". [(How can I (help [you]|be of assistance)|What can I (help you with|do for you))?]", weight: 4});
                } else if (dt >= 12 && dt <= 17) {
                    responses.push({value: "Good afternoon " + name + ". [(How can I (help [you]|be of assistance)|What can I (help you with|do for you))?]", weight: 4});
                } else {
                    responses.push({value: "Good evening " + name + ". [(How can I (help [you]|be of assistance)|What can I (help you with|do for you))?]", weight: 4});
                }
            }

            if (!name) {
                responses = responses.concat([
                    {value: "(Hi|Hello). [I don't (think|believe) we've (met|been [properly] introduced).] What is your name?", context: "smalltalk.whatIsYourName"}
                ]);
            }

            dfd.resolve(responses);
        },

        compliment: function (dfd, expression, entities, getMemory) {
            var responses = [];

            var name = getMemory('userName');

            var sentiment = speak.sentiment.analyze(expression.normalized).score;

            if (sentiment < 0) {
                responses = responses.concat([
                    "That wasn't [very] (nice|kind)."
                ]);
                if (name) {
                    responses = responses.concat([
                        {value: "That wasn't [very] (nice|kind), " + name + ".", weight: 2}
                    ]);
                }
            } else if (sentiment === 0) {
                responses = responses.concat([
                    "I am a just a rather very intelligent system.",
                    "I am your personal assistant."
                ]);
            } else {
                responses = responses.concat([
                    "You shouldn't...",
                    "Thank you!",
                    "Why, thank you!"
                ]);
                if (name) {
                    responses = responses.concat([
                        {value: "That is [very] (nice|kind) [of you], " + name + ".", weight: 2},
                        {value: "Thank you, " + name + ".", weight: 2}
                    ]);
                }
            }

            dfd.resolve(responses);
        },

        gratitude: function (dfd, expression, entities, getMemory) {
            var name = getMemory('userName');

            var responses = [
                "(You're welcome|No problem).",
                "I'm happy to help!"
            ];

            if (name) {
                responses = responses.concat([
                    {value: "(You're welcome|No problem), " + name + ".", weight: 2}
                ]);
            }

            dfd.resolve(responses);
        },

        getAiInfo: function (dfd, expression, entities, getMemory, setMemory, setConfig, getExamples) {
            var responses = [];

            var name = getMemory('aiName');

            if (expression.contains('who')) {
                responses = responses.concat([
                    "I am your personal assistant.",
                    "I'm here to help."
                ]);
                if (name) {
                    responses = responses.concat([
                        {value: "I am your personal assistant, " + name + ".", weight: 2}
                    ]);
                } else {
                    responses = responses.concat([
                        {value: "I am your personal assistant. What ((would you like|do you want) to (call|name) me|should my name be)?", weight: 2, context: "smalltalk.whatIsMyName"}
                    ]);
                }
            } else if (expression.contains('how')) {
                responses = [
                    {value: "I'm doing (well|fine|great), (how about you|how are you [doing]|and yourself)?", context: "smalltalk.howAreYou"}
                ];
            } else if (expression.contains("what") && expression.contains("skills", "you do", "ask", "questions", "answer")) {
                var examples = shuffle(getExamples().slice(0));
                var max = Math.min(examples.length, 5);

                var response = "Here are [(some|a (few|couple))] [examples of] things you can say or ask: ";
                var addComma = false;

                var i;
                for (i = 0; i < max; i++) {
                    if (examples[i]) {
                        if (addComma) {
                            response += ", ";
                        }
                        response += "'" + examples[i] + "'";
                        addComma = true;
                    }
                }

                responses.push(response);
            } else if (expression.contains('where')) {
                responses = [
                    {value: "I exist within the constructs of a computer program."}
                ];
            } else {
                if (name) {
                    responses.push("[(My name is|You can call me)] " + name + ".");
                } else {
                    responses = responses.concat([
                        "(I don't know|I'm not sure) what my name is.",
                        "No one has ever given me a name.",
                        {value: "[(I don't know|I'm not sure) what my name is.] What ((would you like|do you want) to (call|name) me|should my name be)?", context: "smalltalk.whatIsMyName"}
                    ]);
                }
            }

            dfd.resolve(responses);
        },

        setAiBirthday: function (dfd, expression, entities, getMemory, setMemory) {
            var i;
            var birthday;
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'person.age') {
                    birthday = entities[i].value;
                    break;
                }
            }

            if (birthday) {
                setMemory('aIBirthday', birthday);
                dfd.resolve();
            } else {
                dfd.reject();
            }
        },

        getAiAge: function (dfd, expression, entities, getMemory) {
            var responses = [];
            var i;
            var timeFromNow;

            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'datetime.datetime') {
                    timeFromNow = entities[i].value;
                    break;
                }
            }

            var birthday = getMemory('aIBirthday');
            if (birthday) {
                var timeFrom;
                if (timeFromNow) {
                    timeFrom = moment(birthday).from(timeFromNow, true);
                    responses.push("You were " + timeFrom + " old."); // TODO: will be
                } else {
                    timeFrom = moment(birthday).fromNow(true);
                    responses.push("You are " + timeFrom + " old.");
                }
            } else {
                responses.push("(I'm not sure|I don't know) (how old|what age) I am.");
            }

            dfd.resolve(responses);
        },

        setAiName: function (dfd, expression, entities, getMemory, setMemory) {
            var i;
            var name;
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'person.name') {
                    name = entities[i].value;
                    break;
                }
            }

            if (name) {
                setMemory('aiName', name);
                dfd.resolve([
                    "[That's a (great|good) name.] You (can|may) now call me " + name + ".",
                    "From hence forth, I shall be " + name + ", the (mighty|magnificent|omnipotent|all knowing|all powerful)!"
                ]);
            } else {
                dfd.reject();
            }
        },

        setUserBirthday: function (dfd, expression, entities, getMemory, setMemory) {
            var i;
            var birthday;
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'person.age') {
                    birthday = entities[i].value;
                    break;
                }
            }

            if (birthday) {
                setMemory('userBirthday', birthday, true);
                dfd.resolve();
            } else {
                dfd.reject();
            }
        },

        getUserAge: function (dfd, expression, entities, getMemory) {
            var responses = [];
            var i;
            var timeFromNow;

            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'datetime.datetime') {
                    timeFromNow = entities[i].value;
                    break;
                }
            }

            var birthday = getMemory('userBirthday');
            if (birthday) {
                var timeFrom;
                if (timeFromNow) {
                    timeFrom = moment(birthday).from(timeFromNow, true);
                    responses.push("You were " + timeFrom + " old."); // TODO: will be
                } else {
                    timeFrom = moment(birthday).fromNow(true);
                    responses.push("You are " + timeFrom + " old.");
                }
            } else {
                responses.push("(I'm not sure|I don't know) (how old|what age) you are.");
            }

            dfd.resolve(responses);
        },

        setUserName: function (dfd, expression, entities, getMemory, setMemory) {
            var i;
            var name;
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'person.name') {
                    name = entities[i].value;
                    break;
                }
            }

            if (name) {
                setMemory('userName', name, true);
                var responses = [
                    "It's (nice|great|a pleasure) to (meet you|make your acquaintance), " + name + "."
                ];
                dfd.resolve(responses);
            } else {
                dfd.reject();
            }
        },

        getUserName: function (dfd, expression, entities, getMemory) {
            var responses = [];

            var name = getMemory('userName');

            if (name) {
                responses.push("Your name is " + name + ".");
            } else {
                responses.push({value: "(I'm not sure|I don't know). What is your name?", context: "smalltalk.whatIsYourName"});
            }

            dfd.resolve(responses);
        },

        setUserFeeling: function (dfd, expression) {
            var responses = [];

            var sentiment = speak.sentiment.analyze(expression.normalized).score;

            if (sentiment < 0) {
                responses.push("I'm [very] (sorry|sad) to hear that.");
            } else if (sentiment === 0) {
                responses.push({value: "[I'm not sure I understand. ]What do you mean?", context: "smalltalk.howAreYou"});
            } else {
                responses.push("I'm [very] (glad|happy) to hear that.");
            }

            dfd.resolve(responses);
        }
    };

    this.context = {
        "howAreYou": "smalltalk.setUserFeeling",
        "whatIsYourName": "smalltalk.setUserName",
        "whatIsMyName": "smalltalk.setAiName"
    };

    this.examples = [
        "What is your name?",
        "What can you do?",
        "How are you?"
    ];
};

module.exports = {
    namespace: "smalltalk",
    type: 'SKILL',
    register: function () {
        return new SmallTalk();
    }
};