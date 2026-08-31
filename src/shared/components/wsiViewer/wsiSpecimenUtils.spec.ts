import { formatSpecimenLabel } from './wsiSpecimenUtils';

describe('wsiSpecimenUtils', () => {
    it('formats block-matched specimens with both part and block labels', () => {
        expect(
            formatSpecimenLabel({
                match_level: 'BLOCK',
                part_number: '4',
                block_label: 'A',
            })
        ).toBe('Part 4 / Block A');
    });

    it('falls back to part description when part number is missing', () => {
        expect(
            formatSpecimenLabel({
                match_level: 'PART',
                part_description: 'Biopsy',
            })
        ).toBe('Biopsy');
    });

    it('falls back to a generic specimen label when no part details exist', () => {
        expect(
            formatSpecimenLabel({
                match_level: 'UNMATCHED',
            })
        ).toBe('Specimen');
    });

    it('uses block number when block label is unavailable', () => {
        expect(
            formatSpecimenLabel({
                match_level: 'BLOCK',
                part_number: '7',
                block_number: '2',
            })
        ).toBe('Part 7 / Block 2');
    });
});
