import { default as Immutable, Map, List } from 'immutable';
import { default as _ } from 'lodash';
import { default as makeActionCreator } from '../lib/makeActionCreator';
import { default as buildChallenge } from '../lib/buildChallenge';
import { default as buildFretboard } from '../lib/buildFretboard';
import { default as handleSelection } from '../lib/handleSelection';
import completeTest from '../lib/completeTest';
import handleDurationChange from '../lib/handleDurationChange';

const SELECT_NOTE = 'SELECT_NOTE';

export const initialState = Immutable.fromJS({strings: buildFretboard(), testDuration:30, testHistory:[], currentChallenge: buildChallenge(), errorLog: []});

const actionTypes = {
    SELECT_NOTE: 'SELECT_NOTE',
    NEW_CHALLENGE: 'NEW_CHALLENGE',
    SELECTION_ATTEMPT: 'SELECTION_ATTEMPT',
    TEST_COMPLETE: 'TEST_COMPLETE',
    NEW_TEST: 'NEW_TEST',
    CHANGE_TEST_DURATION:'CHANGE_TEST_DURATION',
    CANCEL_CURRENT_MODAL:'CANCEL_CURRENT_MODAL'
};

export const actionCreators = {
    selectNote: makeActionCreator(actionTypes.SELECT_NOTE, 'id'),
    newChallenge: makeActionCreator(actionTypes.NEW_CHALLENGE, 'note'),
    selectionAttempt: makeActionCreator(actionTypes.SELECTION_ATTEMPT, 'noteObj'),
    testComplete: makeActionCreator(actionTypes.TEST_COMPLETE),
    newTest: makeActionCreator(actionTypes.NEW_TEST, 'started'),
    changeTestDuration: makeActionCreator(actionTypes.CHANGE_TEST_DURATION, 'newDuration', 'confirmed'),
    cancelCurrentModal: makeActionCreator(actionTypes.CANCEL_CURRENT_MODAL, 'newDuration', 'confirmed')
};

export default {

    reducer: (state = initialState, action) => {

        switch (action.type) {

            case actionTypes.SELECTION_ATTEMPT:

                state = handleSelection(state, action.noteObj);

                return state;

            case actionTypes.TEST_COMPLETE:

                return completeTest(state);

            case actionTypes.NEW_TEST:

                state = state.set('currentChallenge', buildChallenge(action.started));

                // push a new test into history
                state = state.updateIn(['testHistory'], (testHistory) => {
                    let historyItem = {
                        correct: [],
                        error: []
                    };

                    return testHistory.push(Immutable.fromJS(historyItem));
                });

                return state;

            case actionTypes.CHANGE_TEST_DURATION:

                return handleDurationChange(state, action);

            case actionTypes.CANCEL_CURRENT_MODAL:

                 return state.set("currentModal", null);

            default:

                return state;

        }
    },

    actions: actionCreators

}

// dummy comment


