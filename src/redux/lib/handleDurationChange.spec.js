import handleDurationChange from './handleDurationChange';
import Immutable from 'immutable';
import { actionCreators } from 'reducers/fretboard';


describe("handleDurationChange", function(){

    it("if unconfirmed, updates currentModal to confirmation and makes memo of pendingDurationChange", () => {

        let state = Immutable.fromJS({
           currentModal:null
        });

        let newState = handleDurationChange(state, actionCreators.changeTestDuration(100, false) );

        assert.equal(newState.get('currentModal'),'CHANGE_DURATION_CONFIRMATION');

        assert.equal(newState.get('pendingDurationChange'),100);

    });

    it("if confirmed, changes test duration and, refreshes history and builds new challenge", () => {

        let state = Immutable.Map({
            currentModal: "CHANGE_DURATION_CONFIRMATION",
            testDuration: 100,
            currentChallenge: null,
            testHistory: Immutable.List([1,2,3])
        });

        let newState = handleDurationChange(state, actionCreators.changeTestDuration(200, true) );

        assert.equal( newState.get('currentModal'), null );
        assert.equal( newState.get('testDuration'), 200 );
        assert.notEqual( newState.get('currentChallenge'), null );
        assert.equal( newState.get('testHistory').size, 0 );


    });

});