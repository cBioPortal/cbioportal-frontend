import {
    groupPathologyPresentationItems,
    markPathologyLinkoutScope,
    summarizePathologyPresentationItems,
    PathologyPresentationItem,
} from './pathologyPresentationUtils';

const singleSpecimenLink =
    '/patient/wsiHESlides?studyId=study&sampleId=S-1&matchLevel=BLOCK&specimenKey=block%3A%3A1';

function makeItem(
    overrides: Partial<PathologyPresentationItem> = {}
): PathologyPresentationItem {
    return {
        date: -20,
        linkout: singleSpecimenLink,
        matchLevel: 'BLOCK',
        nonServableCount: 0,
        sampleId: 'S-1',
        specimen: 'Part 1 / Block 1',
        subtype: 'H&E',
        timepointSource: 'Procedure date',
        totalCount: 1,
        servableCount: 1,
        ...overrides,
    };
}

describe('pathology presentation linkouts', () => {
    it('marks legacy internal links with explicit linkout scope', () => {
        expect(
            markPathologyLinkoutScope(
                '/patient/wsiHESlides?studyId=study&sampleId=S-1',
                -20
            )
        ).toBe(
            '/patient/wsiHESlides?studyId=study&sampleId=S-1&wsiScope=linkout&timepointDays=-20'
        );
    });

    it('preserves the specimen key for a single-specimen link', () => {
        const item = makeItem();

        expect(groupPathologyPresentationItems([item])[0].linkout).toBe(
            singleSpecimenLink
        );
        expect(summarizePathologyPresentationItems([item]).linkout).toBe(
            singleSpecimenLink
        );
    });

    it('removes specimen specificity only when multiple specimens are grouped', () => {
        const second = makeItem({
            linkout: `${singleSpecimenLink.slice(0, -1)}2`,
            specimen: 'Part 1 / Block 2',
        });

        expect(
            groupPathologyPresentationItems([makeItem(), second])[0].linkout
        ).toBe(
            '/patient/wsiHESlides?studyId=study&sampleId=S-1&matchLevel=BLOCK'
        );
        expect(
            summarizePathologyPresentationItems([makeItem(), second]).linkout
        ).toBe(
            '/patient/wsiHESlides?studyId=study&sampleId=S-1&matchLevel=BLOCK'
        );
    });

    it('removes specificity for distinct specimen keys with the same label', () => {
        const second = makeItem({
            linkout: `${singleSpecimenLink.slice(0, -1)}2`,
        });

        expect(
            groupPathologyPresentationItems([makeItem(), second])[0].linkout
        ).toBe(
            '/patient/wsiHESlides?studyId=study&sampleId=S-1&matchLevel=BLOCK'
        );
        expect(
            summarizePathologyPresentationItems([makeItem(), second]).linkout
        ).toBe(
            '/patient/wsiHESlides?studyId=study&sampleId=S-1&matchLevel=BLOCK'
        );
    });
});
