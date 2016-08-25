import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';
import buildChallenge from '../../../redux/lib/buildChallenge';
import { initialState } from 'reducers/fretboard';

import FretboardTester from './fretboardTester';
import FretboardChallenge from './fretboardChallenge';

describe('<FretboardTester />', () => {
    let wrapper, getStoreStateStubFretboardTester, getStoreStateStubFretboardChallenge, store;

    beforeEach(() => {

        store = Immutable.Map({ 'noteSelection' : initialState });

        getStoreStateStubFretboardTester = sinon.stub(FretboardTester.prototype,'getStoreState',()=>store);

        getStoreStateStubFretboardChallenge = sinon.stub(FretboardChallenge.prototype,'getStoreState',()=>store);

    });

    it("When currentModal property of store is set to CHANGE_DURATION_CONFIRMATION, a modal is rendered",()=>{

        store = store.setIn(['noteSelection','currentModal'],null);
        wrapper = mount(<FretboardTester  />);

        assert.equal(wrapper.find('.modal-changeTestDuration').length,0);

        store = store.setIn(['noteSelection','currentModal'],'CHANGE_DURATION_CONFIRMATION');
        wrapper = mount(<FretboardTester  />);

        assert.equal(wrapper.find('.modal-changeTestDuration').length,1);

    });

    afterEach(() => {
        getStoreStateStubFretboardTester.restore();
        getStoreStateStubFretboardChallenge.restore();
    });

});
