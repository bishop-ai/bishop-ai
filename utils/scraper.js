var phantom = require('node-phantom-simple');
var $q = require('q');

var scraper = {
    ph: null
};

scraper.summarize = function (msg) {
    var lines = msg.split('\n');
    var linesToKeep = [];

    var i;
    var linesToRemove = [];
    for (i = 0; i < lines.length; i++) {
        if (!lines[i] || lines[i].indexOf("...") >= 0 || lines[i].substring(lines[i].length - 1) !== "." || lines[i].toLowerCase().indexOf("http") === 0) {
            linesToRemove.push(i);
        }
    }
    for (i = linesToRemove.length - 1; i >= 0; i--) {
        lines.splice(linesToRemove[i], 1);
    }

    // Remove duplicates
    for (i = 0; i < lines.length; i++) {
        if (linesToKeep.indexOf(lines[i]) === -1) {
            linesToKeep.push(lines[i]);
        }
    }

    return linesToKeep;
};

scraper.search = function (term) {
    var dfd = $q.defer();
    var self = this;

    var doSearch = function (page, term) {
        var dfd = $q.defer();
        page.onLoadFinished = function (status) {
            dfd.resolve(status);
        };

        page.evaluate(function (term) {
            var input = document.getElementsByName('q')[0];
            input.value = term;
            input.form.submit();
            return true;
        }, term, function () {
        });

        return dfd.promise;
    };

    var displayResults = function (page) {
        var dfd = $q.defer();

        var result = "";
        page.onConsoleMessage = function (msg) {
            result = msg;
        };

        page.evaluate(function () {
            console.log(document.getElementById("res").innerText);
            return true;
        }, function () {
            dfd.resolve(result);
        });
        return dfd.promise;
    };

    this.ph.createPage(function (err, page) {
        if (err) {
            dfd.reject(err);
        } else {

            page.onError = function (msg) {
                console.log(msg);
            };

            page.onLoadFinished = function (status) {
                if (status === 'success') {
                    doSearch(page, term).then(function (status) {
                        if (status === 'success') {
                            displayResults(page).then(function (msg) {
                                dfd.resolve(self.summarize(msg));
                            });
                        } else {
                            dfd.reject('Connection failed.');
                        }
                    });
                } else {
                    dfd.reject('Connection failed.');
                }
            };

            page.open("http://google.com");
        }
    });

    return dfd.promise;
};

scraper._init = function () {
    var self = this;
    phantom.create(function (err, ph) {
        if (err) {
            console.log("Scraper Error: " + err);
        } else {
            console.log("Scraper Initialized");
            self.ph = ph;
        }
    });
};

scraper._init();

module.exports = scraper;