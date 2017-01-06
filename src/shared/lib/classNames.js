// Type definitions for classnames
// Project: https://github.com/JedWatson/classnames
// Definitions by: Dave Keen <http://www.keendevelopment.ch>, Adi Dahiya <https://github.com/adidahiya>, Jason Killian <https://github.com/JKillian>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
"use strict";
/*!
  Copyright (c) 2016 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
var hasOwn = {}.hasOwnProperty;
function classNames() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var classes = [];
    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        if (!arg)
            continue;
        if (typeof arg === 'string' || typeof arg === 'number') {
            classes.push(arg);
        }
        else if (Array.isArray(arg)) {
            classes.push(classNames.apply(null, arg));
        }
        else if (typeof arg === 'object') {
            for (var key in arg) {
                if (hasOwn.call(arg, key) && arg[key]) {
                    classes.push(key);
                }
            }
        }
    }
    return classes.join(' ');
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = classNames;
