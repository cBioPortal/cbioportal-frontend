import { assert } from 'chai';
import {
    isResourceListedInTable,
    isResourceViewerTab,
    isStudyWideResource,
    listedResourceTabs,
} from './ResourceTableUtils';

describe('isStudyWideResource', () => {
    it('is true when rows exist but none belong to a patient or sample', () => {
        assert.isTrue(
            isStudyWideResource({
                totalCount: 1,
                patientCount: 0,
                sampleCount: 0,
            })
        );
    });

    it('is false when any row belongs to a patient or sample', () => {
        assert.isFalse(
            isStudyWideResource({
                totalCount: 3,
                patientCount: 2,
                sampleCount: 0,
            })
        );
        assert.isFalse(
            isStudyWideResource({
                totalCount: 3,
                patientCount: 0,
                sampleCount: 2,
            })
        );
    });

    it('is false when the resource has no rows', () => {
        assert.isFalse(
            isStudyWideResource({
                totalCount: 0,
                patientCount: 0,
                sampleCount: 0,
            })
        );
    });
});

describe('listedResourceTabs', () => {
    const definitions = [
        { resourceId: 'NOTES', displayName: 'Notes' },
        { resourceId: 'SLIDE_SAMPLE', displayName: 'Sample slides' },
        { resourceId: 'SLIDE_PATIENT', displayName: 'Patient slides' },
        { resourceId: 'HIDDEN', displayName: 'Hidden' },
    ];
    const combinedTabs = [
        {
            id: 'SLIDES',
            label: 'Slides',
            resourceIds: ['SLIDE_SAMPLE', 'SLIDE_PATIENT'],
        },
    ];

    it('lists a combined tab once, under its label', () => {
        assert.deepEqual(
            listedResourceTabs(definitions, {
                combinedTabs,
                hideResource: id => id === 'HIDDEN',
            }),
            [
                { id: 'NOTES', label: 'Notes' },
                { id: 'SLIDES', label: 'Slides' },
            ]
        );
    });

    it("names a lone combined tab by its label, not a member's", () => {
        const options = {
            combinedTabs,
            hideResource: (id: string) => id === 'NOTES' || id === 'HIDDEN',
        };
        assert.deepEqual(listedResourceTabs(definitions, options), [
            { id: 'SLIDES', label: 'Slides' },
        ]);
        assert.isTrue(isResourceListedInTable('SLIDE_PATIENT', options));
        assert.isFalse(isResourceListedInTable('NOTES', options));
    });

    it('lists each resource under its own name without options', () => {
        assert.deepEqual(
            listedResourceTabs(definitions.slice(0, 2), {}).map(t => t.label),
            ['Notes', 'Sample slides']
        );
    });
});

describe('isResourceViewerTab', () => {
    const studyWide = { totalCount: 2, patientCount: 0, sampleCount: 0 };

    it("is a resource's own study-wide tab", () => {
        assert.isTrue(
            isResourceViewerTab({
                ...studyWide,
                resourceId: 'DOCS',
                resourceIds: ['DOCS'],
            })
        );
        assert.isFalse(
            isResourceViewerTab({
                totalCount: 2,
                patientCount: 1,
                sampleCount: 0,
                resourceId: 'DOCS',
                resourceIds: ['DOCS'],
            })
        );
    });

    it('is never a combined tab, even of study-wide resources', () => {
        const options = {
            combinedTabs: [
                { id: 'DOCS', label: 'Docs', resourceIds: ['DOCS', 'LINKS'] },
            ],
        };
        assert.isFalse(
            isResourceViewerTab(
                {
                    ...studyWide,
                    resourceId: 'DOCS',
                    resourceIds: ['DOCS', 'LINKS'],
                },
                options
            )
        );
        // Only the member sharing the tab's id is present.
        assert.isFalse(
            isResourceViewerTab(
                { ...studyWide, resourceId: 'DOCS', resourceIds: ['DOCS'] },
                options
            )
        );
        assert.isFalse(
            isResourceViewerTab({
                ...studyWide,
                resourceId: 'ALL_DOCS',
                resourceIds: ['LINKS'],
            })
        );
    });
});
