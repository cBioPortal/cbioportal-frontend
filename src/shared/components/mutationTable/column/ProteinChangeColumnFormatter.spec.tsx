import {assert} from "chai";
import ProteinChangeColumnFormatter from "./ProteinChangeColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
describe('ProteinChangeColumnFormatter', () => {
    const a = "E746_A750del";
    const b = "E747_T749del";
    const c = "K754E";
    const d = "K754I";

    it('properly extracts sort value from a protein change string value', () => {
        assert.isAbove(ProteinChangeColumnFormatter.extractSortValue(b),
                       ProteinChangeColumnFormatter.extractSortValue(a));

        assert.isAbove(ProteinChangeColumnFormatter.extractSortValue(d),
                       ProteinChangeColumnFormatter.extractSortValue(c));

        assert.isAbove(ProteinChangeColumnFormatter.extractSortValue(c),
                       ProteinChangeColumnFormatter.extractSortValue(b));
    });
});
