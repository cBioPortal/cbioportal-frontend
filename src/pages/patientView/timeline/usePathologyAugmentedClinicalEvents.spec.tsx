import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import usePathologyAugmentedClinicalEvents, {
    usePathologyAugmentedClinicalEventsState,
} from './usePathologyAugmentedClinicalEvents';
import * as config from 'config/config';
import { clearPatientHierarchyCache } from 'shared/components/wsiViewer/wsiHierarchyFetchCache';

const samples = [
    ({
        id: 'S-1',
        uniquePatientKey: 'patient-key',
        uniqueSampleKey: 'sample-key',
        clinicalData: [],
    } as unknown) as ClinicalDataBySampleId,
];

const clinicalEvents = [
    {
        eventType: 'TREATMENT',
        patientId: 'P-1',
        startNumberOfDaysSinceDiagnosis: 1,
        studyId: 'study',
    },
] as ClinicalEvent[];

function HookProbe({
    hookSamples = samples,
    hookClinicalEvents = clinicalEvents,
    hookPatientId = 'P-1',
    hookStudyId = 'study',
    onEvents,
}: {
    hookSamples?: ClinicalDataBySampleId[];
    hookClinicalEvents?: ClinicalEvent[];
    hookPatientId?: string;
    hookStudyId?: string;
    onEvents?: (events: ClinicalEvent[]) => void;
}) {
    const events = usePathologyAugmentedClinicalEvents({
        clinicalEvents: hookClinicalEvents,
        patientId: hookPatientId,
        samples: hookSamples,
        studyId: hookStudyId,
    });
    onEvents?.(events);

    return <div>{events.length}</div>;
}

describe('usePathologyAugmentedClinicalEvents', () => {
    it('returns backend clinical events unchanged when no backend pathology events are present', async () => {
        let renderedEvents: ClinicalEvent[] = [];
        let renderer: TestRenderer.ReactTestRenderer;

        await act(async () => {
            renderer = TestRenderer.create(
                <HookProbe onEvents={events => (renderedEvents = events)} />
            );
        });

        expect(renderedEvents).toBe(clinicalEvents);
        expect(renderer!.root.findByType('div').children).toEqual(['1']);
    });

    it('retains backend WSI pathology events before hierarchy loading', async () => {
        const backendPathologyEvents = [
            clinicalEvents[0],
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: -5,
                endNumberOfDaysSinceDiagnosis: -5,
                studyId: 'study',
                uniquePatientKey: 'study_P-1',
                uniqueSampleKey: 'study_P-1_pathology',
                attributes: [
                    { key: 'SAMPLE_ID', value: 'S-1' },
                    { key: 'SUBTYPE', value: 'H&E' },
                    { key: 'MATCH_LEVEL', value: 'BLOCK' },
                    { key: 'SPECIMEN', value: 'Part 1 / Block A1' },
                    { key: 'IMAGE_COUNT', value: '1' },
                    { key: 'NON_SERVABLE_IMAGE_COUNT', value: '0' },
                    { key: 'TOTAL_IMAGE_COUNT', value: '1' },
                ],
            },
        ] as ClinicalEvent[];

        let renderedEvents: ClinicalEvent[] = [];
        let renderer: TestRenderer.ReactTestRenderer;

        await act(async () => {
            renderer = TestRenderer.create(
                <HookProbe
                    hookClinicalEvents={backendPathologyEvents}
                    onEvents={events => (renderedEvents = events)}
                />
            );
        });

        expect(renderedEvents).toEqual(backendPathologyEvents);
        expect(renderer!.root.findByType('div').children).toEqual(['2']);
    });

    it('refreshes backend WSI pathology counts from the current hierarchy', async () => {
        const backendPathologyEvents = [
            clinicalEvents[0],
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: -5,
                endNumberOfDaysSinceDiagnosis: -5,
                studyId: 'study',
                uniquePatientKey: 'study_P-1',
                uniqueSampleKey: 'study_P-1_pathology',
                attributes: [
                    { key: 'SAMPLE_ID', value: 'S-1' },
                    { key: 'SUBTYPE', value: 'H&E' },
                    { key: 'MATCH_LEVEL', value: 'BLOCK' },
                    { key: 'SPECIMEN', value: 'Part 1 / Block A1' },
                    { key: 'IMAGE_COUNT', value: '1' },
                    { key: 'NON_SERVABLE_IMAGE_COUNT', value: '0' },
                    { key: 'TOTAL_IMAGE_COUNT', value: '1' },
                ],
            },
        ] as ClinicalEvent[];
        const hierarchy = {
            patient_id: 'P-1',
            samples: [
                {
                    sample_id: 'S-1',
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
                            part_description: 'Breast',
                            subspecialty: '',
                            path_dx_title: '',
                            blocks: [
                                {
                                    block_number: 'S16-10037/1-3TLN',
                                    block_label: '3TLN',
                                    slides: [
                                        {
                                            image_id: 'image-1',
                                            stain_name: 'H&E',
                                            stain_group: 'H&E (Initial)',
                                            is_hne: true,
                                            is_ihc: false,
                                            magnification: '',
                                            file_size_bytes: '',
                                            can_serve_tiles: true,
                                            barcode: '',
                                            block_label: '3TLN',
                                            block_number: 'S16-10037/1-3TLN',
                                        },
                                        {
                                            image_id: 'image-2',
                                            stain_name: 'H&E',
                                            stain_group: 'H&E (Initial)',
                                            is_hne: true,
                                            is_ihc: false,
                                            magnification: '',
                                            file_size_bytes: '',
                                            can_serve_tiles: true,
                                            barcode: '',
                                            block_label: '3TLN',
                                            block_number: 'S16-10037/1-3TLN',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
            slide_associations: [
                {
                    image_id: 'image-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK' as const,
                    specimen_key: 'block::part:1::block:S16-10037/1-3TLN',
                    part_number: '1',
                    block_number: 'S16-10037/1-3TLN',
                    block_label: '3TLN',
                    slide_type: 'H&E' as const,
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'image-2',
                    sample_id: 'S-1',
                    match_level: 'BLOCK' as const,
                    specimen_key: 'block::part:1::block:S16-10037/1-3TLN',
                    part_number: '1',
                    block_number: 'S16-10037/1-3TLN',
                    block_label: '3TLN',
                    slide_type: 'H&E' as const,
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
        };
        const getServerConfig = jest
            .spyOn(config, 'getServerConfig')
            .mockReturnValue(({
                msk_wsi_tile_server_url: 'https://tiles.example.org',
                msk_wsi_authentication_enabled: false,
            } as unknown) as ReturnType<typeof config.getServerConfig>);
        const originalFetch = global.fetch;
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => hierarchy,
        } as Response);
        global.fetch = fetchMock as typeof fetch;
        let renderedEvents: ClinicalEvent[] = [];

        try {
            await act(async () => {
                TestRenderer.create(
                    <HookProbe
                        hookClinicalEvents={backendPathologyEvents}
                        onEvents={events => (renderedEvents = events)}
                    />
                );
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(renderedEvents).not.toContain(backendPathologyEvents[1]);
            const pathologyEvent = renderedEvents.find(
                event => event.eventType === 'PATHOLOGY SLIDES'
            );
            expect(pathologyEvent?.attributes).toEqual(
                expect.arrayContaining([
                    { key: 'IMAGE_COUNT', value: '2' },
                    { key: 'TOTAL_IMAGE_COUNT', value: '2' },
                ])
            );
        } finally {
            global.fetch = originalFetch;
            getServerConfig.mockRestore();
            clearPatientHierarchyCache();
        }
    });

    it('removes backend WSI events when the authoritative hierarchy is empty', async () => {
        clearPatientHierarchyCache();
        const backendPathologyEvents = [
            ...clinicalEvents,
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                studyId: 'study',
                attributes: [
                    { key: 'SUBTYPE', value: 'H&E' },
                    { key: 'IMAGE_COUNT', value: '1' },
                    { key: 'NON_SERVABLE_IMAGE_COUNT', value: '0' },
                ],
            },
        ] as ClinicalEvent[];
        const getServerConfig = jest
            .spyOn(config, 'getServerConfig')
            .mockReturnValue(({
                msk_wsi_tile_server_url: 'https://tiles.example.org',
            } as unknown) as ReturnType<typeof config.getServerConfig>);
        const originalFetch = global.fetch;
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ patient_id: 'P-1', samples: [] }),
        } as Response) as typeof fetch;
        let renderedEvents: ClinicalEvent[] = [];

        try {
            await act(async () => {
                TestRenderer.create(
                    <HookProbe
                        hookClinicalEvents={backendPathologyEvents}
                        onEvents={events => (renderedEvents = events)}
                    />
                );
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(renderedEvents).toEqual(clinicalEvents);
        } finally {
            global.fetch = originalFetch;
            getServerConfig.mockRestore();
            clearPatientHierarchyCache();
        }
    });
});

describe('usePathologyAugmentedClinicalEventsState', () => {
    it('augments base events from association-backed hierarchy data', async () => {
        const hierarchy = {
            patient_id: 'P-1',
            samples: [
                {
                    sample_id: 'S-1',
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
                            part_description: 'Breast',
                            subspecialty: '',
                            path_dx_title: '',
                            blocks: [
                                {
                                    block_number: '1',
                                    block_label: 'A1',
                                    slides: [
                                        {
                                            image_id: 'image-1',
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
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
            slide_associations: [
                {
                    image_id: 'image-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK' as const,
                    specimen_key: 'block::1::1',
                    slide_type: 'H&E' as const,
                    procedure_date_days: -1,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
        };
        const getServerConfig = jest
            .spyOn(config, 'getServerConfig')
            .mockReturnValue(({
                msk_wsi_tile_server_url: 'https://tiles.example.org',
                msk_wsi_authentication_enabled: false,
            } as unknown) as ReturnType<typeof config.getServerConfig>);
        const originalFetch = global.fetch;
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => hierarchy,
        } as Response);
        global.fetch = fetchMock;
        let renderedEvents: ClinicalEvent[] = [];

        await act(async () => {
            TestRenderer.create(
                <HookProbe onEvents={events => (renderedEvents = events)} />
            );
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(renderedEvents.map(event => event.eventType)).toEqual([
            'PATHOLOGY SLIDES',
            'TREATMENT',
        ]);
        expect(renderedEvents[0].attributes).toEqual(
            expect.arrayContaining([
                { key: 'IMAGE_COUNT', value: '1' },
                { key: 'MATCH_LEVEL', value: 'BLOCK' },
            ])
        );
        global.fetch = originalFetch;
        getServerConfig.mockRestore();
        clearPatientHierarchyCache();
    });

    it('keeps base clinical events when hierarchy loading fails', async () => {
        clearPatientHierarchyCache();
        const getServerConfig = jest
            .spyOn(config, 'getServerConfig')
            .mockReturnValue(({
                msk_wsi_tile_server_url: 'https://tiles.example.org',
                msk_wsi_authentication_enabled: false,
            } as unknown) as ReturnType<typeof config.getServerConfig>);
        const originalFetch = global.fetch;
        global.fetch = jest
            .fn()
            .mockRejectedValue(
                new Error('hierarchy unavailable')
            ) as typeof fetch;
        const backendPathologyEvents = [
            ...clinicalEvents,
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                studyId: 'study',
                attributes: [
                    { key: 'SUBTYPE', value: 'H&E' },
                    { key: 'IMAGE_COUNT', value: '1' },
                    { key: 'NON_SERVABLE_IMAGE_COUNT', value: '0' },
                ],
            },
        ] as ClinicalEvent[];
        let renderedEvents: ClinicalEvent[] = [];

        try {
            await act(async () => {
                TestRenderer.create(
                    <HookProbe
                        hookClinicalEvents={backendPathologyEvents}
                        onEvents={events => (renderedEvents = events)}
                    />
                );
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(renderedEvents).toEqual(backendPathologyEvents);
            expect(
                renderedEvents.some(
                    event => event.eventType === 'PATHOLOGY SLIDES'
                )
            ).toBe(true);
        } finally {
            global.fetch = originalFetch;
            getServerConfig.mockRestore();
            clearPatientHierarchyCache();
        }
    });

    it('does not let a stale hierarchy response replace events for a new patient', async () => {
        clearPatientHierarchyCache();
        const getServerConfig = jest
            .spyOn(config, 'getServerConfig')
            .mockReturnValue(({
                msk_wsi_tile_server_url: 'https://tiles.example.org',
                msk_wsi_authentication_enabled: false,
            } as unknown) as ReturnType<typeof config.getServerConfig>);
        const originalFetch = global.fetch;
        const resolvers: Array<(response: Response) => void> = [];
        global.fetch = jest.fn().mockImplementation(
            () =>
                new Promise<Response>(resolve => {
                    resolvers.push(resolve);
                })
        ) as typeof fetch;
        const nextClinicalEvents = [
            {
                ...clinicalEvents[0],
                patientId: 'P-2',
                studyId: 'study-2',
            },
        ] as ClinicalEvent[];
        const hierarchy = {
            patient_id: 'P-1',
            samples: [
                {
                    sample_id: 'S-1',
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
                            part_description: 'Breast',
                            subspecialty: '',
                            path_dx_title: '',
                            blocks: [
                                {
                                    block_number: '1',
                                    block_label: 'A1',
                                    slides: [
                                        {
                                            image_id: 'image-1',
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
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
            slide_associations: [
                {
                    image_id: 'image-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK' as const,
                    specimen_key: 'block::1::1',
                    slide_type: 'H&E' as const,
                    procedure_date_days: -1,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
        };
        let renderedEvents: ClinicalEvent[] = [];
        let renderer: TestRenderer.ReactTestRenderer;

        try {
            await act(async () => {
                renderer = TestRenderer.create(
                    <HookProbe
                        hookPatientId="P-1"
                        hookStudyId="study-1"
                        onEvents={events => (renderedEvents = events)}
                    />
                );
                await Promise.resolve();
            });

            await act(async () => {
                renderer!.update(
                    <HookProbe
                        hookClinicalEvents={nextClinicalEvents}
                        hookPatientId="P-2"
                        hookStudyId="study-2"
                        onEvents={events => (renderedEvents = events)}
                    />
                );
                await Promise.resolve();
            });

            expect(resolvers).toHaveLength(2);
            resolvers[0]({
                ok: true,
                json: async () => hierarchy,
            } as Response);

            await act(async () => {
                await Promise.resolve();
                await Promise.resolve();
            });

            expect(renderedEvents).toBe(nextClinicalEvents);
            renderer!.unmount();
        } finally {
            global.fetch = originalFetch;
            getServerConfig.mockRestore();
            clearPatientHierarchyCache();
        }
    });

    it('returns the provided signature when one is supplied', () => {
        let state:
            | ReturnType<typeof usePathologyAugmentedClinicalEventsState>
            | undefined;

        function Probe() {
            state = usePathologyAugmentedClinicalEventsState({
                clinicalEvents,
                clinicalEventsSignature: 'provided-signature',
                patientId: 'P-1',
                samples,
                studyId: 'study',
            });
            return null;
        }

        act(() => {
            TestRenderer.create(<Probe />);
        });

        expect(state!.events).toBe(clinicalEvents);
        expect(state!.eventsSignature).toBe('provided-signature');
    });

    it('computes a stable signature from backend clinical events when none is provided', () => {
        let state:
            | ReturnType<typeof usePathologyAugmentedClinicalEventsState>
            | undefined;

        function Probe() {
            state = usePathologyAugmentedClinicalEventsState({
                clinicalEvents,
                patientId: 'P-1',
                samples,
                studyId: 'study',
            });
            return null;
        }

        act(() => {
            TestRenderer.create(<Probe />);
        });

        expect(state!.events).toBe(clinicalEvents);
        expect(state!.eventsSignature).toBeTruthy();
    });
});
