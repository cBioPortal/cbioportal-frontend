import { assert } from 'chai';
import {toFixedWithThreshold} from "./FormatUtils";

describe('toFixedWithThreshold', ()=>{
    it("has the same behavior with regular toFixed function when the result is not expected to be a zero value", () => {
        assert.equal(toFixedWithThreshold(0.324, 2), "0.32");
        assert.equal(toFixedWithThreshold(0.0032, 3), "0.003");
        assert.equal(toFixedWithThreshold(0.006, 2), "0.01");
    });

    it("returns zero value string only if the actual value is zero", () => {
        assert.equal(toFixedWithThreshold(0, 1), "0.0");
        assert.equal(toFixedWithThreshold(0, 2), "0.00");
        assert.equal(toFixedWithThreshold(0, 3), "0.000");
    });

    it("converts zero value results into an inequality if the actual value is not zero", () => {
        assert.equal(toFixedWithThreshold(0.000333, 3), "<0.001");
        assert.equal(toFixedWithThreshold(0.000666, 2), "<0.01");
        assert.equal(toFixedWithThreshold(0.00666, 1), "<0.1");
        assert.equal(toFixedWithThreshold(0.0333, 1), "<0.1");
    });

    it("works for negative numbers too", () => {
        assert.equal(toFixedWithThreshold(-0.324, 2), "-0.32");
        assert.equal(toFixedWithThreshold(-0.0032, 3), "-0.003");
        assert.equal(toFixedWithThreshold(-0.006, 2), "-0.01");
        assert.equal(toFixedWithThreshold(-0.000333, 3), ">-0.001");
        assert.equal(toFixedWithThreshold(-0.000666, 2), ">-0.01");
        assert.equal(toFixedWithThreshold(-0.00666, 1), ">-0.1");
        assert.equal(toFixedWithThreshold(-0.0333, 1), ">-0.1");
    });
});