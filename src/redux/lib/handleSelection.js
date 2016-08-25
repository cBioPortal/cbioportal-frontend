import { List, Map } from 'immutable'
import getRandomNote from './getRandomNote'
import getRandomString from './getRandomString'

export default (state, noteObj) => {

    let newState;

    if (state.getIn(['currentChallenge','complete']) === true) {
        return state;
    } else {

        // we need to know what the active string index was at time of selection
        noteObj = noteObj.set("activeStringIndex", state.getIn(['currentChallenge', 'activeStringIndex']));

        if (state.getIn(['currentChallenge', 'currentNote']) === noteObj.get('note')) {

            //correct selection!

            newState = state.updateIn(['currentChallenge', 'correct'],
                    list => list.push( Map({ note: state.getIn(['currentChallenge','currentNote']) } ) )
            );

            newState = newState.setIn(['currentChallenge', 'activeStringIndex'],
                getRandomString(state.getIn(['currentChallenge','activeStringIndex'])));

            newState = newState.setIn(['currentChallenge', 'currentNote'], getRandomNote());

            newState = newState.updateIn(['testHistory'], (testHistory) => {

                let historyItem = Map({
                    correct: newState.getIn(['currentChallenge', 'correct']),
                    error: newState.getIn(['currentChallenge', 'error'])
                });

                testHistory = testHistory.pop();
                return testHistory.push(historyItem);

            });

        } else {

            //newState = state.updateIn(['currentChallenge', 'error'],
            //        list => list.push(noteObj)
            //);

            newState = state.updateIn(['currentChallenge', 'error'],
                    list => list.push( Map({ note: state.getIn(['currentChallenge','currentNote']) } ) )
            );

            newState = newState.updateIn(['testHistory'], (testHistory) => {

                let historyItem = Map({
                    correct: newState.getIn(['currentChallenge', 'correct']),
                    error: newState.getIn(['currentChallenge', 'error'])
                });

                testHistory = testHistory.pop();
                return testHistory.push(historyItem);

            });

        }

        return newState;

    }

}