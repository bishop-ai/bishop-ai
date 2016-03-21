var $q = require('q');

var scraper = require('./../utils/scraper');

var GoogleScraper = function () {
    this._scraper = scraper;
    var self = this;
    this._scraper.createPage().then(function (page) {
        console.log("Google Scraper: Created Page");
        self.page = page;
    });
};

GoogleScraper.prototype.scrape = function (term) {
    var dfd = $q.defer();
    var self = this;

    this.page.load("http://google.com").then(function () {
        self.page.expectNavigation().then(function () {
            var result = "";
            self.page.evaluate(function () {
                console.log(document.getElementById("res").innerText);
                return true;
            }).then(function () {
                dfd.resolve(self._summarize(result));
            }, null, function (msg) {
                result += msg;
            });
        });

        self.page.evaluate(function (term) {
            var input = document.getElementsByName('q')[0];
            input.value = term;
            input.form.submit();
            return true;
        }, term);
    });

    return dfd.promise;
};

GoogleScraper.prototype._summarize = function (result) {
    var lines = result.split('\n');
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

module.exports = GoogleScraper;