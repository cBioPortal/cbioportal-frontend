import {assert} from "chai";
import {logicalAnd, logicalOr} from "./LogicUtils";

describe("LogicUtils", ()=>{
    describe("logicalAnd", ()=>{
        it("returns correct output on several inputs", ()=>{
            assert.isTrue(logicalAnd([]), "empty input");
            assert.isTrue(logicalAnd(true), "true input");
            assert.isTrue(logicalAnd(true, true), "true two args");
            assert.isTrue(logicalAnd([true, true]), "true one list arg");
            assert.isTrue(logicalAnd(true, true, true, true, true), "five args");
            assert.isFalse(logicalAnd(true, false, false), "false args");
        });
    });
    describe("logicalOr", ()=>{
        it("returns correct output on several inputs", ()=>{
            assert.isFalse(logicalOr([]), "empty input");
            assert.isTrue(logicalOr(true), "true input");
            assert.isTrue(logicalOr(true, true), "true two args");
            assert.isTrue(logicalOr([true, true]), "true one list arg");
            assert.isTrue(logicalOr(true, true, true, true, true), "five args");
            assert.isTrue(logicalOr(true, false, false), "true and false args");
            assert.isFalse(logicalOr(false, false, false), "only false args");
            assert.isFalse(logicalOr([false, false, false]), "false one list arg");
        });
    });
});