var moment = require('moment');

var SmallTalk = function () {

    this.intent = [
        {value: "Hi", trigger: "smalltalk.greeting"},
        {value: "Hello", trigger: "smalltalk.greeting"},
        {value: "Hey", trigger: "smalltalk.greeting"},
        {value: "You are awesome", trigger: "smalltalk.compliment"},
        {value: "You're the best", trigger: "smalltalk.compliment"},
        {value: "You have a great personality", trigger: "smalltalk.compliment"},
        {value: "Thank you!", trigger: "smalltalk.gratitude"},
        {value: "Thanks!", trigger: "smalltalk.gratitude"},
        {value: "How are you?", trigger: "smalltalk.getAiFeeling"},
        {value: "How are you doing?", trigger: "smalltalk.getAiFeeling"},
        {value: "I'm doing alright.", trigger: "smalltalk.setUserFeeling", context: "smalltalk.howAreYou"},
        {value: "What is your name?", trigger: "smalltalk.getAiName"},
        {value: "Who are you?", trigger: "smalltalk.getAiInfo"},
        {value: "Your name is David", trigger: "smalltalk.setAiName"},
        {value: "I'll call you Jarvis", trigger: "smalltalk.setAiName"},
        {value: "My name is David", trigger: "smalltalk.setUserName"},
        {value: "You can call me Jarvis", trigger: "smalltalk.setUserName"},
        {value: "Call me Jude", trigger: "smalltalk.setUserName"},
        {value: "My name is David", trigger: "smalltalk.setUserName", context: "smalltalk.whatIsYourName"},
        {value: "You can call me Jarvis", trigger: "smalltalk.setUserName", context: "smalltalk.whatIsYourName"},
        {value: "It's Allison", trigger: "smalltalk.setUserName", context: "smalltalk.whatIsYourName"},
        {value: "Call me Jude", trigger: "smalltalk.setUserName", context: "smalltalk.whatIsYourName"},
        {value: "David", trigger: "smalltalk.setUserName", context: "smalltalk.whatIsYourName"},
        {value: "Steve", trigger: "smalltalk.setUserName", context: "smalltalk.whatIsYourName"},
        {value: "Allison", trigger: "smalltalk.setUserName", context: "smalltalk.whatIsYourName"},
        {value: "Jude", trigger: "smalltalk.setUserName", context: "smalltalk.whatIsYourName"},
        {value: "Your name is David", trigger: "smalltalk.setAiName", context: "smalltalk.whatIsMyName"},
        {value: "I'll call you Jarvis", trigger: "smalltalk.setAiName", context: "smalltalk.whatIsMyName"},
        {value: "It's Allison", trigger: "smalltalk.setAiName", context: "smalltalk.whatIsMyName"},
        {value: "You can be Jude", trigger: "smalltalk.setAiName", context: "smalltalk.whatIsMyName"},
        {value: "David", trigger: "smalltalk.setAiName", context: "smalltalk.whatIsMyName"},
        {value: "Steve", trigger: "smalltalk.setAiName", context: "smalltalk.whatIsMyName"},
        {value: "Allison", trigger: "smalltalk.setAiName", context: "smalltalk.whatIsMyName"},
        {value: "Jude", trigger: "smalltalk.setAiName", context: "smalltalk.whatIsMyName"},
        {value: "What is my name?", trigger: "smalltalk.getUserName"}
    ];

    this.triggers = {

        greeting: function (dfd, expression, entities, getMemory) {
            var name = getMemory('userName');

            var responses = [
                "Hello. What can I help you with?",
                "Hello. How can I be of assistance?",
                "Hi. What can I do for you?",
                "Hi. How can I help?",
                "Hi.",
                "Hello.",
                "Hey there!"
            ];

            if (name) {
                responses = responses.concat([
                    {value: "Hello. What can I help you with, " + name + "?", preference: 1},
                    {value: "Hi " + name + ". How can I be of assistance?", preference: 1},
                    {value: "Hi. What can I do for you, " + name + "?", preference: 1},
                    {value: "Hi " + name + ". How can I help?", preference: 1},
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
                "No problem!",
                "Happy to help!",
                "I do what I can."
            ];

            if (name) {
                responses = responses.concat([
                    {value: "You're welcome, " + name + ".", preference: 1},
                    {value: "Of course, " + name + ".", preference: 1}
                ]);
            }

            dfd.resolve(responses);
        },

        getAiFeeling: function (dfd) {
            var responses = [
                {value: "I'm doing well, how are you?", context: "smalltalk.howAreYou"}
            ];

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

        getAiName: function (dfd, expression, entities, getMemory) {
            var responses = [];

            var name = getMemory('aiName');

            if (name) {
                responses.push("My name is " + name + ".");
            } else {
                responses = responses.concat([
                    "I'm not sure.",
                    "I don't know what my name is.",
                    "No one has ever given me a name.",
                    "I'm not sure what my name is.",
                    {value: "What would you like to call me?", context: "smalltalk.whatIsMyName"},
                    {value: "What should my name be?", context: "smalltalk.whatIsMyName"}
                ]);
            }

            dfd.resolve(responses);
        },

        getAiInfo: function (dfd, expression, entities, getMemory) {
            var responses = [];

            var name = getMemory('aiName');

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

            dfd.resolve(responses);
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

        setUserFeeling: function (dfd) {
            // TODO: Extract the entity, determine if it is positive or negative, store this, return responses
            dfd.resolve([]);
        }
    };
};

module.exports = {
    namespace: "smalltalk",
    type: 'SKILL',
    register: function () {
        return new SmallTalk();
    }
};