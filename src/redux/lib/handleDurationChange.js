import { default as buildChallenge } from '../lib/buildChallenge';
import { default as buildFretboard } from '../lib/buildFretboard';
import { List } from 'immutable';

const handleDurationChange = (state, action) => {

    if (action.confirmed === true)  {

        state = state.merge({
            currentModal: null,
            testDuration: action.newDuration,
            currentChallenge: buildChallenge(false),
            testHistory: List()
        });

    } else {
        state = state.merge({
            "currentModal" : "CHANGE_DURATION_CONFIRMATION",
            "pendingDurationChange" : action.newDuration
        });
    }

    return state;

}


export default handleDurationChange;