import { assert } from 'chai';
import { getServerConfig } from 'config/config';
import {
    isHiddenFromResourceViews,
    isHiddenMetadataKey,
    PATHOLOGY_SLIDES_RESOURCE_TAB,
    STUDY_VIEW_COMBINED_RESOURCE_TABS,
    STUDY_VIEW_RESOURCE_TABLE_OPTIONS,
    isWsiResourceId,
    isWsiTileServerConfigured,
    patientViewPathForResource,
    resourceMetadataDisplayValue,
    resourceSearchTermForQuery,
    shouldHideLegacyHeResourceTab,
    slideStainFilterForColumnFilters,
    slideStainFilterQuery,
} from './ResourcePolicy';
import { isResourceListedInTable } from './ResourceTableUtils';

const isHiddenFromStudyResourceTable = (resourceId: string) =>
    !isResourceListedInTable(resourceId, STUDY_VIEW_RESOURCE_TABLE_OPTIONS);

describe('legacy H&E resource policy', () => {
    let savedTileServerUrl: unknown;

    beforeEach(() => {
        savedTileServerUrl = (getServerConfig() as any).wsi_tile_server_url;
        (getServerConfig() as any).wsi_tile_server_url =
            'https://slides.example.com';
    });

    afterEach(() => {
        (getServerConfig() as any).wsi_tile_server_url = savedTileServerUrl;
    });

    it('returns false for an empty tile server URL', () => {
        (getServerConfig() as any).wsi_tile_server_url = '';
        assert.isFalse(isWsiTileServerConfigured());
    });

    it('returns true for a non-empty tile server URL', () => {
        assert.isTrue(isWsiTileServerConfigured());
    });

    it('hides legacy H&E resource tabs when the native viewer is configured', () => {
        assert.isTrue(shouldHideLegacyHeResourceTab('HE'));
        assert.isTrue(shouldHideLegacyHeResourceTab('MSK_HNE'));
        assert.isFalse(shouldHideLegacyHeResourceTab('OTHER'));
    });

    it('keeps legacy H&E resources visible when no tile server is configured', () => {
        (getServerConfig() as any).wsi_tile_server_url = '';
        assert.isFalse(shouldHideLegacyHeResourceTab('MSK_HNE'));
    });

    it('lists the slides as one study view tab and not in the patient view', () => {
        assert.deepEqual(STUDY_VIEW_COMBINED_RESOURCE_TABS, [
            PATHOLOGY_SLIDES_RESOURCE_TAB,
        ]);
        assert.deepEqual(PATHOLOGY_SLIDES_RESOURCE_TAB.resourceIds, [
            'WSI_SAMPLE',
            'WSI_PATIENT',
        ]);
        assert.equal(PATHOLOGY_SLIDES_RESOURCE_TAB.label, 'Pathology slides');
        // Study view shows the slide resources only through the combined tab.
        assert.isFalse(isHiddenFromStudyResourceTable('WSI_SAMPLE'));
        assert.isFalse(isHiddenFromStudyResourceTable('WSI_PATIENT'));
        assert.isFalse(isHiddenFromStudyResourceTable('OTHER'));
        assert.isTrue(isHiddenFromResourceViews('WSI_SAMPLE'));
        assert.isTrue(isHiddenFromResourceViews('WSI_PATIENT'));
        assert.isFalse(isHiddenFromResourceViews('OTHER'));
    });

    it('links slide rows to Pathology Slides and other rows to Files & Links', () => {
        assert.equal(
            patientViewPathForResource('WSI_PATIENT'),
            'patient/wsiHESlides'
        );
        assert.equal(
            patientViewPathForResource('IDC_OHIF_V2'),
            'patient/filesAndLinks'
        );
        assert.equal(
            patientViewPathForResource(undefined),
            'patient/filesAndLinks'
        );
    });

    it('carries a single stain group filter to the slide links', () => {
        const stainGroup = (operator: string, values: string[]) => [
            { columnId: 'metadata:stain_group', operator, values },
        ];
        assert.equal(
            slideStainFilterForColumnFilters(stainGroup('in', ['IHC'])),
            'ihc'
        );
        assert.equal(
            slideStainFilterForColumnFilters(stainGroup('in', ['H&E'])),
            'hne'
        );
        assert.isUndefined(
            slideStainFilterForColumnFilters(stainGroup('in', ['H&E', 'IHC']))
        );
        assert.isUndefined(
            slideStainFilterForColumnFilters(stainGroup('notIn', ['IHC']))
        );
        assert.isUndefined(
            slideStainFilterForColumnFilters([
                {
                    columnId: 'metadata:magnification',
                    operator: 'in',
                    values: ['40x'],
                },
            ])
        );
        assert.deepEqual(slideStainFilterQuery('ihc'), {
            pathologySlideSettings: '{"stainFilter":"ihc"}',
        });
        assert.deepEqual(slideStainFilterQuery(undefined), {});
    });

    it('keeps legacy H&E resources out of both resource tables', () => {
        assert.isTrue(isHiddenFromStudyResourceTable('MSK_HNE'));
        assert.isTrue(isHiddenFromResourceViews('HE'));
    });

    it('recognises the whole-slide image resource ids', () => {
        assert.isTrue(isWsiResourceId('WSI_SAMPLE'));
        assert.isTrue(isWsiResourceId('WSI_PATIENT'));
        assert.isFalse(
            isWsiResourceId(PATHOLOGY_SLIDES_RESOURCE_TAB.id),
            'the combined tab id is not a resource'
        );
        assert.isFalse(isWsiResourceId('HE'));
        assert.isFalse(isWsiResourceId(undefined));
    });
});

describe('slide ID display', () => {
    const SLIDES = ['WSI_SAMPLE', 'WSI_PATIENT'];

    it('shows a slide table slide key as a WSI- Slide ID', () => {
        assert.equal(
            resourceMetadataDisplayValue(
                'WSI_SAMPLE',
                'slide_key',
                '1234094d6bc6'
            ),
            'WSI-1234-094d-6bc6'
        );
    });

    it('leaves other columns and other resources unchanged', () => {
        assert.equal(
            resourceMetadataDisplayValue('WSI_SAMPLE', 'stain_name', 'H&E'),
            'H&E'
        );
        assert.equal(
            resourceMetadataDisplayValue('NOTES', 'slide_key', '1234094d6bc6'),
            '1234094d6bc6'
        );
    });

    it.each([
        'WSI-1234-094D-6bc6',
        'wsi-1234-094d-6bc6',
        '1234-094d-6bc6',
        'WSI-1234094d6bc6',
    ])(
        'searches a slide table for the bare key of a pasted Slide ID %p',
        term => {
            assert.equal(
                resourceSearchTermForQuery(SLIDES, term),
                '1234094d6bc6'
            );
        }
    );

    it.each([
        ['WSI-0acd', '0acd'],
        ['wsi-0acd-ab', '0acdab'],
        ['WSI-0ACD-AB3D-2', '0acdab3d2'],
        ['WSI-0acdab', '0acdab'],
        ['0acd-ab3d', '0acdab3d'],
        ['0acd-ab', '0acdab'],
        ['0ACD-', '0acd'],
        [' wsi-0acd-ab3d ', '0acdab3d'],
    ])(
        'searches a slide table for a partial Slide ID %p as %p',
        (term, key) => {
            assert.equal(resourceSearchTermForQuery(SLIDES, term), key);
        }
    );

    it.each([
        ['0ACDAB3D2BB2', '0acdab3d2bb2'],
        ['AB3D', 'ab3d'],
        ['0acdab', '0acdab'],
    ])('lower-cases a bare hex search %p in a slide table', (term, key) => {
        assert.equal(resourceSearchTermForQuery(SLIDES, term), key);
    });

    it.each([
        'P-0000012-T06-IM7',
        'P-0000012',
        'Breast',
        'H&E',
        '2024-01',
        '2024-01-15',
        '2024-1-',
        'WSI-',
        '0acd-ab3d-2bb2-ffff',
        'abc-def',
    ])('leaves an unrelated slide-table search %p unchanged', term => {
        assert.equal(resourceSearchTermForQuery(SLIDES, term), term);
    });

    it('leaves searches outside slide tables unchanged', () => {
        for (const term of [
            '1234-094d-6bc6',
            'WSI-1234-094d-6bc6',
            'WSI-0acd',
            '0ACDAB3D2BB2',
        ]) {
            assert.equal(resourceSearchTermForQuery(['NOTES'], term), term);
        }
    });
});

describe('hidden metadata', () => {
    it("hides the slides' tile serving block from any table reading them", () => {
        assert.isTrue(isHiddenMetadataKey(['WSI_SAMPLE'], 'serving'));
        assert.isTrue(isHiddenMetadataKey(['NOTES', 'WSI_PATIENT'], 'serving'));
        assert.isFalse(isHiddenMetadataKey(['WSI_SAMPLE'], 'slide_key'));
        assert.isFalse(isHiddenMetadataKey(['NOTES'], 'serving'));
        assert.isFalse(isHiddenMetadataKey([], 'serving'));
    });
});
