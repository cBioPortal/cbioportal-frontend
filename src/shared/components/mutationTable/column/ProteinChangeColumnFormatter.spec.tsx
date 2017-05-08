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
        let valA:number|null = ProteinChangeColumnFormatter.extractSortValue(a);
        let valB:number|null = ProteinChangeColumnFormatter.extractSortValue(b);
        let valC:number|null = ProteinChangeColumnFormatter.extractSortValue(c);
        let valD:number|null = ProteinChangeColumnFormatter.extractSortValue(d);

        assert.isNotNull(valA);
        assert.isNotNull(valB);
        assert.isNotNull(valC);
        assert.isNotNull(valD);

        assert.isAbove(valB as number,
                       valA as number);

        assert.isAbove(valD as number,
                       valC as number);

        assert.isAbove(valC as number,
                       valB as number);
    });
});
