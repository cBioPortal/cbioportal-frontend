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

    it.each([
        ['a space', 'patient with space', 'patient%20with%20space'],
        ['a percent sign', 'patient%id', 'patient%25id'],
        ['a slash', 'patient/id', 'patient%2Fid'],
        ['unicode characters', '患者', '%E6%82%A3%E8%80%85'],
        ['an ordinary id', 'P-0001', 'P-0001'],
    ])('encodes %s exactly once', (_label, patientId, encodedPatientId) => {
        expect(
            buildWsiHierarchyUrl(
                `https://tiles.example.org/wsi/patient/${encodedPatientId}`,
                'study'
            )
        ).toBe(`/api/wsi/hierarchy/study/${encodedPatientId}`);
    });

    it('safely re-encodes malformed patient path escapes', () => {
        expect(
            buildWsiHierarchyUrl(
                'https://tiles.example.org/wsi/patient/patient%ZZ',
                'study'
            )
        ).toBe('/api/wsi/hierarchy/study/patient%25ZZ');
    });

    it('requires a study-scoped patient resource', () => {
        expect(() =>
            buildWsiHierarchyUrl(
                'https://tiles.example.org/wsi/slides',
                'study'
            )
        ).toThrow('patient ID');
    });
});
