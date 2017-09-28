var fs = require('fs');

var cache = {
    cacheUrl: '/cache/',
    cacheDir: './cache/'
};

cache.init = function () {
    if (!fs.existsSync(this.cacheDir)){
        fs.mkdirSync(this.cacheDir);
    }
};

cache.write = function (file, obj) {
    if (file && obj) {
        var data = JSON.stringify(obj, null, "  ");

        try {
            fs.writeFileSync(this.cacheDir + file, data);
        } catch (err) {
            console.log('JSON Write Error: ' + err);
        }
    }
};

cache.read = function (file) {
    var obj = {};

    if (fs.existsSync(this.cacheDir + file)) {
        try {
            var data = fs.readFileSync(this.cacheDir + file);
            obj = JSON.parse(data);
        } catch (err) {
            console.log('JSON Read Error: ' + err);
        }
    }

    return obj;
};

cache.init();

module.exports = cache;