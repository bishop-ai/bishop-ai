var moment = require('moment');

var Rel = function (createTrigger, createInjector, getMemory, createMemory) {

    createTrigger('setBirthday');
    createTrigger('setName');
    createInjector('getName');
    createInjector('getAge');

    this.triggers = {
        setBirthday: function (dfd, expression, entities) {
            var i;
            var birthday;
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'person.age') {
                    birthday = entities[i].value;
                    break;
                }
            }

            if (birthday) {
                createMemory('birthday', birthday).then(function () {
                    dfd.resolve();
                }, function (e) {
                    dfd.reject(e);
                });
            } else {
                dfd.resolve();
            }
        },

        setName: function (dfd, expression, entities) {
            var i;
            var name;
            for (i = 0; i < entities.length; i++) {
                if (entities[i].type === 'person.name') {
                    name = entities[i].value;
                    break;
                }
            }

            if (name) {
                createMemory('name', entities[i].value).then(function () {
                    dfd.resolve();
                }, function (e) {
                    dfd.reject(e);
                });
            } else {
                dfd.resolve();
            }
        }
    };

    this.conditions = {
        hasName: function (dfd) {
            getMemory('name').then(function (name) {
                if (name) {
                    dfd.resolve(true);
                } else {
                    dfd.resolve(false);
                }
            }, function (e) {
                dfd.reject(e);
            });
        },

        noName: function (dfd) {
            getMemory('name').then(function (name) {
                if (name) {
                    dfd.resolve(false);
                } else {
                    dfd.resolve(true);
                }
            }, function (e) {
                dfd.reject(e);
            });
        }
    };

    this.injectors = {
        getAge: function (dfd, expression, responseEntities, matchEntities) {
            var i;
            var age;
            var timeFromNow;
            for (i = 0; i < responseEntities.length; i++) {
                if (responseEntities[i].type === 'person.age') {
                    age = responseEntities[i].raw;
                    break;
                }
            }
            for (i = 0; i < matchEntities.length; i++) {
                if (matchEntities[i].type === 'datetime.datetime') {
                    timeFromNow = matchEntities[i].value;
                    break;
                }
            }

            if (age) {
                getMemory('birthday').then(function (birthday) {
                    var response = "";
                    if (birthday) {
                        var timeFrom;
                        if (timeFromNow) {
                            timeFrom = moment(birthday).from(timeFromNow, true);
                        } else {
                            timeFrom = moment(birthday).fromNow(true);
                        }

                        response = expression.value.replace(age, timeFrom + " old");
                    } else {
                        response = expression.value.replace(age, "not sure");
                    }

                    dfd.resolve(response);
                }, function (e) {
                    dfd.reject(e);
                });
            } else {
                dfd.resolve();
            }
        },

        getName: function (dfd, expression, responseEntities, matchEntities) {
            var i;
            var name;
            for (i = 0; i < responseEntities.length; i++) {
                if (responseEntities[i].type === 'person.name') {
                    name = responseEntities[i].value;
                    break;
                }
            }

            if (name) {
                getMemory('name').then(function (nameToInject) {
                    var response = expression.value.replace(name, nameToInject);
                    dfd.resolve(response);
                }, function (e) {
                    dfd.reject(e);
                });
            } else {
                dfd.resolve();
            }
        }
    };
};

module.exports = {Constructor: Rel, namespace: 'rel'};