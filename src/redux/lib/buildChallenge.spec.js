import { default as buildChallenge } from './buildChallenge'
import buildFretboard from './buildFretboard'
import { assert } from 'chai'

describe('buildChallenge', () => {

    let fretboard;

    beforeEach(() => {
       fretboard = buildFretboard();
    });

});
