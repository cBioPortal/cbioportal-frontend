import { assert } from 'chai';
import {longestCommonStartingSubstring, stringListToSet} from "./StringUtils";

describe("longestCommonStartingSubstring", ()=>{
    it("finds correct result on various inputs", ()=>{
        assert.equal(longestCommonStartingSubstring("",""),"");
        assert.equal(longestCommonStartingSubstring("","a"),"");
        assert.equal(longestCommonStartingSubstring("a","a"),"a");
        assert.equal(longestCommonStartingSubstring("ab","a"),"a");
        assert.equal(longestCommonStartingSubstring("a","ab"),"a");
        assert.equal(longestCommonStartingSubstring("hellothere","hellobye"),"hello");
        assert.equal(longestCommonStartingSubstring("hellobye","hellothere"),"hello");
    });
});

describe("stringListToSet", ()=>{
    it("gives correct result on various inputs", ()=>{
        assert.deepEqual(stringListToSet([]), {}, "empty list");
        assert.deepEqual(stringListToSet(["a"]), {"a":true}, "one element");
        assert.deepEqual(stringListToSet(["a","b"]), {"a":true, "b":true}, "two elements");
        assert.deepEqual(stringListToSet(["a","b", "C", "d", "E", "FG"]), {"a":true, "b":true, "C":true, "d":true, "E":true, "FG":true}, "several elements");
    });
});