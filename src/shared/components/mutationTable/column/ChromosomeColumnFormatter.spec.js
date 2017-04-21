import {assert} from "chai";
import ChromosomeColumnFormatter from "./ChromosomeColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
describe('ChromosomeColumnFormatter functions', () => {
    let a = "1";
    let b = "chr2";
    let c = "22";
    let d = "chrX";
    let e = "Y";
    let f = "chrY";

    it('chromosome integer values are properly extracted', () => {
        assert.isAbove(ChromosomeColumnFormatter.extractSortValue(b),
            ChromosomeColumnFormatter.extractSortValue(a));

        assert.isAbove(ChromosomeColumnFormatter.extractSortValue(d),
            ChromosomeColumnFormatter.extractSortValue(c));

        assert.isAbove(ChromosomeColumnFormatter.extractSortValue(e),
            ChromosomeColumnFormatter.extractSortValue(d));

        assert.isAbove(ChromosomeColumnFormatter.extractSortValue(c),
            ChromosomeColumnFormatter.extractSortValue(b));

        assert.equal(ChromosomeColumnFormatter.extractSortValue(e),
            ChromosomeColumnFormatter.extractSortValue(f));
    });
});