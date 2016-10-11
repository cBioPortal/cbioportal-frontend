const utils = {
    'timeoutSeparatedLoop': function (array, loopFn) {
        // loopFn is function(elt, index, array) {
        var finished_promise = new $.Deferred();
        var loopBlock = function (i) {
            if (i >= array.length) {
                finished_promise.resolve();
                return;
            }

            loopFn(array[i], i, array);
            setTimeout(function () {
                loopBlock(i + 1);
            }, 0);
        };
        loopBlock(0);
        return finished_promise.promise();
    },
    'sign': function (x) {
        if (x > 0) {
            return 1;
        } else if (x < 0) {
            return -1;
        } else {
            return 0;
        }
    },
    'sign_of_diff': function(a,b) {
        if (a < b) {
            return -1;
        } else if (a === b) {
            return 0;
        } else if (a > b) {
            return 1;
        }
    },
    'invertArray': function (arr) {
        var ret = {};
        for (var i = 0; i < arr.length; i++) {
            ret[arr[i]] = i;
        }
        return ret;
    },
    'makeSVGElement': function (tag, attrs) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (var k in attrs) {
            if (attrs.hasOwnProperty(k)) {
                el.setAttribute(k, attrs[k]);
            }
        }
        return el;
    },
    'objectValues': function(obj) {
        return Object.keys(obj).map(function(k) { return obj[k]; });
    },
    'proportionToPercentString': function(p) {
        var percent = 100*p;
        if (p < 0.03) {
            // if less than 3%, use one decimal figure
            percent = Math.round(10*percent)/10;
        } else {
            percent = Math.round(percent);
        }
        return percent+'%';
    }
};

export default utils;