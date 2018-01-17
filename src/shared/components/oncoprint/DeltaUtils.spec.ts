import {assert} from "chai";
import {numTracksWhoseDataChanged} from "./DeltaUtils";

describe("Oncoprint DeltaUtils", ()=>{
    describe("numTracksWhoseDataChanged", ()=>{
        it("should return 0 for empty inputs", ()=>{
            assert.equal(numTracksWhoseDataChanged([], []), 0);
        });
        it("should return 2 for one empty input and one with two (both added/deleted)", ()=>{
            assert.equal(numTracksWhoseDataChanged([{key:"a", data:[]},{key:"b", data:[]}], []), 2, "tracks added");
            assert.equal(numTracksWhoseDataChanged([], [{key:"a", data:[]},{key:"b", data:[]}]), 2, "tracks deleted");
        });
        it("should return 3 for one track deleted, one track added, one track changed", ()=>{
            let state1 = [{key:"a", data:[]}, {key:"b", data:[]}];
            let state2 = [{key:"b", data:[1]}, {key:"c", data:[]}];
            assert.equal(numTracksWhoseDataChanged(state1, state2), 3, "test one direction");
            assert.equal(numTracksWhoseDataChanged(state2, state1), 3, "test other direction");
        });
        it("should return X for X tracks changed", ()=>{
            let state1 = [{key:"a", data:[1]}, {key:"b", data:[3,4]}, {key:"c", data:[6,1]}, {key:"d",data:[10]}];
            let state2 = [{key:"a", data:[]}, {key:"b", data:[33,3,4]}, {key:"c", data:[10,20]}, {key:"d",data:[-6,-3,1,0]}];
            for (let i=0; i<state1.length; i++) {
                assert.equal(numTracksWhoseDataChanged(state1.slice(i), state2.slice(i)), state1.length - i);
                assert.equal(numTracksWhoseDataChanged(state2.slice(i), state1.slice(i)), state1.length - i);
            }
        });
    });
});