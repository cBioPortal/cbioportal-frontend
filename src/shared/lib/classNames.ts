// Type definitions for classnames
// Project: https://github.com/JedWatson/classnames
// Definitions by: Dave Keen <http://www.keendevelopment.ch>, Adi Dahiya <https://github.com/adidahiya>, Jason Killian <https://github.com/JKillian>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare type ClassValue = string | number | ClassDictionary | ClassArray | undefined | null;

interface ClassDictionary {
    [id: string]: boolean;
}

interface ClassArray extends Array<ClassValue> { }

/*!
  Copyright (c) 2016 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
var hasOwn = {}.hasOwnProperty;
export default function classNames (...args:ClassValue[]) {
    var classes:any[] = [];

    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        if (!arg) continue;

        if (typeof arg === 'string' || typeof arg === 'number') {
            classes.push(arg);
        } else if (Array.isArray(arg)) {
            classes.push(classNames.apply(null, arg));
        } else if (typeof arg === 'object') {
            for (var key in arg) {
                if (hasOwn.call(arg, key) && arg[key]) {
                    classes.push(key);
                }
            }
        }
    }

    return classes.join(' ');
}
