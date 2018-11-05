import * as React from 'react';
import { assert } from 'chai';
import {toFixedWithThreshold, formatLogOddsRatio, formatSignificanceValueWithStyle, roundLogRatio } from "shared/lib/FormatUtils";
import expect from 'expect';

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

describe("#formatLogOddsRatio()", () => {
    it("returns <-10 for -11", () => {
        assert.equal(formatLogOddsRatio(-11), "<-10");
    });

    it("returns >10 for 11", () => {
        assert.equal(formatLogOddsRatio(11), ">10");
    });

    it("returns 10 for 10", () => {
        assert.equal(formatLogOddsRatio(10), "10.00");
    });

    it("returns 1.23 for 1.234", () => {
        assert.equal(formatLogOddsRatio(1.234), "1.23");
    });
});

describe("#formatSignificanceValueWithStyle()", () => {
    it("returns <span>0.300</span> for 0.3", () => {
        expect(formatSignificanceValueWithStyle(0.3)).toEqualJSX(<span>0.300</span>);
    });

    it("returns <b><span>0.030</span></b> for 0.03", () => {
        expect(formatSignificanceValueWithStyle(0.03)).toEqualJSX(<b><span>0.0300</span></b>);
    });
});

describe("#roundLogRatio()", () => {
    it("returns 5 for 8 and 5", () => {
        assert.equal(roundLogRatio(8, 5), 5);
    });

    it("returns -3 for -4 and 3", () => {
        assert.equal(roundLogRatio(-4, 3), -3);
    });

    it("returns 3.21 for 3.2123 and 10", () => {
        assert.equal(roundLogRatio(3.2123, 10), 3.21);
    });
});
