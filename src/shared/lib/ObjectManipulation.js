/* eslint-disable no-param-reassign */
/* Functions related to Object manipulation */
import { reduce } from 'underscore';

/*
 * Rename keys in flat dictionary. Keep old keys if not in keyMap.
 */
export function renameKeys(dict, keyMap) {
    return reduce(dict, (newDict, val, oldKey) => {
        const newKey = keyMap[oldKey];
        if (newKey) {
            newDict[newKey] = val;
        } else {
            newDict[oldKey] = val;
        }
        return newDict;
    }, {});
}

/*
 * Return new dict w/o given keys (only works on flat dicts)
 */
export function dropKeys(dict, keys) {
    return reduce(dict, (newDict, val, key) => {
        if (keys.indexOf(key) === -1) {
            newDict[key] = val;
        }
        return newDict;
    }, {});
}
