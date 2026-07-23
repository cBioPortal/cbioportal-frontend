import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { observable, runInAction } from 'mobx';
import { clearPatientHierarchyCache } from 'shared/components/wsiViewer/wsiHierarchyFetchCache';
import * as wsiSlideUtils from 'shared/components/wsiViewer/wsiSlideUtils';
const mockUsePathologyAugmentedClinicalEvents = jest.fn();
const mockTimelineWrapperContent = jest.fn((_: any) => (
    <div>Timeline Content</div>
));
import {
    PatientViewPageTabs as PatientViewPageTabIds,
    PatientViewPathologySlidesTabGate,
    SummaryTimelineSection,
    patientViewTabs,
    tabs,
} from './PatientViewPageTabs';
import { buildTimelineEventsSignature } from 'pages/patientView/timeline/pathologyTimelineUtils';

var mockServerConfig = {
    msk_wsi_tile_server_url: 'https://slides.example.com',
    msk_wsi_enable_bootstrap: false,
    app_name: 'localdbe2e',
    show_oncokb: false,
    oncoprint_custom_driver_annotation_binary_menu_label: '',
    oncoprint_custom_driver_annotation_binary_menu_description: '',
    oncoprint_custom_driver_annotation_tiers_menu_label: '',
    oncoprint_custom_driver_annotation_tiers_menu_description: '',
};

jest.mock('config/config', () => ({
    getServerConfig: () => mockServerConfig,
    ServerConfigHelpers: {},
}));
jest.mock('shared/components/MSKTabs/MSKTabs', () => ({
    MSKTabs: ({ children }: any) => <div>{children}</div>,
    MSKTab: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('pages/patientView/mutation/MutationTableWrapper', () => () => (
    <div>Mutation Table</div>
));
jest.mock(
    'pages/patientView/structuralVariant/StructuralVariantTableWrapper',
    () => () => <div>Structural Variants</div>
);
jest.mock(
    'pages/patientView/clinicalInformation/ClinicalInformationSamplesTable',
    () => () => <div>Clinical Samples</div>
);
jest.mock('pages/patientView/timeline/usePathologyAugmentedClinicalEvents', () => ({
    __esModule: true,
    default: (...args: unknown[]) =>
        mockUsePathologyAugmentedClinicalEvents(...args)?.events,
    usePathologyAugmentedClinicalEventsState: (...args: unknown[]) =>
        mockUsePathologyAugmentedClinicalEvents(...args),
}));
jest.mock('pages/patientView/timeline/TimelineWrapper', () => ({
    __esModule: true,
    TimelineWrapperContent: (props: any) => mockTimelineWrapperContent(props),
}));
jest.mock('pages/patientView/timeline/ClinicalEventsTables', () => ({
    __esModule: true,
    default: () => <div>Clinical Events</div>,
}));

const mockWSIViewer = jest.fn((_: any) => <div>WSI Viewer</div>);
const mockWarmInitialWsiSlide = jest.fn().mockResolvedValue(undefined);
const mockPrimeInitialWsiHierarchy = jest.fn().mockResolvedValue(undefined);
const mockReadWsiHashState: jest.Mock<any, any> = jest.fn(() => undefined);
const mockFetchPatientBootstrap = jest.fn();
const mockHydratePatientBootstrapCaches = jest.fn();
jest.mock('shared/components/wsiViewer/WSIViewer', () => ({
    __esModule: true,
    default: (props: any) => mockWSIViewer(props),
}));
jest.mock('shared/components/wsiViewer/wsiViewerWarmup', () => ({
    primeInitialWsiHierarchy: (options: any) =>
        mockPrimeInitialWsiHierarchy(options),
    warmInitialWsiSlide: (options: any) => mockWarmInitialWsiSlide(options),
}));
jest.mock('shared/components/wsiViewer/wsiViewStateUtils', () => ({
    readWsiHashState: () => mockReadWsiHashState(),
}));
jest.mock('shared/components/wsiViewer/wsiBootstrapFetch', () => ({
    fetchPatientBootstrap: (...args: unknown[]) =>
        mockFetchPatientBootstrap(...args),
    fetchPatientBootstrapReadOnly: (...args: unknown[]) =>
        mockFetchPatientBootstrap(...args),
    hydratePatientBootstrapCaches: (...args: unknown[]) =>
        mockHydratePatientBootstrapCaches(...args),
    isWsiBootstrapEnabled: () =>
        mockServerConfig.msk_wsi_enable_bootstrap === true,
}));

function makeHierarchy(
    slidesBySampleId: Record<string, any[]>,
    slideAssociations?: any[]
) {
    const associations =
        slideAssociations ||
        Object.entries(slidesBySampleId).flatMap(([sampleId, slides]) =>
            slides.map(slide => ({
                image_id: slide.image_id,
                sample_id: sampleId,
                match_level: 'BLOCK',
                specimen_key: 'block::1::1',
                slide_type: slide.is_ihc ? 'IHC' : 'H&E',
                can_serve_tiles: slide.can_serve_tiles,
            }))
        );
    return {
        patient_id: 'P-1',
        samples: Object.entries(slidesBySampleId).map(([sampleId, slides]) => ({
            sample_id: sampleId,
            cancer_type: '',
            cancer_type_detailed: '',
            oncotree_code: '',
            primary_site: '',
            sample_type: '',
            parts: [
                {
                    part_number: '1',
                    part_designator: '1',
                    part_type: '',
                    part_description: '',
                    subspecialty: '',
                    path_dx_title: '',
                    blocks: [
                        {
                            block_number: '1',
                            block_label: 'A1',
                            slides,
                        },
                    ],
                },
            ],
        })),
        slide_associations: associations,
    };
}

function makeSlide(overrides: Record<string, any> = {}) {
    return {
        image_id: '1',
        stain_name: 'H&E',
        stain_group: 'H&E (Initial)',
        is_hne: true,
        is_ihc: false,
        magnification: '',
        file_size_bytes: '',
        can_serve_tiles: true,
        barcode: '',
        block_label: 'A1',
        block_number: '1',
        ...overrides,
    };
}

function makePageComponent(
    overrides: Record<string, any> = {},
    queryOverrides: Record<string, any> = {}
) {
    const pageStore = {
        clinicalDataGroupedBySample: {
            isComplete: true,
            isPending: false,
            result: [{ id: 'S-1' }, { id: 'S-2' }],
        },
        clinicalEvents: {
            isComplete: false,
            isPending: false,
            result: [],
        },
        patientId: 'P-1',
        studyId: 'study',
        samples: { result: [] },
        mutationMolecularProfileId: { result: null },
        mutationData: { isPending: false, isComplete: false },
        uncalledMutationData: { isPending: false, isComplete: false },
        oncoKbAnnotatedGenes: { isPending: false, isComplete: false },
        cnaSegments: { isPending: false, isComplete: false, result: [] },
        sequencedSampleIdsInStudy: { isPending: false, isComplete: false },
        sampleToMutationGenePanelId: {
            isPending: false,
            isComplete: false,
            result: {},
        },
        sampleToDiscreteGenePanelId: {
            isPending: false,
            isComplete: false,
            result: {},
        },
        studies: { isPending: false, isComplete: false, result: [] },
        mergedMutationDataFilteredByGene: [],
        namespaceColumnConfig: { structVar: {}, cna: {} },
        studyIdToStudy: { isPending: false, isComplete: false },
        genePanelIdToEntrezGeneIds: { isComplete: false },
        referenceGenes: { isComplete: false },
        discreteMolecularProfile: { isComplete: false, result: null },
        genePanelDataByMolecularProfileIdAndSampleId: { isComplete: false },
        sampleIds: [],
        existsSomeMutationWithVAFData: false,
        plotsStore: { mrnaExpressionMolecularProfile: { isComplete: false } },
        geneticTrackData: { isComplete: false },
        mergedMutationDataIncludingUncalledFilteredByGene: null,
        clinicalDataPatient: { isComplete: false, result: [] },
        pathologyReport: { isComplete: false, result: [] },
        hasMutationalSignatureData: { result: false },
        initialMutationalSignatureVersion: { isComplete: false },
        pageMode: 'patient',
        ...overrides.pageStore,
    };

    return {
        patientViewPageStore: pageStore,
        patientViewMutationDataStore: { namespaceColumnConfig: {} },
        patientViewCnaDataStore: {},
        urlWrapper: {
            query: {
                stainFilter: 'all',
                sampleId: 'S-1',
                matchLevel: undefined,
                specimenKey: undefined,
                ...queryOverrides,
            },
            activeTabId: PatientViewPageTabIds.Summary,
            hash: '',
            routing: {
                location: {
                    pathname: '/patient/summary',
                },
            },
            setActiveTab: jest.fn(),
        },
        props: {
            appStore: {
                featureFlagStore: {
                    has: () => false,
                },
            },
        },
        resourceTabs: { component: [] },
        shouldShowResources: false,
        shouldShowPathologyReport: false,
        hideTissueImageTab: true,
        shouldShowTrialMatch: false,
        mergeMutationTableOncoKbIcons: false,
        mutationTableColumnVisibility: {},
        cnaTableColumnVisibility: {},
        columns: [],
        genePanelModal: { isOpen: false },
        onResetViewClick: jest.fn(),
        toggleGenePanelModal: jest.fn(),
        handleOncoKbIconToggle: jest.fn(),
        onMutationTableColumnVisibilityToggled: jest.fn(),
        onFilterGenesMutationTable: jest.fn(),
        onMutationTableRowClick: jest.fn(),
        onMutationTableRowMouseEnter: jest.fn(),
        onMutationTableRowMouseLeave: jest.fn(),
        onFilterGenesCopyNumberTable: jest.fn(),
        onCnaTableColumnVisibilityToggled: jest.fn(),
        onCnaTableRowClick: jest.fn(),
        onMutationalSignatureVersionChange: jest.fn(),
        onSampleIdChange: jest.fn(),
        ...overrides,
    };
}

describe('PatientViewPathologySlidesTabGate', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        clearPatientHierarchyCache();
        mockServerConfig.msk_wsi_enable_bootstrap = false;
        mockFetchPatientBootstrap.mockReset();
        mockHydratePatientBootstrapCaches.mockReset();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('tracks observable values read by its tab render callback', () => {
        const status = observable.box('pending');
        let renderer: TestRenderer.ReactTestRenderer;

        act(() => {
            renderer = TestRenderer.create(
                <PatientViewPathologySlidesTabGate>
                    {() => <div>{status.get()}</div>}
                </PatientViewPathologySlidesTabGate>
            );
        });
        expect(renderer!.root.findByType('div').children).toEqual(['pending']);

        act(() => runInAction(() => status.set('complete')));

        expect(renderer!.root.findByType('div').children).toEqual(['complete']);
    });

    it('returns undefined and does not fetch until enough inputs are available', async () => {
        global.fetch = jest.fn();

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <PatientViewPathologySlidesTabGate
                    tileServerUrl="https://slides.example.com"
                    patientId="P-1"
                    studyId="study"
                >
                    {hasServableSlides => <div>{String(hasServableSlides)}</div>}
                </PatientViewPathologySlidesTabGate>
            );
        });

        expect(renderer!.root.findByType('div').children).toEqual([
            'undefined',
        ]);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('renders the active WSI tab immediately without an extra hierarchy fetch', async () => {
        global.fetch = jest.fn();

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <PatientViewPathologySlidesTabGate
                    tileServerUrl="https://slides.example.com"
                    patientId="P-1"
                    studyId="study"
                    activeTabId={PatientViewPageTabIds.WSIHESlides}
                >
                    {hasServableSlides => <div>{String(hasServableSlides)}</div>}
                </PatientViewPathologySlidesTabGate>
            );
        });

        expect(renderer!.root.findByType('div').children).toEqual(['true']);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows the tab when the hierarchy has a viewable unclassified slide', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () =>
                makeHierarchy({
                    'S-1': [
                        makeSlide({
                            image_id: '2',
                            stain_group: 'SLIDES SUBMITTED',
                            stain_name: 'SLIDES SUBMITTED',
                            is_hne: false,
                            is_ihc: false,
                        }),
                    ],
                }),
        }) as typeof fetch;

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <PatientViewPathologySlidesTabGate
                    tileServerUrl="https://slides.example.com"
                    patientId="P-1"
                    studyId="study"
                    hasLoadedSampleIds={true}
                >
                    {hasServableSlides => (
                        <div>{String(hasServableSlides)}</div>
                    )}
                </PatientViewPathologySlidesTabGate>
            );
        });

        expect(renderer!.root.findByType('div').children).toEqual(['true']);
    });

    it('shows the tab when the hierarchy has a servable diagnostic slide', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () =>
                makeHierarchy({
                    'S-1': [makeSlide()],
                }),
        }) as typeof fetch;

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <PatientViewPathologySlidesTabGate
                    tileServerUrl="https://slides.example.com"
                    patientId="P-1"
                    studyId="study"
                    hasLoadedSampleIds={true}
                >
                    {hasServableSlides => (
                        <div>{String(hasServableSlides)}</div>
                    )}
                </PatientViewPathologySlidesTabGate>
            );
        });

        expect(renderer!.root.findByType('div').children).toEqual(['true']);
    });

    it('does not refetch tab availability when sample-id contents or stain preference change', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () =>
                makeHierarchy({
                    'S-1': [makeSlide()],
                    'S-2': [],
                }),
        }) as typeof fetch;

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <PatientViewPathologySlidesTabGate
                    tileServerUrl="https://slides.example.com"
                    patientId="P-1"
                    studyId="study"
                    hasLoadedSampleIds={true}
                >
                    {hasServableSlides => (
                        <div>{String(hasServableSlides)}</div>
                    )}
                </PatientViewPathologySlidesTabGate>
            );
        });

        expect(global.fetch).toHaveBeenCalledTimes(1);

        await act(async () => {
            renderer!.update(
                <PatientViewPathologySlidesTabGate
                    tileServerUrl="https://slides.example.com"
                    patientId="P-1"
                    studyId="study"
                    hasLoadedSampleIds={true}
                >
                    {hasServableSlides => (
                        <div>{String(hasServableSlides)}</div>
                    )}
                </PatientViewPathologySlidesTabGate>
            );
        });

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(renderer!.root.findByType('div').children).toEqual(['true']);
    });

    it('shows the tab for an unmatched pathology filter without loaded sample ids', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () =>
                makeHierarchy(
                    {
                        UNMATCHED: [makeSlide({ image_id: '7' })],
                    },
                    [
                        {
                            image_id: '7',
                            sample_id: null,
                            match_level: 'UNMATCHED',
                            specimen_key: 'unmatched::2::1',
                            can_serve_tiles: true,
                            slide_type: 'H&E',
                        },
                    ]
                ),
        }) as typeof fetch;

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <PatientViewPathologySlidesTabGate
                    tileServerUrl="https://slides.example.com"
                    patientId="P-1"
                    studyId="study"
                    pathologyFilter={{
                        matchLevel: 'Unmatched',
                        specimenKey: 'unmatched::2::1',
                    }}
                >
                    {hasServableSlides => (
                        <div>{String(hasServableSlides)}</div>
                    )}
                </PatientViewPathologySlidesTabGate>
            );
        });

        expect(renderer!.root.findByType('div').children).toEqual(['true']);
    });

    it('hides the tab when the pathology filter matches no viewable associations', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () =>
                makeHierarchy(
                    {
                        'S-1': [makeSlide({ image_id: '11' })],
                    },
                    [
                        {
                            image_id: '11',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'part::1',
                            can_serve_tiles: true,
                            slide_type: 'H&E',
                        },
                    ]
                ),
        }) as typeof fetch;

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <PatientViewPathologySlidesTabGate
                    tileServerUrl="https://slides.example.com"
                    patientId="P-1"
                    studyId="study"
                    hasLoadedSampleIds={true}
                    pathologyFilter={{
                        sampleId: 'S-1',
                        matchLevel: 'BLOCK',
                        specimenKey: 'part::1',
                    }}
                >
                    {hasServableSlides => (
                        <div>{String(hasServableSlides)}</div>
                    )}
                </PatientViewPathologySlidesTabGate>
            );
        });

        expect(renderer!.root.findByType('div').children).toEqual(['false']);
    });

    it('shows the tab when a servable slide is outside the loaded sample set', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () =>
                makeHierarchy({
                    'S-1': [makeSlide()],
                    'S-2': [],
                }),
        }) as typeof fetch;

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <PatientViewPathologySlidesTabGate
                    tileServerUrl="https://slides.example.com"
                    patientId="P-1"
                    studyId="study"
                    hasLoadedSampleIds={true}
                >
                    {hasServableSlides => (
                        <div>{String(hasServableSlides)}</div>
                    )}
                </PatientViewPathologySlidesTabGate>
            );
        });

        expect(renderer!.root.findByType('div').children).toEqual(['true']);
    });

    it('uses bootstrap for the pathology-slides gate when enabled and avoids the legacy hierarchy fetch', async () => {
        mockServerConfig.msk_wsi_enable_bootstrap = true;
        global.fetch = jest.fn();
        mockFetchPatientBootstrap.mockResolvedValue({
            hierarchy: makeHierarchy({
                'S-1': [makeSlide()],
            }),
            initial: null,
        });

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <PatientViewPathologySlidesTabGate
                    tileServerUrl="https://slides.example.com"
                    patientId="P-1"
                    studyId="study"
                    hasLoadedSampleIds={true}
                >
                    {hasServableSlides => (
                        <div>{String(hasServableSlides)}</div>
                    )}
                </PatientViewPathologySlidesTabGate>
            );
        });

        expect(renderer!.root.findByType('div').children).toEqual(['true']);
        expect(mockFetchPatientBootstrap).toHaveBeenCalledWith(
            {
                hierarchyUrl:
                    'https://slides.example.com/patient/P-1?studyId=study',
            },
            expect.any(Object)
        );
        expect(mockHydratePatientBootstrapCaches).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('uses the read-only pathology-filter slide-id lookup in the pathology-slides gate', async () => {
        const getServableSlideIdsForPathologyFilterReadOnlySpy = jest.spyOn(
            wsiSlideUtils,
            'getServableSlideIdsForPathologyFilterReadOnly'
        );
        const getServableSlideIdsForPathologyFilterSpy = jest.spyOn(
            wsiSlideUtils,
            'getServableSlideIdsForPathologyFilter'
        );
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () =>
                makeHierarchy(
                    { 'S-1': [makeSlide()] },
                    [
                        {
                            image_id: '1',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'specimen::1',
                            slide_type: 'H&E',
                            can_serve_tiles: true,
                        },
                    ]
                ),
        }) as typeof fetch;

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <PatientViewPathologySlidesTabGate
                    tileServerUrl="https://slides.example.com"
                    patientId="P-1"
                    studyId="study"
                    hasLoadedSampleIds={true}
                    pathologyFilter={{
                        sampleId: 'S-1',
                        matchLevel: 'BLOCK',
                        specimenKey: 'specimen::1',
                    }}
                >
                    {hasServableSlides => (
                        <div>{String(hasServableSlides)}</div>
                    )}
                </PatientViewPathologySlidesTabGate>
            );
        });

        expect(renderer!.root.findByType('div').children).toEqual(['true']);
        expect(
            getServableSlideIdsForPathologyFilterReadOnlySpy
        ).toHaveBeenCalledTimes(1);
        expect(
            getServableSlideIdsForPathologyFilterSpy
        ).not.toHaveBeenCalled();
    });
});

describe('SummaryTimelineSection', () => {
    beforeEach(() => {
        mockUsePathologyAugmentedClinicalEvents.mockReset();
        mockTimelineWrapperContent.mockClear();
    });

    it('passes one augmented pathology event array to the summary timeline', () => {
        const clinicalEvents = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                studyId: 'study',
                startNumberOfDaysSinceDiagnosis: 1,
            },
        ] as any;
        const augmentedEvents = [
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                studyId: 'study',
                startNumberOfDaysSinceDiagnosis: 5,
                endNumberOfDaysSinceDiagnosis: 5,
                uniquePatientKey: 'patient-key',
                uniqueSampleKey: 'sample-key',
                attributes: [],
            },
        ];
        const augmentedEventsSignature =
            buildTimelineEventsSignature(augmentedEvents);
        mockUsePathologyAugmentedClinicalEvents.mockReturnValue({
            events: augmentedEvents,
            eventsSignature: augmentedEventsSignature,
        });

        TestRenderer.create(
            <SummaryTimelineSection
                dataStore={{}}
                caseMetaData={{ color: {}, label: {}, index: {} }}
                clinicalEvents={clinicalEvents}
                patientId="P-1"
                studyId="study"
                sampleManager={{ samples: [] } as any}
                width={1000}
                samples={[] as any}
                clinicalSamples={[] as any}
                mutationProfileId="profile"
            />
        );

        expect(mockUsePathologyAugmentedClinicalEvents).toHaveBeenCalledTimes(
            1
        );
        expect(mockUsePathologyAugmentedClinicalEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                clinicalEvents,
                clinicalEventsSignature:
                    buildTimelineEventsSignature(clinicalEvents),
            })
        );
        expect(
            mockTimelineWrapperContent.mock.calls[0][0]
        ).toEqual(
            expect.objectContaining({
                timelineData: augmentedEvents,
            })
        );
        expect(
            mockTimelineWrapperContent.mock.calls[0][0].timelineDataSignature
        ).toBe(augmentedEventsSignature);
    });
});

describe('tabs', () => {
    beforeEach(() => {
        mockWSIViewer.mockClear();
    });

    it('omits the Pathology Slides tab when the gate reports no viewable slides', () => {
        const pageComponent = makePageComponent();

        const tabElements = tabs(
            pageComponent as any,
            null,
            pageComponent.urlWrapper as any,
            false
        );

        expect(
            tabElements.some(
                tab => tab.props.id === PatientViewPageTabIds.WSIHESlides
            )
        ).toBe(false);
    });

    it('includes the Pathology Slides tab and forwards pathologyFilter to WSIViewer', () => {
        const pageComponent = makePageComponent(
            {},
            {
                stainFilter: 'ihc',
                sampleId: 'S-2',
                matchLevel: 'BLOCK',
                specimenKey: 'specimen::2',
            }
        );

        const tabElements = tabs(
            pageComponent as any,
            null,
            pageComponent.urlWrapper as any,
            true
        );
        const wsiTab = tabElements.find(
            tab => tab.props.id === PatientViewPageTabIds.WSIHESlides
        );

        expect(wsiTab).toBeDefined();
        expect(wsiTab!.props.linkText).toBe('Pathology Slides');
        expect(wsiTab!.props.children.props.initialStainFilter).toBe('ihc');
        expect(wsiTab!.props.children.props.preferredSampleId).toBe('S-2');
        expect(wsiTab!.props.children.props.pathologyFilter).toEqual({
            sampleId: 'S-2',
            matchLevel: 'BLOCK',
            specimenKey: 'specimen::2',
        });
    });

    it('keeps the WSI bootstrap request unfiltered for the ordinary pathology slides tab flow', () => {
        const pageComponent = makePageComponent();

        const tabElements = tabs(
            pageComponent as any,
            null,
            pageComponent.urlWrapper as any,
            true
        );
        const wsiTab = tabElements.find(
            tab => tab.props.id === PatientViewPageTabIds.WSIHESlides
        );

        expect(wsiTab).toBeDefined();
        expect(wsiTab!.props.children.props.preferredSampleId).toBe('S-1');
        expect(wsiTab!.props.children.props.pathologyFilter).toBeUndefined();
    });

    it('renders the summary timeline section even when clinical events are empty', () => {
        const pageComponent = makePageComponent({
            pageStore: {
                clinicalEvents: {
                    isComplete: true,
                    isPending: false,
                    result: [],
                },
                clinicalDataGroupedBySample: {
                    isComplete: true,
                    isPending: false,
                    result: [],
                },
                mutationMolecularProfileId: { result: 'profile' },
            },
        });

        const tabElements = tabs(
            pageComponent as any,
            {
                sampleColors: {},
                sampleLabels: {},
                sampleIndex: {},
                getActiveSampleIdsInOrder: () => [],
            } as any,
            pageComponent.urlWrapper as any,
            false
        );
        const summaryTab = tabElements.find(
            tab => tab.props.id === PatientViewPageTabIds.Summary
        );
        const summaryChildren = React.Children.toArray(summaryTab!.props.children);

        expect(
            summaryChildren.some(
                child =>
                    React.isValidElement(child) &&
                    child.type === SummaryTimelineSection
            )
        ).toBe(true);
    });

    it('renders the clinical event tables on the Clinical Data tab when clinical events are loaded', () => {
        const pageComponent = makePageComponent({
            pageStore: {
                clinicalEvents: {
                    isComplete: true,
                    isPending: false,
                    result: [
                        {
                            eventType: 'TREATMENT',
                            patientId: 'P-1',
                            studyId: 'study',
                            startNumberOfDaysSinceDiagnosis: 1,
                        },
                    ],
                },
                clinicalDataGroupedBySample: {
                    isComplete: true,
                    isPending: false,
                    result: [{ id: 'S-1' }],
                },
            },
        });

        const tabElements = tabs(
            pageComponent as any,
            {
                sampleColors: {},
                sampleLabels: {},
                sampleIndex: {},
                getActiveSampleIdsInOrder: () => ['S-1'],
            } as any,
            pageComponent.urlWrapper as any,
            false
        );
        const clinicalDataTab = tabElements.find(
            tab => tab.props.id === PatientViewPageTabIds.ClinicalData
        );

        expect(clinicalDataTab).toBeDefined();

        let renderer!: TestRenderer.ReactTestRenderer;
        act(() => {
            renderer = TestRenderer.create(<div>{clinicalDataTab!.props.children}</div>);
        });

        expect(renderer.root.findAllByType('div').some(node => node.children.includes('Clinical Events'))).toBe(true);
    });

    it('reuses one active-sample-id snapshot across tab consumers in a single build', () => {
        const getActiveSampleIdsInOrder = jest
            .fn()
            .mockReturnValue(['S-1', 'S-2']);
        const pageComponent = makePageComponent();
        Object.assign(pageComponent.patientViewPageStore, {
            sampleIds: ['S-1', 'S-2'],
            existsSomeMutationWithVAFData: true,
            mutationData: { isPending: false, isComplete: true },
            cnaSegments: { isPending: false, isComplete: true, result: [] },
            sequencedSampleIdsInStudy: {
                isPending: false,
                isComplete: true,
            },
            sampleToMutationGenePanelId: {
                isPending: false,
                isComplete: true,
                result: {},
            },
            sampleToDiscreteGenePanelId: {
                isPending: false,
                isComplete: true,
                result: {},
            },
            studies: {
                isPending: false,
                isComplete: true,
                result: [{ referenceGenome: 'hg19' }],
            },
            studyIdToStudy: { isPending: false, isComplete: true },
            oncoKbAnnotatedGenes: {
                isPending: false,
                isComplete: true,
            },
            genePanelIdToEntrezGeneIds: { isComplete: true },
            referenceGenes: { isComplete: true },
            discreteMolecularProfile: {
                isComplete: true,
                result: { molecularProfileId: 'cna' },
            },
            genePanelDataByMolecularProfileIdAndSampleId: {
                isComplete: true,
            },
            mergedMutationDataFilteredByGene: [],
            mutationMolecularProfileId: { result: 'profile' },
        });
        const sampleManager = {
            getActiveSampleIdsInOrder,
            sampleColors: {},
            sampleLabels: {},
            sampleIndex: {},
        };

        tabs(
            pageComponent as any,
            sampleManager as any,
            pageComponent.urlWrapper as any,
            false
        );

        expect(getActiveSampleIdsInOrder).toHaveBeenCalledTimes(1);
    });
});

describe('patientViewTabs', () => {
    const originalFetch = global.fetch;
    const originalRequestIdleCallback = window.requestIdleCallback;
    const originalCancelIdleCallback = window.cancelIdleCallback;

    beforeEach(() => {
        mockWarmInitialWsiSlide.mockClear();
        mockPrimeInitialWsiHierarchy.mockClear();
        mockReadWsiHashState.mockReset();
        mockReadWsiHashState.mockReturnValue(undefined);
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () =>
                makeHierarchy({
                    'S-1': [makeSlide()],
                }),
        }) as typeof fetch;
        window.requestIdleCallback = ((cb: IdleRequestCallback) => {
            cb({ didTimeout: false, timeRemaining: () => 1 } as IdleDeadline);
            return 1;
        }) as typeof window.requestIdleCallback;
        window.cancelIdleCallback = jest.fn() as typeof window.cancelIdleCallback;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        window.requestIdleCallback = originalRequestIdleCallback;
        window.cancelIdleCallback = originalCancelIdleCallback;
    });

    it('warms the initial WSI slide using the active pathology filter and hash-selected slide', async () => {
        mockReadWsiHashState.mockReturnValue({ slideId: '99' });
        const pageComponent = makePageComponent(
            {},
            {
                stainFilter: 'ihc',
                sampleId: 'S-2',
                matchLevel: 'BLOCK',
                specimenKey: 'specimen::2',
            }
        );

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                patientViewTabs(
                    pageComponent as any,
                    pageComponent.urlWrapper as any,
                    null
                ) as any
            );
            await Promise.resolve();
        });

        expect(mockWarmInitialWsiSlide).toHaveBeenCalledWith({
            tileServerUrl: 'https://slides.example.com',
            hierarchyUrl:
                'https://slides.example.com/patient/P-1?studyId=study',
            studyId: 'study',
            preferredSlideId: '99',
            stainFilter: 'ihc',
            pathologyFilter: {
                sampleId: 'S-2',
                matchLevel: 'BLOCK',
                specimenKey: 'specimen::2',
            },
        });
        expect(mockPrimeInitialWsiHierarchy).toHaveBeenCalledWith({
            tileServerUrl: 'https://slides.example.com',
            hierarchyUrl:
                'https://slides.example.com/patient/P-1?studyId=study',
        });

        renderer!.unmount();
    });

    it('keeps pathology bootstrap patient-scoped when a sample-specific pathology filter is active', async () => {
        const pageComponent = makePageComponent(
            {},
            {
                stainFilter: 'hne',
                sampleId: 'S-2',
                matchLevel: 'PART',
                specimenKey: 'specimen::2',
            }
        );

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                patientViewTabs(
                    pageComponent as any,
                    pageComponent.urlWrapper as any,
                    null
                ) as any
            );
            await Promise.resolve();
        });

        expect(mockWarmInitialWsiSlide).toHaveBeenCalledWith({
            tileServerUrl: 'https://slides.example.com',
            hierarchyUrl:
                'https://slides.example.com/patient/P-1?studyId=study',
            studyId: 'study',
            preferredSlideId: undefined,
            stainFilter: 'hne',
            pathologyFilter: {
                sampleId: 'S-2',
                matchLevel: 'PART',
                specimenKey: 'specimen::2',
            },
        });
        expect(mockPrimeInitialWsiHierarchy).toHaveBeenCalledWith({
            tileServerUrl: 'https://slides.example.com',
            hierarchyUrl:
                'https://slides.example.com/patient/P-1?studyId=study',
        });

        renderer!.unmount();
    });

    it('keeps pathology bootstrap patient-scoped even when the requested sample is missing from the loaded sample list', async () => {
        const pageComponent = makePageComponent(
            {
                pageStore: {
                    clinicalDataGroupedBySample: {
                        isComplete: true,
                        isPending: false,
                        result: [{ id: 'S-1' }],
                    },
                },
            },
            {
                stainFilter: 'hne',
                sampleId: 'S-2',
                matchLevel: 'PART',
                specimenKey: 'specimen::2',
            }
        );

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                patientViewTabs(
                    pageComponent as any,
                    pageComponent.urlWrapper as any,
                    null
                ) as any
            );
            await Promise.resolve();
        });

        expect(mockWarmInitialWsiSlide).toHaveBeenCalledWith({
            tileServerUrl: 'https://slides.example.com',
            hierarchyUrl:
                'https://slides.example.com/patient/P-1?studyId=study',
            studyId: 'study',
            preferredSlideId: undefined,
            stainFilter: 'hne',
            pathologyFilter: {
                sampleId: 'S-2',
                matchLevel: 'PART',
                specimenKey: 'specimen::2',
            },
        });
        expect(mockPrimeInitialWsiHierarchy).toHaveBeenCalledWith({
            tileServerUrl: 'https://slides.example.com',
            hierarchyUrl:
                'https://slides.example.com/patient/P-1?studyId=study',
        });

        renderer!.unmount();
    });

    it('warms the ordinary patient flow without sample-scoping the bootstrap request', async () => {
        const pageComponent = makePageComponent({}, { sampleId: undefined });

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                patientViewTabs(
                    pageComponent as any,
                    pageComponent.urlWrapper as any,
                    null
                ) as any
            );
            await Promise.resolve();
        });

        expect(mockWarmInitialWsiSlide).toHaveBeenCalledWith({
            tileServerUrl: 'https://slides.example.com',
            hierarchyUrl:
                'https://slides.example.com/patient/P-1?studyId=study',
            studyId: 'study',
            preferredSlideId: undefined,
            stainFilter: 'all',
            pathologyFilter: undefined,
        });
        expect(mockPrimeInitialWsiHierarchy).toHaveBeenCalledWith({
            tileServerUrl: 'https://slides.example.com',
            hierarchyUrl:
                'https://slides.example.com/patient/P-1?studyId=study',
        });

        renderer!.unmount();
    });

    it('does not warm the initial WSI slide when the pathology slides tab is already active', async () => {
        const pageComponent = makePageComponent();
        pageComponent.urlWrapper.activeTabId = PatientViewPageTabIds.WSIHESlides;
        pageComponent.urlWrapper.routing.location.pathname =
            '/patient/wsiHESlides';

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                patientViewTabs(
                    pageComponent as any,
                    pageComponent.urlWrapper as any,
                    null
                ) as any
            );
            await Promise.resolve();
        });

        expect(mockWarmInitialWsiSlide).not.toHaveBeenCalled();
        expect(mockPrimeInitialWsiHierarchy).not.toHaveBeenCalled();

        renderer!.unmount();
    });

    it('does not re-warm the viewer when equivalent pathology bootstrap inputs rerender with new references', async () => {
        const firstPageComponent = makePageComponent(
            {},
            {
                stainFilter: 'ihc',
                sampleId: 'S-2',
                matchLevel: 'BLOCK',
                specimenKey: 'specimen::2',
            }
        );

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                patientViewTabs(
                    firstPageComponent as any,
                    firstPageComponent.urlWrapper as any,
                    null
                ) as any
            );
            await Promise.resolve();
        });

        expect(mockWarmInitialWsiSlide).toHaveBeenCalledTimes(1);

        const secondPageComponent = makePageComponent(
            {},
            {
                stainFilter: 'ihc',
                sampleId: 'S-2',
                matchLevel: 'BLOCK',
                specimenKey: 'specimen::2',
            }
        );
        secondPageComponent.patientViewPageStore.clinicalDataGroupedBySample = {
            isComplete: true,
            isPending: false,
            result: [{ id: 'S-2' }, { id: 'S-1' }],
        };

        await act(async () => {
            renderer!.update(
                patientViewTabs(
                    secondPageComponent as any,
                    secondPageComponent.urlWrapper as any,
                    null
                ) as any
            );
            await Promise.resolve();
        });

        expect(mockWarmInitialWsiSlide).toHaveBeenCalledTimes(1);

        renderer!.unmount();
    });

    it('does not re-warm the ordinary patient flow when only the preferred sample changes', async () => {
        const firstPageComponent = makePageComponent({}, { sampleId: 'S-1' });

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                patientViewTabs(
                    firstPageComponent as any,
                    firstPageComponent.urlWrapper as any,
                    null
                ) as any
            );
            await Promise.resolve();
        });

        expect(mockWarmInitialWsiSlide).toHaveBeenCalledTimes(1);

        const secondPageComponent = makePageComponent({}, { sampleId: 'S-2' });

        await act(async () => {
            renderer!.update(
                patientViewTabs(
                    secondPageComponent as any,
                    secondPageComponent.urlWrapper as any,
                    null
                ) as any
            );
            await Promise.resolve();
        });

        expect(mockWarmInitialWsiSlide).toHaveBeenCalledTimes(1);

        renderer!.unmount();
    });
});
