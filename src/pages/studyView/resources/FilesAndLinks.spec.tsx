import { getServerConfig } from 'config/config';
import { ResourceTableStore } from 'shared/components/resourceTable/ResourceTableStore';
import { STUDY_VIEW_RESOURCE_TABLE_OPTIONS } from 'shared/lib/ResourcePolicy';
import { isResourceListedInTable } from 'shared/lib/ResourceTableUtils';

const isHiddenFromFilesAndLinks = (resourceId: string) =>
    !isResourceListedInTable(resourceId, STUDY_VIEW_RESOURCE_TABLE_OPTIONS);

describe('Files & Links resource filtering', () => {
    let savedTileServerUrl: unknown;

    beforeEach(() => {
        savedTileServerUrl = (getServerConfig() as any).wsi_tile_server_url;
    });

    afterEach(() => {
        (getServerConfig() as any).wsi_tile_server_url = savedTileServerUrl;
    });

    it('lists the slide resources, which show as one combined tab', () => {
        (getServerConfig() as any).wsi_tile_server_url = '';
        expect(isHiddenFromFilesAndLinks('WSI_SAMPLE')).toBe(false);
        expect(isHiddenFromFilesAndLinks('WSI_PATIENT')).toBe(false);
        expect(isHiddenFromFilesAndLinks('MSK_HNE')).toBe(false);
        expect(isHiddenFromFilesAndLinks('OTHER')).toBe(false);
    });

    it('leaves out legacy H&E resources when the slide viewer is configured', () => {
        (getServerConfig() as any).wsi_tile_server_url =
            'https://slides.example.com';
        expect(isHiddenFromFilesAndLinks('MSK_HNE')).toBe(true);
        expect(isHiddenFromFilesAndLinks('HE')).toBe(true);
        expect(isHiddenFromFilesAndLinks('OTHER')).toBe(false);
    });

    it('offers the slide resources as one Pathology slides tab', () => {
        const store = new ResourceTableStore(STUDY_VIEW_RESOURCE_TABLE_OPTIONS);
        (store as any).tabs = {
            result: [
                {
                    resourceId: 'WSI_SAMPLE',
                    label: 'Slides',
                    totalCount: 3,
                    patientCount: 2,
                    sampleCount: 3,
                },
                {
                    resourceId: 'WSI_PATIENT',
                    label: 'Unmatched slides',
                    totalCount: 1,
                    patientCount: 1,
                    sampleCount: 0,
                },
                {
                    resourceId: 'OTHER',
                    label: 'Pathology report',
                    totalCount: 2,
                    patientCount: 2,
                    sampleCount: 0,
                },
            ],
        };
        expect(
            store.tabsForDisplay.map(tab => [tab.id, tab.label, tab.totalCount])
        ).toEqual([
            ['PATHOLOGY_SLIDES', 'Pathology slides', 4],
            ['OTHER', 'Pathology report', 2],
        ]);
        expect(store.activeResourceIds).toEqual(['WSI_SAMPLE', 'WSI_PATIENT']);
        expect(store.isMetadataKeyHidden('serving')).toBe(true);
        expect(store.isMetadataKeyHidden('slide_key')).toBe(false);
    });

    it('offers only the visible resources as tabs', () => {
        const store = new ResourceTableStore({
            hideResource: id => id === 'WSI_SAMPLE',
        });
        (store as any).tabs = {
            result: [
                { resourceId: 'WSI_SAMPLE', label: 'Pathology Slides' },
                { resourceId: 'OTHER', label: 'Pathology report' },
            ],
        };
        expect(store.tabsForDisplay.map(tab => tab.id)).toEqual(['OTHER']);
        expect(store.activeResourceId).toBe('OTHER');
        expect(store.activeResourceLabel).toBe('Pathology report');
    });
});
