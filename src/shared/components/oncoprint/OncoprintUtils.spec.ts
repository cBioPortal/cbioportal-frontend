import {assert} from 'chai';
import {percentAltered} from "./OncoprintUtils";

describe('OncoprintUtils', ()=>{
    describe('percentAltered',()=>{
        it("returns the percentage with no decimal digits, for percentages >= 3", ()=>{
            assert.equal(percentAltered(3,100), "3%");
            assert.equal(percentAltered(20,100), "20%");
            assert.equal(percentAltered(3,3), "100%");
            assert.equal(percentAltered(50,99), "51%");
        })
        it("returns the percentage with one decimal digit, for percentages < 3, unless its exact", ()=>{
            assert.equal(percentAltered(22,1000), "2.2%");
            assert.equal(percentAltered(156,10000), "1.6%");
            assert.equal(percentAltered(0,3), "0%");
            assert.equal(percentAltered(2,100), "2%");
        })
    });
});