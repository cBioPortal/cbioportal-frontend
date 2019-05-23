import {assert} from "chai";
import {calcProteinChangeSortValue} from "./ProteinChangeUtils";

describe('ProteinChangeUtils', () => {

    describe("calcProteinChangeSortValue", () => {

        it('properly calculates sort value for a protein change string value', () => {
            const a = "E746_A750del";
            const b = "E747_T749del";
            const c = "K754E";
            const d = "K754I";

            let valA:number|null = calcProteinChangeSortValue(a);
            let valB:number|null = calcProteinChangeSortValue(b);
            let valC:number|null = calcProteinChangeSortValue(c);
            let valD:number|null = calcProteinChangeSortValue(d);

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

});
