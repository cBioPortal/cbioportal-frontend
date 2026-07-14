import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ClinicalDataBySampleId, ClinicalEvent } from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';
import {
    clearPathologyTimelineEventsCache,
    fetchPathologyTimelineEvents,
} from './pathologyTimelineUtils';
import { clearPatientHierarchyCache } from 'shared/components/wsiViewer/wsiHierarchyFetchCache';
import usePathologyAugmentedClinicalEvents from './usePathologyAugmentedClinicalEvents';

function makeSlide() {
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
    };
}

function makeClinicalSample(sampleId: string): ClinicalDataBySampleId {
    return {
        id: sampleId,
        uniquePatientKey: 'patient-key',
        uniqueSampleKey: 'sample-key',
        clinicalData: [
            { clinicalAttributeId: 'WSI_TIMEPOINT_DAYS', value: '-5' },
            {
                clinicalAttributeId: 'WSI_TIMEPOINT_SOURCE',
                value: 'Biopsy',
            },
        ],
    } as unknown as ClinicalDataBySampleId;
}

const samples = [makeClinicalSample('S-1')];
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
        errorMessage: 'failed',
        patientId: hookPatientId,
        samples: hookSamples,
        studyId: hookStudyId,
    });
    onEvents?.(events);

    return <div>{events.length}</div>;
}

describe('usePathologyAugmentedClinicalEvents', () => {
    const savedTileServerBase = (getServerConfig() as any).msk_wsi_tile_server_url;
    const originalFetch = global.fetch;

    beforeEach(() => {
        clearPatientHierarchyCache();
        clearPathologyTimelineEventsCache();
        (getServerConfig() as any).msk_wsi_tile_server_url =
            'https://slides.example.com';
    });

    afterEach(() => {
        (getServerConfig() as any).msk_wsi_tile_server_url = savedTileServerBase;
        global.fetch = originalFetch;
    });

    it('returns cached pathology augmentation immediately without refetching', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
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
                                part_description: '',
                                subspecialty: '',
                                path_dx_title: '',
                                blocks: [
                                    {
                                        block_number: '1',
                                        block_label: 'A1',
                                        slides: [makeSlide()],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }),
        }) as typeof fetch;

        await act(async () => {
            await fetchPathologyTimelineEvents(
                'https://slides.example.com',
                'P-1',
                'study',
                samples
            );
        });

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(<HookProbe />);
        });

        expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
        expect(renderer!.root.findByType('div').children).toEqual(['2']);
    });

    it('does not refetch when the samples array identity changes but timing content is unchanged', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
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
                                part_description: '',
                                subspecialty: '',
                                path_dx_title: '',
                                blocks: [
                                    {
                                        block_number: '1',
                                        block_label: 'A1',
                                        slides: [makeSlide()],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }),
        }) as typeof fetch;

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(<HookProbe />);
        });

        expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
        expect(renderer!.root.findByType('div').children).toEqual(['2']);

        const clonedSamples = samples.map(sample => ({
            ...sample,
            clinicalData: [...sample.clinicalData],
        })) as ClinicalDataBySampleId[];

        await act(async () => {
            renderer!.update(<HookProbe hookSamples={clonedSamples} />);
        });

        expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
        expect(renderer!.root.findByType('div').children).toEqual(['2']);
    });

    it('switches to a different warm pathology context without showing stale results first', async () => {
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
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
                                    part_description: '',
                                    subspecialty: '',
                                    path_dx_title: '',
                                    blocks: [
                                        {
                                            block_number: '1',
                                            block_label: 'A1',
                                            slides: [makeSlide()],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    patient_id: 'P-2',
                    samples: [
                        {
                            sample_id: 'S-2',
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
                                            slides: [makeSlide()],
                                        },
                                        {
                                            block_number: '2',
                                            block_label: 'A2',
                                            slides: [
                                                {
                                                    ...makeSlide(),
                                                    image_id: '2',
                                                    stain_name: 'PD-L1',
                                                    stain_group: 'IHC',
                                                    is_hne: false,
                                                    is_ihc: true,
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                }),
            }) as typeof fetch;

        const warmSamplesTwo = [makeClinicalSample('S-2')];
        const warmEventsOne = clinicalEvents;
        const warmEventsTwo = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-2',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
            },
        ] as ClinicalEvent[];

        await act(async () => {
            await fetchPathologyTimelineEvents(
                'https://slides.example.com',
                'P-1',
                'study',
                samples
            );
            await fetchPathologyTimelineEvents(
                'https://slides.example.com',
                'P-2',
                'study',
                warmSamplesTwo
            );
        });

        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <HookProbe
                    hookClinicalEvents={warmEventsOne}
                    hookPatientId="P-1"
                    hookSamples={samples}
                />
            );
        });

        expect(renderer!.root.findByType('div').children).toEqual(['2']);

        await act(async () => {
            renderer!.update(
                <HookProbe
                    hookClinicalEvents={warmEventsTwo}
                    hookPatientId="P-2"
                    hookSamples={warmSamplesTwo}
                />
            );
        });

        expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(2);
        expect(renderer!.root.findByType('div').children).toEqual(['3']);
    });

    it('keeps the warm cached augmented events reference stable across harmless rerenders', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
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
                                part_description: '',
                                subspecialty: '',
                                path_dx_title: '',
                                blocks: [
                                    {
                                        block_number: '1',
                                        block_label: 'A1',
                                        slides: [makeSlide()],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }),
        }) as typeof fetch;

        await act(async () => {
            await fetchPathologyTimelineEvents(
                'https://slides.example.com',
                'P-1',
                'study',
                samples
            );
        });

        const seenEvents: ClinicalEvent[][] = [];
        let renderer: TestRenderer.ReactTestRenderer;
        await act(async () => {
            renderer = TestRenderer.create(
                <HookProbe onEvents={events => seenEvents.push(events)} />
            );
        });

        const firstEvents = seenEvents[seenEvents.length - 1];
        expect(firstEvents).toBeDefined();

        await act(async () => {
            renderer!.update(
                <HookProbe onEvents={events => seenEvents.push(events)} />
            );
        });

        const secondEvents = seenEvents[seenEvents.length - 1];
        expect(secondEvents).toBe(firstEvents);
        expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
    });
});
