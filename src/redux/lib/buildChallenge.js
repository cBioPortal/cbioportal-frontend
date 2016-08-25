import { default as Immutable } from 'immutable';
import getRandomNote from '../lib/getRandomNote';
import getRandomString from '../lib/getRandomString';

export default (started = false) => {

    let challenge = {
        id: Date.now(),
        currentNote: getRandomNote(),
        activeStringIndex: getRandomString(),
        complete: false,
        started:false,
        correct: [],
        error: [],
        started,
        incorrectNoteSelected: false
    };

    return Immutable.fromJS(challenge);
};