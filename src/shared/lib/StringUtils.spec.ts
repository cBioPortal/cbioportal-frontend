import { assert } from 'chai';
import {longestCommonStartingSubstring} from "./StringUtils";

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