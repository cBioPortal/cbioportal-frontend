import { buildWsiHierarchyUrl } from './wsiUrls';

jest.mock('shared/api/urls', () => ({
    buildCBioPortalAPIUrl: (path: string) => `/${path}`,
}));

describe('buildWsiHierarchyUrl', () => {
    it('builds a study-scoped backend URL from a tile resource URL', () => {
        expect(
            buildWsiHierarchyUrl(
                'https://tiles.example.org/wsi/patient/P-0001',
                'study/one'
            )
        ).toBe('/api/wsi/hierarchy/study%2Fone/P-0001');
    });

    it('requires a study-scoped patient resource', () => {
        expect(() =>
            buildWsiHierarchyUrl('https://tiles.example.org/wsi/slides', 'study')
        ).toThrow('patient ID');
    });
});
