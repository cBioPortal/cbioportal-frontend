var assert = require('assert');

module.exports = {

    assertScreenShotMatch(result, message){
        //console.log(result);
        assert(result[0].isWithinMisMatchTolerance, message);
    }

};