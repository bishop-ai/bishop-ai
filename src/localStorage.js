/**
 * The localStorage utility helps manage the storage and retrieval of registered application data.
 */
var storage = {
    localStorage: (typeof window !== "undefined") ? window.localStorage : null,
    cookie: (typeof document !== "undefined") ? document.cookie : null,
    memoryStorage: {},
    keys: {
        TOKEN: 'TOKEN',
        MEMORY: 'MEMORY'
    }
};

/**
 * Checks if the key is registered with the class.
 *
 * @param {String} key
 * @returns {Boolean} True if the key exists
 */
var keyExists = function (key) {
    return !!storage.keys[key];
};

/**
 * Appends a modifier to a key
 * @param {String} key
 * @param {String} [modifier]
 * @returns {String} The key with the modifier appended.
 */
var addKeyModifier = function (key, modifier) {
    if (modifier) {
        key += "_" + modifier;
    }
    return key;
};

/**
 * Stores data by key in local browser storage.
 *
 * @param {String} key The key to use as the local storage name. Must be a key found in localStorage.keys.
 * @param {String} value The string value to store.
 * @param {String} [keyModifier] An additional identifier on the key.
 */
storage.set = function (key, value, keyModifier) {
    if (keyExists(key)) {
        key = addKeyModifier(key, keyModifier);
        if (storage.supportsLocalStorage()) {
            storage.localStorage.setItem(key, value);
        } else if (storage.supportsCookies()) {
            var life = 60 * 60 * 24 * 5;
            var v = encodeURIComponent(value);
            storage.cookie = key + '=' + v + '; max-age=' + life + ';';
        } else {
            storage.memoryStorage[key] = value;
        }
    }
};

/**
 * Retrieves stored data by key.
 *
 * @param {String} key The key of the data to retrieve. Must be a key found in localStorage.keys.
 * @param {String} [keyModifier] An additional identifier on the key.
 * @return {String} The string value stored.
 */
storage.get = function (key, keyModifier) {
    var value = "";

    if (keyExists(key)) {
        key = addKeyModifier(key, keyModifier);
        if (storage.supportsLocalStorage()) {
            value = storage.localStorage.getItem(key) || "";
        } else if (storage.supportsCookies()) {
            var regexp = new RegExp(key + "=([^;]+)", "g");
            var c = regexp.exec(storage.cookie);

            if (c) {
                value = decodeURIComponent(c[1]);
            }
        } else {
            value = storage.memoryStorage[key] || "";
        }
    }

    return value;
};

/**
 * Removes stored data by key.
 *
 * @param {String} key The key of the data to remove. Must be a key found in localStorage.keys.
 * @param {String} [keyModifier] An additional identifier on the key.
 */
storage.remove = function (key, keyModifier) {
    if (keyExists(key)) {
        key = addKeyModifier(key, keyModifier);
        if (storage.supportsLocalStorage()) {
            storage.localStorage.removeItem(key);
        } else if (storage.supportsCookies()) {
            storage.cookie = key + '=; max-age=0;';
        } else {
            delete storage.memoryStorage[key];
        }
    }
};

/**
 * Checks if the platform supports html5 local storage.
 */
storage.supportsLocalStorage = function () {
    try {
        return window && 'localStorage' in window && window.localStorage !== null;
    } catch (e) {
        return false;
    }
};

/**
 * Checks if the platform supports cookies.
 */
storage.supportsCookies = function () {
    try {
        return document && 'cookie' in document;
    } catch (e) {
        return false;
    }
};

module.exports = storage;