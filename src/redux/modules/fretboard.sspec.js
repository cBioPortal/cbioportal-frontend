import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import * as Immutable from 'immutable'
import { default as fretboardReducer } from './fretboard'
import { default as buildFretboard } from '../lib/buildFretboard'

describe('<App />', () => {

    beforeEach(() => {

    });

    it("#buildFretboard builds fretboard and indexes notes",() => {
        const fretboard = buildFretboard();
        assert.equal(fretboard.get(0).get("notes").get(0).get("id"), 0);
        //assert.equal(fretboard[1].notes[0].id, 12);
    });

    it("a dummy action without state appropriate initial state", () => {
        let state = fretboardReducer.reducer(undefined, { type: "FOO"});
        assert.equal(state.get("strings").get(0).get("notes").get(0).get("id"), 0);
        assert.equal(state.get("strings").get(1).get("notes").get(0).get("id"), 13);
    });



});
