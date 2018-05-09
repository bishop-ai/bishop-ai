(function () {

    if (BISHOP_AI._init) {
        var i;
        for (i = 0; i < BISHOP_AI._init.length; i++) {
            BISHOP_AI._init[i]();
        }
    }

    /*globals module, define*/
    if (typeof module !== 'undefined' && module.exports) {

        // Expose this class for node.js
        module.exports = BISHOP_AI;

    } else if (typeof define === 'function' && define.amd) {

        // Expose this class for requireJS
        define(function () {
            return BISHOP_AI;
        });

    } else {

        // Expose this class as a global variable
        this.BISHOP_AI = BISHOP_AI;
    }
}).call(this);