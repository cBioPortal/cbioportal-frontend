import { floatValueIsNA } from "./NumberUtils";
import { assert } from 'chai';

describe('NumberUtils', () => {
    
    describe('floatValueIsNA', () => {
        const naValue = Number.MIN_VALUE;
        const normalValue = 5;
    
        it("returns true if passed in value is less than 1.0e-44 or undefined", () => {
            const naValueIsNA = floatValueIsNA(naValue);
            const normalValueIsNA = floatValueIsNA(normalValue);

            assert.isTrue(naValueIsNA, "floatValueIsNA() returned false, should be true");
            assert.isFalse(normalValueIsNA, "floatValueIsNA() returned true, should be false");
        });
    });
});
