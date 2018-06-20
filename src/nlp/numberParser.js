var numberParser = {};

numberParser.parse = function (numbersInString) {
    numbersInString = numbersInString.toLowerCase().replace("-", " ");
    var ref = {
            a: 1,
            one: 1,
            two: 2,
            three: 3,
            four: 4,
            five: 5,
            six: 6,
            seven: 7,
            eight: 8,
            nine: 9,
            ten: 10,
            eleven: 11,
            twelve: 12,
            thirteen: 13,
            fourteen: 14,
            fifteen: 15,
            sixteen: 16,
            seventeen: 17,
            eighteen: 18,
            nineteen: 19,
            twenty: 20,
            thirty: 30,
            forty: 40,
            fifty: 50,
            sixty: 60,
            seventy: 70,
            eighty: 80,
            ninety: 90
        },
        mult = {hundred: 100, thousand: 1000, million: 1000000, billion: 1000000000, trillion: 1000000000000},
        strNums = numbersInString.split(' ').reverse(),
        number = 0,
        multiplier = 1;

    var i;
    for (i in strNums) {
        if (strNums.hasOwnProperty(i)) {
            if (mult[strNums[i]] !== undefined) {
                if (mult[strNums[i]] === 100) {
                    multiplier *= mult[strNums[i]];
                } else {
                    multiplier = mult[strNums[i]];
                }
            } else {
                if (!isNaN(parseFloat(strNums[i]))) {
                    number += parseFloat(strNums[i]) * multiplier;
                } else {
                    var nums = strNums[i].split('-');
                    number += ((ref[nums[0]] || 0) + (ref[nums[1]] || 0)) * multiplier;
                }
            }
        }
    }
    return number;
};

module.exports = numberParser;