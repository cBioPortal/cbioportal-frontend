var assert = require('assert');

module.exports = {

    assertScreenShotMatch(result, message){
        assert(result[0].isWithinMisMatchTolerance);
    }

};