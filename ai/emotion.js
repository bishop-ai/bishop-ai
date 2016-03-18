/**
 * Emotion represents a set of numeric ranges. Emotions are used to recall and process expressions.
 */
function Emotion(sh, ap, ab, da, ba, sr) {
    if (arguments.length === 1 && typeof sh === 'string') {
        this.setState(sh);
    } else {
        this._sad_happy = parseInt(sh || 0, 10);
        this._angry_peaceful = parseInt(ap || 0, 10);
        this._afraid_brave = parseInt(ab || 0, 10);
        this._disgusted_attracted = parseInt(da || 0, 10);
        this._bored_amused = parseInt(ba || 0, 10);
        this._sarcastic_respectful = parseInt(sr || 0, 10);
    }
}

Emotion.prototype.getState = function () {
    return [
        this._sad_happy,
        this._angry_peaceful,
        this._afraid_brave,
        this._disgusted_attracted,
        this._bored_amused,
        this._sarcastic_respectful
    ].join(':');
};

Emotion.prototype.setState = function (state) {
    var states = [];

    if (typeof state === 'string') {
        states = state.split(':');
    } else if (state instanceof Array) {
        states = state;
    }

    this._sad_happy = parseInt(states[0] || '0', 10);
    this._angry_peaceful = parseInt(states[1] || '0', 10);
    this._afraid_brave = parseInt(states[2] || '0', 10);
    this._disgusted_attracted = parseInt(states[3] || '0', 10);
    this._bored_amused = parseInt(states[4] || '0', 10);
    this._sarcastic_respectful = parseInt(states[5] || '0', 10);
};

/**
 * Calculate the distance between two emotional states
 * @param e1
 * @param e2
 */
Emotion.distance = function (e1, e2) {
    var score = 0;

    if (typeof e1.getState === 'function') {
        e1 = e1.getState();
    }
    if (typeof e2.getState === 'function') {
        e2 = e2.getState();
    }

    e1 = e1.split(':');
    e2 = e2.split(':');

    var i;
    for (i = 0; i < e1.length; i++) {
        score += Math.abs(e1[i] - e2[i]);
    }

    return score;
};

module.exports = Emotion;