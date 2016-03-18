var uuid = {};

/**
 * Generates an rfc4122 version 4 compliant uuid: http://stackoverflow.com/a/2117523
 * These IDs should not be used as a storage keys on the server. They should only be used
 * to track client side objects that have not yet been saved to the server. Once the
 * objects are saved, the client side object should be updated with the server generated ID.
 *
 * @returns {string} The generated UUID
 */
uuid.generate = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

module.exports = uuid;