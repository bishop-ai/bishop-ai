var $q = require('q');

var scraper = require('./../utils/scraper');

var WikipediaScraper = function () {
    this._scraper = scraper;
    var self = this;
    this._scraper.createPage().then(function (page) {
        console.log("Wikipedia Scraper: Created Page");
        self.page = page;
    });
};

WikipediaScraper.prototype.scrape = function (term) {
    var dfd = $q.defer();
    var self = this;

    this.page.load("http://google.com").then(function () {
        self.page.expectNavigation().then(function () {
            var url = "";
            self.page.evaluate(function () {
                var results = document.getElementById("res");
                var anchor = results.querySelector("cite");
                console.log(anchor.innerText);
                return true;
            }).then(function () {
                if (url) {
                    self.page.load(url).then(function () {
                        var result = "";
                        self.page.evaluate(function () {
                            var text = document.getElementById("mw-content-text");
                            var firstParagraph = text.querySelector("p");
                            console.log(firstParagraph.innerText);
                            return true;
                        }).then(function () {
                            dfd.resolve(result);
                        }, function (e) {
                            dfd.reject(e);
                        }, function (msg) {
                            result += msg;
                        });
                    }, function (e) {
                        dfd.reject(e);
                    });
                } else {
                    dfd.reject("Wikipedia Scraper: Error: Could not find link.");
                }
            }, function (e) {
                dfd.reject(e);
            }, function (href) {
                url = href;
            });
        }, function (e) {
            dfd.reject(e);
        });

        self.page.evaluate(function (term) {
            var input = document.getElementsByName('q')[0];
            input.value = "wikipedia simple: " + term;
            input.form.submit();
            return true;
        }, term).then(null, function (e) {
            dfd.reject(e);
        });

    }, function (e) {
        dfd.reject(e);
    });

    return dfd.promise;
};

module.exports = WikipediaScraper;