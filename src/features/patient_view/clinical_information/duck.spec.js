import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { default as reducer, actionTypes } from './duck';

describe('clinical_information duck', () => {
    let initialState;

    beforeEach(() => {
        initialState = reducer(undefined, { type: null });
    });

    it('by default reducer returns unmodified state', () => {
        const nextState = reducer(initialState, { type: null });

        assert.equal(initialState, nextState);
    });

    it('fetching action sets status to fetching', () => {
        const action = {
            type: actionTypes.FETCH,
            status: 'fetching',
        };

        const nextState = reducer(initialState, action);

        assert.equal(nextState.get('status'), 'fetching');
    });

    it('fetching complete sets status to success and sets payload', () => {
        const action = {
            type: actionTypes.FETCH,
            status: 'success',
            payload: { patient: [1, 2, 3], samples: [4, 5, 6] },
        };

        const nextState = reducer(initialState, action);

        assert.equal(nextState.get('status'), 'complete');
    });
});
