/**
 * A predicate is used for the $filter operator in a query. Predicates can be joined to query
 * using a group of filters with the 'and' operator.
 *
 * This is a helper class for the PreparedQueryOptions class to assist in building complex
 * filter clauses.
 *
 * @class Predicate
 * @constructor
 * @param {String} [property] The property to filter by.
 * @param {Function} [parser] A function that returns the predicate string.
 */
var Predicate = function (property, parser) {
    this.property = property;
    this.parser = parser;
    return this;
};

/**
 * Takes a predicate's value and if it is a string, adds single quotes around it.
 *
 * @method escapeValue
 * @param {String|Boolean|Number} value
 * @returns {string} The string value
 */
var escapeValue = function (value) {
    return (typeof value === 'string') ? "'" + value + "'" : value.toString();
};

/**
 * Joins a provided set of predicates using the group operator and returns a new Predicate
 *
 * @method join
 * @param {Predicate[]} predicates Array of predicates to join.
 * @param {String} [groupOperator] The operator for the filter set ('and' 'or').
 * @return {Predicate} Predicate object.
 */
Predicate.join = function (predicates, groupOperator) {
    if (predicates instanceof Array && predicates.length > 0) {
        return new Predicate().join(predicates, groupOperator);
    }
    return null;
};

/**
 * Sets the predicate's property
 *
 * @method setProperty
 * @param {String} property
 * @return {Predicate} Predicate object.
 */
Predicate.prototype.setProperty = function (property) {
    this.property = property;
    return this;
};

/**
 * Modifies an existing predicate setting the operator to 'eq' and the value to the input parameter
 *
 * @method equals
 * @param {String|Number|Boolean} (value) The value to match.
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.equals = function (value) {
    this.parser = function () {
        return this.property + ' = ' + escapeValue(value);
    };
    return this;
};

/**
 * Modifies an existing predicate setting the operator to 'ne' and the value to the input parameter
 *
 * @method notEqualTo
 * @param {String|Number|Boolean} (value) The value to match.
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.notEqualTo = function (value) {
    this.parser = function () {
        return 'NOT ' + this.property + ' = ' +  escapeValue(value);
    };
    return this;
};

/**
 * Modifies an existing predicate setting the operator to 'gt' and the value to the input parameter
 *
 * @method greaterThan
 * @param {String|Number|Boolean} (value) The value to match.
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.greaterThan = function (value) {
    this.parser = function () {
        return this.property + ' > ' +  escapeValue(value);
    };
    return this;
};

/**
 * Modifies an existing predicate setting the operator to 'ge' and the value to the input parameter
 *
 * @method greaterThanOrEqualTo
 * @param {String|Number|Boolean} (value) The value to match.
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.greaterThanOrEqualTo = function (value) {
    this.parser = function () {
        return this.property + ' >= ' +  escapeValue(value);
    };
    return this;
};

/**
 * Modifies an existing predicate setting the operator to 'lt' and the value to the input parameter
 *
 * @method lessThan
 * @param {String|Number|Boolean} (value) The value to match.
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.lessThan = function (value) {
    this.parser = function () {
        return this.property + ' < ' +  escapeValue(value);
    };
    return this;
};

/**
 * Modifies an existing predicate setting the operator to 'le' and the value to the input parameter
 *
 * @method lessThanOrEqualTo
 * @param {String|Number|Boolean} (value) The value to match.
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.lessThanOrEqualTo = function (value) {
    this.parser = function () {
        return this.property + ' <= ' +  escapeValue(value);
    };
    return this;
};

/**
 * Modifies an existing predicate setting the operation to substringof and the value to the input parameter
 *
 * @method contains
 * @param {String|Number|Boolean} (value) The value to match.
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.contains = function (value) {
    this.parser = function () {
        return this.property + ' CONTAINS ' +  escapeValue(value);
    };
    return this;
};

/**
 * Modifies an existing predicate setting the operation to startswith and the value to the input parameter
 *
 * @method startsWith
 * @param {String|Number|Boolean} (value) The value to match.
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.startsWith = function (value) {
    this.parser = function () {
        return this.property + ' STARTS WITH ' +  escapeValue(value);
    };
    return this;
};

/**
 * Modifies an existing predicate setting the operation to endswith and the value to the input parameter
 *
 * @method startsWith
 * @param {String|Number|Boolean} (value) The value to match.
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.endsWith = function (value) {
    this.parser = function () {
        return this.property + ' ENDS WITH ' +  escapeValue(value);
    };
    return this;
};

/**
 * Joins an existing predicate with additional predicates using the group operator
 *
 * @method join
 * @param {Predicate|Predicate[]} predicates A single predicate or an array of predicates to join to the existing one.
 * @param {String} [groupOperator] The operator for the filter set ('and' 'or').
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.join = function (predicates, groupOperator) {
    var initialPredicate;

    if (this.property && typeof this.parser === 'function') {
        initialPredicate = new Predicate(this.property, this.parser);
    }

    var newPredicates = [];
    if (predicates instanceof Predicate) {
        newPredicates.push(predicates);
    } else if (predicates instanceof Array && predicates.length > 0) {
        var i;
        for (i = 0; i < predicates.length; i++) {
            if (predicates[i]) {
                newPredicates.push(predicates[i]);
            }
        }
    }

    if (newPredicates.length > 0) {
        delete this.parser;
        delete this.property;

        this.joinedPredicates = (this.joinedPredicates) ? this.joinedPredicates.concat(newPredicates) : newPredicates;
        if (groupOperator || !this.groupOperator) {
            this.groupOperator = (groupOperator === 'or') ? 'or' : 'and';
        }
        if (initialPredicate) {
            this.joinedPredicates.unshift(initialPredicate);
        }
    }

    return this;
};

/**
 * Joins an existing predicate with additional predicates using the 'and' group operator
 *
 * @method and
 * @param {Predicate|Predicate[]} predicates A single predicate or an array of predicates to join to the existing one.
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.and = function (predicates) {
    return this.join(predicates, 'and');
};

/**
 * Joins an existing predicate with additional predicates using the 'or' group operator
 *
 * @method or
 * @param {Predicate|Predicate[]} predicates A single predicate or an array of predicates to join to the existing one.
 * @return {Predicate} Used for chaining function calls
 */
Predicate.prototype.or = function (predicates) {
    return this.join(predicates, 'or');
};

/**
 * Builds and returns a URL parameter string based on the predicate.
 *
 * @method parsePredicate
 * @param {Boolean} [nested = false] Used for building the nested group during recursion
 * @returns {String}
 */
Predicate.prototype.parsePredicate = function (nested) {
    nested = (nested === true);
    var result = '';

    if (this.property && typeof this.parser === 'function') {
        return this.parser();
    }

    if (this.joinedPredicates && this.joinedPredicates.length > 0) {
        var i;
        var predicate;
        var predicateString;
        for (i = 0; i < this.joinedPredicates.length; i++) {
            predicate = this.joinedPredicates[i];
            predicateString = predicate.parsePredicate(true);
            result += (i > 0) ? ' ' + this.groupOperator.toUpperCase() + ' ' + predicateString : predicateString;
        }
    }

    return nested ? '(' + result + ')' : result;
};

module.exports = Predicate;