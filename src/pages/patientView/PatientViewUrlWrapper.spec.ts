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
                timepointDays: undefined,
                wsiScope: undefined,
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

    function makeSampleOnlyWrapper(pathname = '/patient/wsiHESlides') {
        const routing = {
            query: {
                studyId: 'coad_msk_2025',
                caseId: undefined,
                sampleId: 'P-0095109-T01-IM7',
                stainFilter: undefined,
                matchLevel: undefined,
                specimenKey: undefined,
                timepointDays: undefined,
                wsiScope: 'linkout',
            },
            location: { pathname },
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
        expect(wrapper.query.timepointDays).toBeUndefined();
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
        expect(wrapper.query.timepointDays).toBeUndefined();
    });

    it('navigates internal WSI linkouts through the router', () => {
        const { wrapper, routing } = makeWrapper('/patient/summary');

        expect(
            wrapper.navigateToWsiLinkout(
                '/patient/wsiHESlides?studyId=study&caseId=P-2&sampleId=S-2&stainFilter=ihc&matchLevel=PART&specimenKey=part%3A%3A2&timepointDays=-20'
            )
        ).toBe(true);

        expect(routing.updateRoute).toHaveBeenCalledWith(
            {
                studyId: 'study',
                caseId: 'P-2',
                sampleId: 'S-2',
                stainFilter: 'ihc',
                matchLevel: 'PART',
                specimenKey: 'part::2',
                timepointDays: '-20',
                wsiScope: 'linkout',
            },
            '/patient/wsiHESlides',
            true,
            false
        );
    });

    it('leaves external linkouts to the browser', () => {
        const { wrapper, routing } = makeWrapper('/patient/summary');

        expect(
            wrapper.navigateToWsiLinkout('https://slides.example.org/result')
        ).toBe(false);
        expect(routing.updateRoute).not.toHaveBeenCalled();
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

    it('sets and clears the WSI timepoint query parameter', () => {
        const { wrapper, routing } = makeWrapper('/patient/wsiHESlides');

        wrapper.setWsiTimepointDays(-20);
        expect(routing.updateRoute).toHaveBeenCalledWith(
            {
                sampleId: undefined,
                specimenKey: undefined,
                timepointDays: '-20',
                wsiScope: 'patient',
            },
            undefined,
            false,
            false
        );

        wrapper.setWsiTimepointDays(undefined);
        expect(routing.updateRoute).toHaveBeenLastCalledWith(
            {
                sampleId: undefined,
                specimenKey: undefined,
                timepointDays: undefined,
                wsiScope: 'patient',
            },
            undefined,
            false,
            false
        );
    });

    it('releases linkout scope when changing the stain filter', () => {
        const { wrapper, routing } = makeWrapper('/patient/wsiHESlides');

        wrapper.setWsiStainFilter('all');

        expect(routing.updateRoute).toHaveBeenCalledWith(
            {
                sampleId: undefined,
                specimenKey: undefined,
                stainFilter: undefined,
                wsiScope: 'patient',
            },
            undefined,
            false,
            false
        );
    });

    it('releases linkout scope when changing the match filter', () => {
        const { wrapper, routing } = makeWrapper('/patient/wsiHESlides');

        wrapper.setWsiMatchFilter('all');

        expect(routing.updateRoute).toHaveBeenCalledWith(
            {
                sampleId: undefined,
                specimenKey: undefined,
                matchLevel: undefined,
                wsiScope: 'patient',
            },
            undefined,
            false,
            false
        );
    });

    it('derives caseId before releasing a sample-only linkout scope', () => {
        const { wrapper, routing } = makeSampleOnlyWrapper();

        wrapper.setWsiMatchFilter('part', 'P-0095109');

        expect(routing.updateRoute).toHaveBeenCalledWith(
            {
                caseId: 'P-0095109',
                sampleId: undefined,
                specimenKey: undefined,
                matchLevel: 'PART',
                wsiScope: 'patient',
            },
            undefined,
            false,
            false
        );
    });

    it('uses the resolved patient id for non-MSK sample identifiers', () => {
        const { wrapper, routing } = makeSampleOnlyWrapper();
        routing.query.sampleId = 'TCGA-A1-A0SB-01';

        wrapper.setWsiMatchFilter('block', 'TCGA-A1-A0SB');

        expect(routing.updateRoute).toHaveBeenCalledWith(
            expect.objectContaining({
                caseId: 'TCGA-A1-A0SB',
                sampleId: undefined,
                matchLevel: 'BLOCK',
            }),
            undefined,
            false,
            false
        );
    });

    it('keeps sample identity when no resolved patient id is available', () => {
        const { wrapper, routing } = makeSampleOnlyWrapper();

        wrapper.setWsiMatchFilter('block');

        expect(routing.updateRoute).toHaveBeenCalledWith(
            {
                specimenKey: undefined,
                matchLevel: 'BLOCK',
                wsiScope: 'patient',
            },
            undefined,
            false,
            false
        );
    });

    it('keeps a patient route when clearing filters from a sample-only linkout', () => {
        const { wrapper, routing } = makeSampleOnlyWrapper();

        wrapper.clearWsiFilters('P-0095109');

        expect(routing.updateRoute).toHaveBeenCalledWith(
            {
                caseId: 'P-0095109',
                sampleId: undefined,
                stainFilter: undefined,
                matchLevel: undefined,
                specimenKey: undefined,
                timepointDays: undefined,
                wsiScope: 'patient',
            },
            undefined,
            false,
            false
        );
    });

    it('clears all WSI route filters while staying on the current tab', () => {
        const { wrapper, routing } = makeWrapper('/patient/wsiHESlides');

        wrapper.clearWsiFilters();

        expect(routing.updateRoute).toHaveBeenCalledWith(
            {
                sampleId: undefined,
                stainFilter: undefined,
                matchLevel: undefined,
                specimenKey: undefined,
                timepointDays: undefined,
                wsiScope: 'patient',
            },
            undefined,
            false,
            false
        );
    });
});
