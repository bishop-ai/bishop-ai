var moment = require('moment');
var speak = require("speakeasy-nlp");

var SmallTalk = function () {

    this.intent = [
        {value: "Hi", trigger: "smalltalk.greeting"},
        {value: "hi", trigger: "smalltalk.greeting"},
        {value: "Hello", trigger: "smalltalk.greeting"},
        {value: "hello", trigger: "smalltalk.greeting"},
        {value: "Hey", trigger: "smalltalk.greeting"},
        {value: "You are awesome", trigger: "smalltalk.compliment"},
        {value: "You are the best", trigger: "smalltalk.compliment"},
        {value: "You are good at this", trigger: "smalltalk.compliment"},
        {value: "You are brilliant", trigger: "smalltalk.compliment"},
        {value: "You are smart", trigger: "smalltalk.compliment"},
        {value: "You are great", trigger: "smalltalk.compliment"},
        {value: "I love you", trigger: "smalltalk.compliment"},
        {value: "Thank you", trigger: "smalltalk.gratitude"},
        {value: "Thanks", trigger: "smalltalk.gratitude"},
        {value: [["how", "are", "you"], "doing", "?"], trigger: "smalltalk.getAiInfo"},
        {value: "your name", trigger: "smalltalk.getAiInfo"},
        {value: "What is your name?", trigger: "smalltalk.getAiInfo"},
        {value: "What do you call yourself?", trigger: "smalltalk.getAiInfo"},
        {value: "What should I call you?", trigger: "smalltalk.getAiInfo"},
        {value: [["who", "are", "you"], "?"], trigger: "smalltalk.getAiInfo"},
        {value: "Who am I talking to?", trigger: "smalltalk.getAiInfo"},
        {value: "Do I know you?", trigger: "smalltalk.getAiInfo"},
        {value: "Do I know who you are?", trigger: "smalltalk.getAiInfo"},
        {value: "What are you able to do?", trigger: "smalltalk.getAiInfo"},
        {value: "What can you do?", trigger: "smalltalk.getAiInfo"},
        {value: "What things can you do?", trigger: "smalltalk.getAiInfo"},
        {value: "What kind of things can you do for me?", trigger: "smalltalk.getAiInfo"},
        {value: "What things can I ask you about?", trigger: "smalltalk.getAiInfo"},
        {value: "What can I ask you about?", trigger: "smalltalk.getAiInfo"},
        {value: "What can you answer for me?", trigger: "smalltalk.getAiInfo"},
        {value: "What questions can I ask?", trigger: "smalltalk.getAiInfo"},
        {value: "What questions can you answer?", trigger: "smalltalk.getAiInfo"},
        {value: "What tasks can you do?", trigger: "smalltalk.getAiInfo"},
        {value: "Do you know my name?", trigger: "smalltalk.getUserName"},
        {value: "Do you know who I am?", trigger: "smalltalk.getUserName"},
        {value: "Do you know me?", trigger: "smalltalk.getUserName"},
        {value: "What is my name?", trigger: "smalltalk.getUserName"}
    ];

    this.triggers = {

        greeting: function (dfd, expression, entities, getMemory) {
            var name = getMemory('userName');

            var responses = [
                "Hello. What can I help you with?",
                "Hello. How can I be of assistance?",
                "Hi. What can I do for you?",
                "Hi. How can I help you?",
                "Hi.",
                "Hello.",
                "Hey there!"
            ];

            var dt = new Date().getHours();
            if (dt >= 0 && dt <= 11) {
                responses.push({value: "Good morning.", preference: 0.9});
            } else if (dt >= 12 && dt <= 17) {
                responses.push({value: "Good afternoon.", preference: 0.9});
            } else {
                responses.push({value: "Good evening.", preference: 0.9});
            }

            if (name) {
                responses = responses.concat([
                    {value: "Hello. What can I help you with, " + name + "?", preference: 1},
                    {value: "Hi " + name + ". How can I be of assistance?", preference: 1},
                    {value: "Hi. What can I do for you, " + name + "?", preference: 1},
                    {value: "Hi " + name + ". How can I help you?", preference: 1},
                    {value: "Hi " + name + ".", preference: 1},
                    {value: "Hello " + name + ".", preference: 1},
                    {value: name + "! Nice to see you again.", preference: 1}
                ]);
            }

            if (!name) {
                responses = responses.concat([
                    {value: "Hi. I don't think we've met. What is your name?", context: "smalltalk.whatIsYourName"},
                    {value: "Hello. What's your name?", context: "smalltalk.whatIsYourName"}
                ]);
            }

            dfd.resolve(responses);
        },

        compliment: function (dfd, expression, entities, getMemory) {
            var name = getMemory('userName');

            var responses = [
                "You shouldn't...",
                "Thank you!",
                "Why, thank you!"
            ];

            if (name) {
                responses = responses.concat([
                    {value: "That is nice of you, " + name + ".", preference: 1},
                    {value: "Thank you, " + name + ".", preference: 1}
                ]);
            }

            dfd.resolve(responses);
        },

        gratitude: function (dfd, expression, entities, getMemory) {
            var name = getMemory('userName');

            var responses = [
                "You're welcome.",
                "No problem.",
                "I'm happy to help!"
            ];

            if (name) {
                responses = responses.concat([
                    {value: "You're welcome, " + name + ".", preference: 1},
                    {value: "No problem, " + name + ".", preference: 1}
                ]);
            }

            dfd.resolve(responses);
        },

        getAiInfo: function (dfd, expression, entities, getMemory, setMemory, setConfig, getExamples) {
            var responses = [];

            var name = getMemory('aiName');

            if (expression.contains('who')) {
                if (name) {
                    responses = responses.concat([
                        {value: "I am your personal assistant, " + name + ".", preference: 1}
                    ]);
                } else {
                    responses = responses.concat([
                        "I am your personal assistant.",
                        "I'm here to help.",
                        {value: "I am your personal assistant. What would you like to call me?", context: "smalltalk.whatIsMyName"},
                        {value: "I am your personal assistant. What should my name be?", context: "smalltalk.whatIsMyName"}
                    ]);
                }
            } else if (expression.contains('how')) {
                responses = [
                    {value: "I'm doing well, how are you?", context: "smalltalk.howAreYou"}
                ];
            } else if (expression.contains("what") && expression.contains("skills", "you do", "ask", "questions", "answer")) {
                var i;
                var examples = getExamples();
                for (i = 0; i < examples.length; i++) {
                    responses.push("Say: " + examples[i]);
                }
            } else {
                if (name) {
                    responses.push("My name is " + name + ".");
                    responses.push("You can call me " + name + ".");
                } else {
                    responses = responses.concat([
                        "I don't know what my name is.",
                        "No one has ever given me a name.",
                        "I'm not sure what my name is.",
                        {value: "What would you like to call me?", context: "smalltalk.whatIsMyName"},
                        {value: "What should my name be?", context: "smalltalk.whatIsMyName"}
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
                responses.push("I'm not sure how old I am.");
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
                    "That's a great name. You can now call me " + name + ".",
                    "From hence forth, I shall be " + name + " the magnificent!"
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
                responses.push("I'm not sure how old you am.");
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
                    "It's nice to meet you, " + name + ".",
                    "It's a pleasure to meet you, " + name + "."
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
                responses.push({value: "I'm not sure. What is your name?", context: "smalltalk.whatIsYourName"});
            }

            dfd.resolve(responses);
        },

        setUserFeeling: function (dfd, expression) {
            var responses = [];

            var sentiment = speak.sentiment.analyze(expression.normalized).score;

            if (sentiment < 0) {
                responses.push("I'm sorry to hear that.");
            } else {
                responses.push("Glad to hear that.");
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