import {assert} from "chai";
import ProteinChangeColumnFormatter from "./ProteinChangeColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
describe('ProteinChangeColumnFormatter functions', () => {
    let a = "E746_A750del";
    let b = "E747_T749del";
    let c = "K754E";
    let d = "K754I";

    it('protein change sort values are properly extracted', () => {
        assert.isAbove(ProteinChangeColumnFormatter.extractSortValue(b),
                       ProteinChangeColumnFormatter.extractSortValue(a));

        assert.isAbove(ProteinChangeColumnFormatter.extractSortValue(d),
                       ProteinChangeColumnFormatter.extractSortValue(c));

        assert.isAbove(ProteinChangeColumnFormatter.extractSortValue(c),
                       ProteinChangeColumnFormatter.extractSortValue(b));
    });
});