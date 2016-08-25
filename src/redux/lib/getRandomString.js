import { List } from 'immutable';

export default (currentString = null) => {

    let strings = List([0,2,3,4,5]);

    if (currentString) {
        strings = strings.remove(currentString);
    }

    return strings.get(Math.floor(Math.random() * ((4-1) - 0 + 1)) + 0);


};