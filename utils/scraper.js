var phantom = require('node-phantom-simple');
var $q = require('q');

var scraper = {
    ph: null,
    initPromise: null
};

var noop = function () {
    return null;
};

scraper.createPage = function () {
    var dfd = $q.defer();
    var self = this;

    this.initPromise.then(function () {
        self.ph.createPage(function (err, page) {
            if (err) {
                console.log("Scraper: Error: " + err);
                dfd.reject(err);
            } else {
                dfd.resolve(new scraper.Page(page));
            }
        });
    });

    return dfd.promise;
};

scraper.Page = function (page) {
    this._page = page;
};

scraper.Page.prototype.load = function (url) {
    var dfd = $q.defer();

    this._page.onError = function (err) {
        console.log("Scraper: Error: " + err);
        dfd.reject(err);
    };

    this.expectNavigation().then(function () {
        dfd.resolve();
    }, function (e) {
        dfd.reject(e);
    });

    this._page.open(url);

    return dfd.promise;
};

scraper.Page.prototype.evaluate = function (func, args) {
    var dfd = $q.defer();

    this._page.onError = function (err) {
        console.log("Scraper: Error: " + err);
        dfd.reject(err);
    };

    this._page.onConsoleMessage = function (msg) {
        dfd.notify(msg);
    };

    args = [].splice.call(arguments, 0);
    args.push(function (result) {
        dfd.resolve(result);
    });

    this._page.evaluate.apply(this, args);

    return dfd.promise;
};

scraper.Page.prototype.expectNavigation = function () {
    var dfd = $q.defer();
    var self = this;

    this._page.onError = function (err) {
        console.log("Scraper: Error: " + err);
        dfd.reject(err);
    };

    this._page.onLoadFinished = function (status) {
        self._page.onLoadFinished = noop;
        if (status === 'success') {
            dfd.resolve();
        } else {
            dfd.reject("Scraper Page Load: Error: Connection failed.");
        }
    };

    return dfd.promise;
};

scraper._init = function () {
    var dfd = $q.defer();
    var self = this;
    phantom.create(function (err, ph) {
        if (err) {
            console.log("Scraper: Error: " + err);
            dfd.reject();
        } else {
            console.log("Scraper: Initialized");
            self.ph = ph;
            dfd.resolve();
        }
    });

    this.initPromise = dfd.promise;
};

scraper._init();

module.exports = scraper;