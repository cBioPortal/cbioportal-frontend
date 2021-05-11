var assert = require('assert');

module.exports = {
    assertScreenShotMatch(result, message) {
        if (result[0].referenceExists === false) {
            assert.fail('Missing reference screenshot');
        } else {
            console.log(
                'failed screenshot test with mismatch (of 100): ' +
                    result[0].misMatchPercentage
            );
            assert(result[0].isWithinMisMatchTolerance, message);
        }
    },
};
