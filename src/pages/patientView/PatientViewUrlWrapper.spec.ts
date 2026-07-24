import PatientViewUrlWrapper from './PatientViewUrlWrapper';

describe('PatientViewUrlWrapper', () => {
    function makeWrapper(pathname = '/patient/summary') {
        const routing = {
            query: {
                studyId: 'study',
                caseId: 'P-1',
                sampleId: 'S-1',
                stainFilter: 'hne',
                matchLevel: 'Unmatched',
                specimenKey: 'unmatched::1::B1',
            },
            location: {
                pathname,
            },
            updateRoute: jest.fn(),
        } as any;

        return {
            routing,
            wrapper: new PatientViewUrlWrapper(routing),
        };
    }

    it('reads pathology slide query params from the route', () => {
        const { wrapper } = makeWrapper();

        expect(wrapper.query.studyId).toBe('study');
        expect(wrapper.query.caseId).toBe('P-1');
        expect(wrapper.query.sampleId).toBe('S-1');
        expect(wrapper.query.stainFilter).toBe('hne');
        expect(wrapper.query.matchLevel).toBe('Unmatched');
        expect(wrapper.query.specimenKey).toBe('unmatched::1::B1');
    });

    it('preserves pathology slide query params when switching tabs', () => {
        const { wrapper, routing } = makeWrapper('/patient/summary');

        wrapper.setActiveTab('wsiHESlides');

        expect(routing.updateRoute).toHaveBeenCalledWith(
            {},
            'patient/wsiHESlides',
            false,
            false
        );
        expect(wrapper.query.stainFilter).toBe('hne');
        expect(wrapper.query.matchLevel).toBe('Unmatched');
        expect(wrapper.query.specimenKey).toBe('unmatched::1::B1');
    });

    it('derives the active tab from the current pathname', () => {
        const { wrapper } = makeWrapper('/patient/clinicalData');

        expect(wrapper.activeTabId).toBe('clinicalData');
    });

    it('falls back to the summary tab when the pathname ends with a slash', () => {
        const { wrapper } = makeWrapper('/patient/');

        expect(wrapper.activeTabId).toBe('summary');
    });

    it('updates only the resource url when setting a linked resource', () => {
        const { wrapper, routing } = makeWrapper('/patient/summary');

        wrapper.setResourceUrl('https://example.org/report.pdf');

        expect(routing.updateRoute).toHaveBeenCalledWith(
            { resourceUrl: 'https://example.org/report.pdf' },
            undefined,
            false,
            false
        );
    });
});
