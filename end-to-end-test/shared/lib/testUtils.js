var assert = require('assert');

module.exports = {
    assertScreenShotMatch(result, message) {
        if (result[0].referenceExists === false) {
            assert.fail('Missing reference screenshot');
        } else {
            assert(result[0].isWithinMisMatchTolerance, message);
        }
    },
};
