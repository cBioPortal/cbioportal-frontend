import {
    getPatientViewUrl,
    getPatientViewUrlWithPathname,
    getSampleViewUrl,
    getSampleViewUrlWithPathname,
} from './urls';

jest.mock('config/config', () => ({
    getLoadConfig: () => ({
        baseUrl: 'cbio.example.org',
        frontendUrl: '//cbio.example.org/',
        apiRoot: 'https://cbio.example.org/api',
    }),
    getServerConfig: () => ({}),
}));

describe('patient view urls', () => {
    const originalLocation = window.location;

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                protocol: 'https:',
                host: 'cbio.example.org',
                pathname: '/',
                search: '',
            },
        });
    });

    afterAll(() => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation,
        });
    });

    it('defaults patient view links to the summary tab', () => {
        expect(getPatientViewUrl('study', 'P-1')).toBe(
            'https://cbio.example.org/patient/summary?studyId=study&caseId=P-1'
        );
    });

    it('builds patient view links for explicit pathnames', () => {
        expect(
            getPatientViewUrlWithPathname('study', 'P-1', 'patient/wsiHESlides')
        ).toBe(
            'https://cbio.example.org/patient/wsiHESlides?studyId=study&caseId=P-1'
        );
    });

    it('defaults sample view links to the patient root path', () => {
        expect(getSampleViewUrl('study', 'S-1')).toBe(
            'https://cbio.example.org/patient?sampleId=S-1&studyId=study'
        );
    });

    it('builds sample view links for explicit pathnames', () => {
        expect(
            getSampleViewUrlWithPathname('study', 'S-1', 'patient/clinicalData')
        ).toBe(
            'https://cbio.example.org/patient/clinicalData?sampleId=S-1&studyId=study'
        );
    });
});
