var phantom = require('node-phantom-simple');
var $q = require('q');

var Scraper = function () {};

Scraper.prototype.search = function (term) {
    var dfd = $q.defer();

    var doSearch = function (page) {
        console.log('Searching...');
        page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js', function (err) {
            page.evaluate(function () {
                console.log('Searching...2');
                $("input[name=q]").val(term);
                $("form").trigger('submit');
                console.log('Searched!!');
                return true;
            }, function (result) {
            });
        });
        page.render('phantomjs-searching.png');
    };

    var displayResults = function (page) {
        var dfd = $q.defer();
        console.log('Results...');
        // unless the jQuery is included the second time, it'll cause an error on the $-jquery reference
        page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js', function (err) {
            page.evaluate(function () {
                var results = [];
                console.log("displayResults");
                $('h3 a').each(function (i) {
                    console.log("displayResults2");
                    console.log([i + 1, $(this).text(), ' // ' + $(this).attr('href')].join(': '));
                    results.push($(this).text());
                });
                dfd.resolve(results);
                return true;
            }, function (result) {
            });
        });
        page.render('phantomjs-results.png');
        return dfd.promise;
    };

    phantom.create(function (err, ph) {
        if (err) {
            dfd.reject(err);
        } else {
            ph.createPage(function (err, page) {
                if (err) {
                    dfd.reject(err);
                } else {
                    page.onLoadFinished = function (status) {
                        console.log("opened site? ", status);
                        if (status === 'success') {
                            console.log("-------");
                            if (!phantom.state) {
                                console.log("doSearch");
                                doSearch(page);
                                phantom.state = 'results';
                                console.log("Done");
                            } else {
                                displayResults(page).then(function (results) {
                                    dfd.resolve(results);
                                });
                                //ph.exit();
                            }
                        } else {
                            console.log('Connection failed.');
                            phantom.exit();
                        }
                    };

                    page.open("http://google.com");
                }
            });
        }
    });

    return dfd.promise;
};

module.exports = Scraper;