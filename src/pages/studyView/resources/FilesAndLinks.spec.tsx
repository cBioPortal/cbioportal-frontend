import { getServerConfig } from 'config/config';
import { ResourceTableStore } from 'shared/components/resourceTable/ResourceTableStore';
import { isHiddenFromResourceViews as isHiddenFromFilesAndLinks } from 'shared/lib/ResourcePolicy';

describe('Files & Links resource filtering', () => {
    let savedTileServerUrl: unknown;

    beforeEach(() => {
        savedTileServerUrl = (getServerConfig() as any).wsi_tile_server_url;
    });

    afterEach(() => {
        (getServerConfig() as any).wsi_tile_server_url = savedTileServerUrl;
    });

    it('always leaves out the slide resources', () => {
        (getServerConfig() as any).wsi_tile_server_url = '';
        expect(isHiddenFromFilesAndLinks('WSI_SAMPLE')).toBe(true);
        expect(isHiddenFromFilesAndLinks('WSI_PATIENT')).toBe(true);
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
