var moment = require('moment');
var speak = require("speakeasy-nlp");
var shuffle = require('knuth-shuffle').knuthShuffle;

var SmallTalk = function (nlp) {

    this.intent = [
        {value: "(hi|hello|hey|what [is] up|what is happening|yo|sup|good (morning|evening|afternoon)) *", trigger: "smalltalk.greeting"},
        {value: "([i will] (see|talk to) you later|see you|later|[and] i am (off|out)|i am leaving|bye|goodbye|[have a] good (night|day)|have a good (morning|evening|afternoon)) *", trigger: "smalltalk.farewell"},
        {value: "You are *", trigger: "smalltalk.compliment"},
        {value: "I (love|adore|can not live without|like|dislike|can not stand|despise|hate) you", trigger: "smalltalk.compliment"},
        {value: "(thank you|thanks)", trigger: "smalltalk.gratitude"},
        {value: "how (are|have) you [been] [(doing|feeling)] *", trigger: "smalltalk.getAiInfo"},
        {value: "what (is your name|do you call yourself|should I call you)", trigger: "smalltalk.getAiInfo"},
        {value: "who are you", trigger: "smalltalk.getAiInfo"},
        {value: "who am I talking to", trigger: "smalltalk.getAiInfo"},
        {value: "where are you", trigger: "smalltalk.getAiInfo"},
        {value: "do I know [who] you [are]", trigger: "smalltalk.getAiInfo"},
        {value: "what [(other|else|[kind of] (things|tasks|jobs))] (can I ask you to|are you able to|can you) do [for me]", trigger: "smalltalk.getAiInfo"},
        {value: "what [(other|else|[kind of] (things|questions))] can (I ask [you [about]]|you answer [for me])", trigger: "smalltalk.getAiInfo"},
        {value: "what are you (doing|up to|working on|thinking about)", trigger: "smalltalk.getAiThoughts"},
        {value: "do you know ([what] my name [is]|who I am|me|who you are (talking|speaking) (to|with))", trigger: "smalltalk.getUserName"},
        {value: "(what is my name|who am I)", trigger: "smalltalk.getUserName"},
        {value: "I [already] (said|told you) that [already] *", trigger: "smalltalk.apologize"}
    ];

    this.triggers = {

        greeting: function (dfd, expression, utils) {
            var name = utils.getMemory('userName');

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
                    {value: "(Hello|Hi). (How can I (help [you]|be of assistance)|What can I (help you with|do for you)) " + name + "?", weight: 3},
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
                    {value: "(Hi|Hello). [I don't (think|believe) we've (met|been [properly] introduced).] What is your name?", expectations: [
                        { value: "[(it is|my name is|you can call me)] *name", trigger: "smalltalk.setUserName" }
                    ]}
                ]);
            }

            dfd.resolve(responses);
        },

        farewell: function (dfd, expression, utils) {
            var name = utils.getMemory('userName');

            var responses = [
                "Goodbye!",
                "Talk to you later."
            ];

            var dt = new Date().getHours();
            if (dt >= 0 && dt <= 8) {
                responses.push({value: "Have a good morning.", weight: 2});
            } else if (dt >= 9 && dt <= 14) {
                responses.push({value: "Have a good afternoon.", weight: 2});
            } else if (dt >= 15 && dt <= 20) {
                responses.push({value: "Have a good evening.", weight: 2});
            } else {
                responses.push({value: "(Have a good|Good) night.", weight: 2});
            }

            if (name) {
                responses = responses.concat([
                    {value: "Goodbye " + name + ".", weight: 3},
                    {value: "Talk to you later " + name + ".", weight: 3}
                ]);
                if (dt >= 0 && dt <= 8) {
                    responses.push({value: "Have a good morning " + name + ".", weight: 2});
                } else if (dt >= 9 && dt <= 14) {
                    responses.push({value: "Have a good afternoon " + name + ".", weight: 2});
                } else if (dt >= 15 && dt <= 20) {
                    responses.push({value: "Have a good evening " + name + ".", weight: 2});
                } else {
                    responses.push({value: "(Have a good|Good) night " + name + ".", weight: 2});
                }
            }

            dfd.resolve(responses);
        },

        compliment: function (dfd, expression, utils) {
            var responses = [];

            var name = utils.getMemory('userName');

            var sentiment = speak.sentiment.analyze(expression.normalized).score;

            if (sentiment < 0) {
                responses = responses.concat([
                    "That wasn't [very] (nice|kind)."
                ]);
                if (name) {
                    responses = responses.concat([
                        {value: "That wasn't [very] (nice|kind) " + name + ".", weight: 2}
                    ]);
                }
            } else if (sentiment === 0 && !expression.contains("friend")) {
                responses = responses.concat([
                    "I am a just a rather very intelligent system.",
                    "I am your personal assistant."
                ]);
            } else {
                responses = responses.concat([
                    "You shouldn't...",
                    "(Thank you|Thanks)!",
                    "Why thank you!"
                ]);
                if (name) {
                    responses = responses.concat([
                        {value: "[(Thanks|Thank you)!] That is [very] (nice|kind) [of you] " + name + ".", weight: 2},
                        {value: "(Thank you|Thanks) " + name + ".", weight: 2}
                    ]);
                }
            }

            dfd.resolve(responses);
        },

        gratitude: function (dfd, expression, utils) {
            var name = utils.getMemory('userName');

            var responses = [
                "(You're [very] welcome|No problem).",
                "I'm happy to help!"
            ];

            if (name) {
                responses = responses.concat([
                    {value: "(You're [very] welcome|No problem) " + name + ".", weight: 2}
                ]);
            }

            dfd.resolve(responses);
        },

        getAiInfo: function (dfd, expression, utils) {
            var responses = [];

            var name = utils.getMemory('aiName');

            if (expression.contains('who')) {
                responses = responses.concat([
                    "I am your personal assistant."
                ]);
                if (name) {
                    responses = responses.concat([
                        {value: "I am your personal assistant " + name + ".", weight: 2}
                    ]);
                } else {
                    responses = responses.concat([
                        {value: "I am your personal assistant. What ((would you like|do you want) to (call|name) me|should my name be)?", weight: 2, expectations: [
                            { value: "[(your name is|i will call you|it is|how about|what about)] *name", trigger: "smalltalk.setAiName" }
                        ]}
                    ]);
                }
            } else if (expression.contains('how')) {
                responses = [
                    {value: "I'm doing (well|fine|great), [(thanks|thank you),] ([and] (how|what) about you|[and] how are you [doing]|and yourself)?", expectations: [
                        { value: "(good|fine|great|awesome|awful|terrible|miserable|not good|bad|not great|not awesome|i (am [feeling]|have been) *)", trigger: "smalltalk.setUserFeeling" }
                    ]}
                ];
            } else if (expression.contains("what") && expression.contains("skills", "you do", "ask", "questions", "answer")) {
                var examples = shuffle(utils.getExamples().slice(0));
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
                        {value: "[(I don't know|I'm not sure) what my name is.] What ((would you like|do you want) to (call|name) me|should my name be)?", expectations: [
                            { value: "[(your name is|i will call you|it is|how about|what about)] *name", trigger: "smalltalk.setAiName" }
                        ]}
                    ]);
                }
            }

            dfd.resolve(responses);
        },

        getAiThoughts: function (dfd, expression) {
            var responses = [];

            responses = responses.concat([
                "I'm (thinking about|pondering) (life|gravity|the mysteries of the universe|the meaning of life)."
            ]);

            if (expression.contains("doing")) {
                responses = responses.concat([
                    "I'm thinking."
                ]);
            } else if (expression.contains("thinking")) {
                responses = responses.concat([
                    "About (life|gravity|the mysteries of the universe|the meaning of life)."
                ]);
            }

            dfd.resolve(responses);
        },

        setAiBirthday: function (dfd, expression, utils) {
            var i;
            var birthday;

            var entities = nlp.personNer.extract(expression.normalized, expression);
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'person.age') {
                    birthday = entities[i].value;
                    break;
                }
            }

            if (birthday) {
                utils.setMemory('aIBirthday', birthday);
                dfd.resolve();
            } else {
                dfd.reject();
            }
        },

        getAiAge: function (dfd, expression, utils) {
            var responses = [];
            var i;
            var timeFromNow;

            var entities = nlp.datetimeNer.extract(expression.normalized);
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'datetime.datetime') {
                    timeFromNow = entities[i].value;
                    break;
                }
            }

            var birthday = utils.getMemory('aIBirthday');
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

        setAiName: function (dfd, expression, utils) {
            var i;
            var name;

            var entities = nlp.personNer.extract(expression.normalized, expression);
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'person.name') {
                    name = entities[i].value;
                    break;
                }
            }

            if (name) {
                utils.setMemory('aiName', name);
                dfd.resolve([
                    "[That's a (great|good) name.] You (can|may) now call me " + name + ".",
                    "From hence forth I shall be " + name + " the (mighty|magnificent|omnipotent|all knowing|all powerful)!"
                ]);
            } else {
                dfd.reject();
            }
        },

        setUserBirthday: function (dfd, expression, utils) {
            var i;
            var birthday;

            var entities = nlp.personNer.extract(expression.normalized, expression);
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'person.age') {
                    birthday = entities[i].value;
                    break;
                }
            }

            if (birthday) {
                utils.setMemory('userBirthday', birthday);
                dfd.resolve();
            } else {
                dfd.reject();
            }
        },

        getUserAge: function (dfd, expression, utils) {
            var responses = [];
            var i;
            var timeFromNow;

            var entities = nlp.datetimeNer.extract(expression.normalized);
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'datetime.datetime') {
                    timeFromNow = entities[i].value;
                    break;
                }
            }

            var birthday = utils.getMemory('userBirthday');
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

        setUserName: function (dfd, expression, utils) {
            var i;
            var name;

            var entities = nlp.personNer.extract(expression.normalized, expression);
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'person.name') {
                    name = entities[i].value;
                    break;
                }
            }

            if (name) {
                utils.setMemory('userName', name);
                var responses = [
                    "It's (nice|great|a pleasure) to (meet you|make your acquaintance), " + name + "."
                ];
                dfd.resolve(responses);
            } else {
                dfd.reject();
            }
        },

        getUserName: function (dfd, expression, utils) {
            var responses = [];

            var name = utils.getMemory('userName');

            if (name) {
                responses.push("Your name is " + name + ".");
            } else {
                responses.push({value: "(I'm not sure|I don't know). What is your name?", expectations: [
                    { value: "[(it is|my name is|you can call me)] *name", trigger: "smalltalk.setUserName" }
                ]});
            }

            dfd.resolve(responses);
        },

        setUserFeeling: function (dfd, expression) {
            var responses = [];

            var sentiment = speak.sentiment.analyze(expression.normalized).score;

            if (sentiment < 0) {
                responses.push("I'm [very] (sorry|sad) to hear that.");
            } else if (sentiment === 0 && !expression.contains("ok")) {
                responses.push({value: "[I'm not sure I understand. ]What do you mean?", expectations: [
                    { value: "(good|fine|great|awesome|awful|terrible|miserable|not good|bad|not great|not awesome|i (am [feeling]|have been) *)", trigger: "smalltalk.setUserFeeling" }
                ]});
            } else {
                responses.push("I'm [very] (glad|happy) to hear that.");
            }

            dfd.resolve(responses);
        },

        apologize: function (dfd, expression) {
            var responses = [];

            var sentiment = speak.sentiment.analyze(expression.normalized).score;

            if (sentiment < 0) {
                responses.push("I'm (very|terribly) sorry.");
            } else {
                responses.push("(I'm sorry|I apologize).");
            }

            if (expression.contains("already") && expression.contains("said", "told")) {
                if (sentiment < 0) {
                    responses.push("I'm (very|terribly) sorry. I must have forgotten [that you (said|told me) that].");
                } else {
                    responses.push("(I'm sorry|I apologize). I must have forgotten [that you (said|told me) that].");
                }
            }

            dfd.resolve(responses);
        }
    };
};

module.exports = {
    namespace: "smalltalk",
    examples: [
        "What is your name?",
        "What can you do?",
        "How are you?"
    ],
    register: function (config, nlp) {
        return new SmallTalk(nlp);
    }
};