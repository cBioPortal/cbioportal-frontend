import { assert } from 'chai';
import {setDifference} from "./SetUtils";

describe("setDifference", ()=>{
    it("gives correct result on various inputs", ()=>{
        assert.deepEqual(setDifference({}, {}), {}, "empty");
        assert.deepEqual(setDifference({}, {a:true}), {}, "subtracting from empty");
        assert.deepEqual(setDifference({}, {a:true, b:true}), {}, "subtracting from empty");
        assert.deepEqual(setDifference({a:1}, {}), {a:1}, "subtracting by empty");
        assert.deepEqual(setDifference({a:true, b:3}, {}), {a:true, b:3}, "subtracting by empty");
        assert.deepEqual(setDifference({a:true}, {a:true}), {}, "subtracting to empty");
        assert.deepEqual(setDifference({a:true, b:true}, {a:true, b:true}), {}, "subtracting to empty");
        assert.deepEqual(setDifference({a:true, b:true}, {a:true, b:true, c:true}), {}, "subtracting to empty");
        assert.deepEqual(setDifference({a:true, b:true}, {a:true}), {b:true}, "subtracting to nonempty");
        assert.deepEqual(setDifference({a:true, b:true, c:true}, {a:true}), {b:true, c:true}, "subtracting to nonempty");
        assert.deepEqual(setDifference({a:{a:3}, b:true, c:true}, {c:true}), {a:{a:3}, b:true}, "subtracting to nonempty");
    });
});