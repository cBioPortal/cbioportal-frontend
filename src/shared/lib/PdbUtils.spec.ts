import { assert } from 'chai';
import {convertPdbPosToResCode, convertPdbPosToResAndInsCode} from './PdbUtils';
import {IPdbPositionRange} from "shared/model/Pdb";

describe('PdbUtils', () => {

    let pointPositionRange: IPdbPositionRange;
    let pointPositionRangeWithInsertion: IPdbPositionRange;
    let multiPositionRange: IPdbPositionRange;
    let multiPositionRangeWithInsertion: IPdbPositionRange;

    before(() => {
        pointPositionRange = {
            start: {
                position: 666
            },
            end: {
                position: 666
            }
        };

        multiPositionRange = {
            start: {
                position: 666
            },
            end: {
                position: 668
            }
        };

        pointPositionRangeWithInsertion = {
            start: {
                position: 666,
                insertionCode: "D"
            },
            end: {
                position: 666
            }
        };

        multiPositionRangeWithInsertion = {
            start: {
                position: 666,
                insertionCode: "D"
            },
            end: {
                position: 668,
                insertionCode: "D"
            }
        };
    });

    it('converts pdb positions to residue codes', () => {
        assert.deepEqual(convertPdbPosToResCode(pointPositionRange), ["666"]);
        assert.deepEqual(convertPdbPosToResCode(multiPositionRange), ["666", "667", "668"]);
        assert.deepEqual(convertPdbPosToResCode(pointPositionRangeWithInsertion), ["666^D"]);
        assert.deepEqual(convertPdbPosToResCode(multiPositionRangeWithInsertion), ["666^D", "667", "668^D"]);
    });

    it('converts pdb positions to residue and insertion code pairs', () => {
        assert.deepEqual(convertPdbPosToResAndInsCode(pointPositionRange),
            [{resi: 666}]);
        assert.deepEqual(convertPdbPosToResAndInsCode(multiPositionRange),
            [{resi: 666}, {resi: 667}, {resi: 668}]);
        assert.deepEqual(convertPdbPosToResAndInsCode(pointPositionRangeWithInsertion),
            [{resi: 666, icode: "D"}]);
        assert.deepEqual(convertPdbPosToResAndInsCode(multiPositionRangeWithInsertion),
            [{resi: 666, icode: "D"}, {resi: 667}, {resi: 668, icode: "D"}]);
    });
});
