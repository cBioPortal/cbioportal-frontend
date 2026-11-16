import {
    blockName,
    partDisplayName,
    realPartDescription,
} from './wsiSpecimenUtils';

describe('wsiSpecimenUtils', () => {
    it('does not repeat "Block" when the label already starts with it', () => {
        expect(blockName('Block 1')).toBe('1');
        expect(blockName('A1')).toBe('A1');
    });

    it.each(['Specimen 3', 'Part 3'])(
        'treats a generated "%s" description as no description',
        partDescription => {
            expect(realPartDescription(partDescription)).toBeNull();
        }
    );

    it('keeps a real part description', () => {
        expect(realPartDescription('Lung, left')).toBe('Lung, left');
    });

    it('names a part by number, else by its real description', () => {
        expect(
            partDisplayName({ part_number: '4', part_description: 'Biopsy' })
        ).toBe('Part 4');
        expect(partDisplayName({ part_description: 'Biopsy' })).toBe('Biopsy');
        expect(partDisplayName({ part_description: 'Part 3' })).toBeNull();
    });
});
