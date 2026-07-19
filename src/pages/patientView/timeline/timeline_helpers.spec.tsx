import React from 'react';
import TestRenderer from 'react-test-renderer';
import { assert } from 'chai';
import {
    TimelineEvent,
    TimelineTrackSpecification,
} from 'cbioportal-clinical-timeline';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import {
    allResultValuesAreNumerical,
    buildBaseConfig,
    renderPathologyCountBadge,
    renderPathologyTooltip,
    sortTracks,
} from 'pages/patientView/timeline/timeline_helpers';

const PATHOLOGY_NON_VIEWABLE_FILL = '#7a7a7a';

jest.mock('react-markdown', () => ({
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) => (
        <>{children}</>
    ),
}));

function renderSampleTooltipRows(args: {
    eventAttributes: Array<{ key: string; value: string }>;
    clinicalData?: Array<{ clinicalAttributeId: string; value: string }>;
    sampleId?: string;
}) {
    const renderText = (node: any): string => {
        if (typeof node === 'string') {
            return node;
        }
        if (typeof node === 'number') {
            return String(node);
        }
        if (!node || !node.children) {
            return '';
        }
        return node.children.map(renderText).join('');
    };

    const sampleId = args.sampleId || 'S-1';
    const sampleManager = {
        samples: [
            {
                id: sampleId,
                clinicalData: args.clinicalData || [],
            },
        ],
    } as any;
    const config = buildBaseConfig(sampleManager, {
        color: { [sampleId]: '#123456' },
        index: { [sampleId]: 0 },
        label: { [sampleId]: '1' },
    });
    const specimenRenderer = config.trackEventRenderers!.find(renderer =>
        renderer.trackTypeMatch.test('SPECIMEN')
    )!;
    const track = {
        items: [],
        type: 'SPECIMEN',
        uid: 'specimen-track',
    } as TimelineTrackSpecification;
    specimenRenderer.configureTrack(track);
    const event = {
        start: 5,
        end: 5,
        event: {
            patientId: 'P-1',
            startNumberOfDaysSinceDiagnosis: 5,
            studyId: 'study',
            uniquePatientKey: 'study_P-1',
            eventType: 'SPECIMEN',
            attributes: args.eventAttributes,
        },
        containingTrack: track,
    } as TimelineEvent;

    const renderer = TestRenderer.create(
        <div>{track.renderTooltip!(event)}</div>
    );
    const rows = renderer.root.findAllByType('tr').map(row => {
        const cells = row.findAllByType('td').map(cell => renderText(cell));
        const headers = row.findAllByType('th').map(cell => renderText(cell));
        return {
            header: (headers[0] || '').trim(),
            value: (cells[0] || '').trim(),
        };
    });
    return rows;
}

describe('sample timeline tooltip attributes', () => {
    it('hides WSI implementation attributes and the duplicate sample ID', () => {
        const rows = renderSampleTooltipRows({
            eventAttributes: [
                { key: 'SAMPLE_ID', value: 'S-1' },
                { key: 'SPECIMEN_TYPE', value: 'Biopsy' },
                { key: 'HAS_WSI_SLIDE', value: 'true' },
                { key: 'WSI_TIMEPOINT', value: 'legacy' },
            ],
            clinicalData: [
                { clinicalAttributeId: 'WSI_TIMEPOINT_DAYS', value: '-10' },
                {
                    clinicalAttributeId: 'WSI_TIMEPOINT_SOURCE',
                    value: 'Biopsy',
                },
                { clinicalAttributeId: 'WSI_SLIDE_DATE', value: '2026-07-01' },
            ],
        });

        assert.deepEqual(rows, [
            { header: 'SAMPLE ID', value: 'S-1' },
            { header: 'SPECIMEN TYPE', value: 'Biopsy' },
            { header: 'START DATE', value: '5 days' },
        ]);
    });

    it('keeps ordinary sample clinical attributes', () => {
        const rows = renderSampleTooltipRows({
            eventAttributes: [
                { key: 'SAMPLE_ID', value: 'S-1' },
                { key: 'SPECIMEN_TYPE', value: 'Biopsy' },
            ],
            clinicalData: [
                { clinicalAttributeId: 'CANCER_TYPE', value: 'Breast Cancer' },
            ],
        });

        assert.deepEqual(rows, [
            { header: 'SAMPLE ID', value: 'S-1' },
            { header: 'CANCER TYPE', value: 'Breast Cancer' },
            { header: 'SPECIMEN TYPE', value: 'Biopsy' },
            { header: 'START DATE', value: '5 days' },
        ]);
    });

    it('renders stable sample tooltip content for the same warm event and sample', () => {
        const first = renderSampleTooltipRows({
            eventAttributes: [
                { key: 'SAMPLE_ID', value: 'S-1' },
                { key: 'SPECIMEN_TYPE', value: 'Biopsy' },
            ],
            clinicalData: [
                { clinicalAttributeId: 'CANCER_TYPE', value: 'Breast Cancer' },
            ],
        });
        const second = renderSampleTooltipRows({
            eventAttributes: [
                { key: 'SAMPLE_ID', value: 'S-1' },
                { key: 'SPECIMEN_TYPE', value: 'Biopsy' },
            ],
            clinicalData: [
                { clinicalAttributeId: 'CANCER_TYPE', value: 'Breast Cancer' },
            ],
        });

        assert.deepEqual(second, first);
    });

    it('rebuilds rendered sample tooltip content when event or clinical attrs mutate in place', () => {
        const eventAttributes = [
            { key: 'SAMPLE_ID', value: 'S-1' },
            { key: 'SPECIMEN_TYPE', value: 'Biopsy' },
        ];
        const clinicalData = [
            { clinicalAttributeId: 'CANCER_TYPE', value: 'Breast Cancer' },
        ];

        const first = renderSampleTooltipRows({
            eventAttributes,
            clinicalData,
        });

        eventAttributes[1].value = 'Resection';
        clinicalData[0].value = 'Lung Cancer';

        const second = renderSampleTooltipRows({
            eventAttributes,
            clinicalData,
        });

        assert.notDeepEqual(second, first);
        assert.deepEqual(second, [
            { header: 'SAMPLE ID', value: 'S-1' },
            { header: 'CANCER TYPE', value: 'Lung Cancer' },
            { header: 'SPECIMEN TYPE', value: 'Resection' },
            { header: 'START DATE', value: '5 days' },
        ]);
    });
});

describe('pathology timeline structure', () => {
    it('nests slides and biomarkers under pathology', () => {
        const config = buildBaseConfig({} as any, {} as any);

        assert.deepEqual(
            config.trackStructures?.find(
                structure => structure[0] === 'PATHOLOGY'
            ),
            ['PATHOLOGY', 'PATHOLOGY_TYPE', 'SUBTYPE']
        );
    });
});

describe('buildBaseConfig', () => {
    it('returns isolated config clones for equivalent sample-manager and case-metadata inputs', () => {
        const firstSampleManager = {
            samples: [
                {
                    id: 'S-1',
                    clinicalData: [
                        {
                            clinicalAttributeId: 'CANCER_TYPE',
                            value: 'Breast Cancer',
                        },
                    ],
                },
            ],
        } as any;
        const secondSampleManager = {
            samples: [
                {
                    id: 'S-1',
                    clinicalData: [
                        {
                            clinicalAttributeId: 'CANCER_TYPE',
                            value: 'Breast Cancer',
                        },
                    ],
                },
            ],
        } as any;
        const firstCaseMetaData = {
            color: { 'S-1': '#123456' },
            index: { 'S-1': 0 },
            label: { 'S-1': '1' },
        };
        const secondCaseMetaData = {
            color: { 'S-1': '#123456' },
            index: { 'S-1': 0 },
            label: { 'S-1': '1' },
        };

        const first = buildBaseConfig(firstSampleManager, firstCaseMetaData);
        first.sortOrder!.push('Mutated');
        first.trackStructures![0].push('MUTATED');
        first.trackEventRenderers!.push({
            trackTypeMatch: /MUTATED/i,
            configureTrack: () => undefined,
        });

        const second = buildBaseConfig(secondSampleManager, secondCaseMetaData);

        assert.notStrictEqual(second, first);
        assert.notInclude(second.sortOrder!, 'Mutated');
        assert.notInclude(second.trackStructures![0], 'MUTATED');
        assert.equal(second.trackEventRenderers!.length + 1, first.trackEventRenderers!.length);
    });

    it('renders sample timeline tooltips without React key warnings', () => {
        const sampleManager = {
            samples: [
                {
                    id: 'S-1',
                    clinicalData: [
                        {
                            clinicalAttributeId: 'CANCER_TYPE',
                            value: 'Breast Cancer',
                        },
                        {
                            clinicalAttributeId: 'SPECIMEN_TYPE',
                            value: 'Biopsy',
                        },
                    ],
                },
            ],
        } as any;
        const config = buildBaseConfig(sampleManager, {
            color: { 'S-1': '#123456' },
            index: { 'S-1': 0 },
            label: { 'S-1': '1' },
        });
        const specimenRenderer = config.trackEventRenderers!.find(renderer =>
            renderer.trackTypeMatch.test('SPECIMEN')
        )!;
        const track = {
            items: [],
            type: 'SPECIMEN',
            uid: 'specimen-track',
        } as TimelineTrackSpecification;
        specimenRenderer.configureTrack(track);
        const event = {
            start: 5,
            end: 5,
            event: {
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 5,
                studyId: 'study',
                uniquePatientKey: 'patient-key',
                eventType: 'SPECIMEN',
                attributes: [{ key: 'SAMPLE_ID', value: 'S-1' }],
            },
            containingTrack: track,
        } as TimelineEvent;
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        TestRenderer.create(<div>{track.renderTooltip!(event)}</div>);

        expect(consoleErrorSpy).not.toHaveBeenCalledWith(
            expect.stringContaining(
                'Each child in a list should have a unique "key" prop'
            ),
            expect.anything(),
            expect.anything()
        );

        consoleErrorSpy.mockRestore();
    });
});

describe('sortTracks', () => {
    function makeClinicalEvent(
        overrides: Partial<ClinicalEvent> = {},
        attributes: Array<{ key: string; value: string }> = []
    ): ClinicalEvent {
        return {
            eventType: 'TREATMENT',
            patientId: 'P-1',
            studyId: 'study',
            uniquePatientKey: 'patient-key',
            uniqueSampleKey: 'sample-key',
            startNumberOfDaysSinceDiagnosis: 5,
            endNumberOfDaysSinceDiagnosis: 5,
            attributes,
            ...overrides,
        } as ClinicalEvent;
    }

    it('reuses cached track-spec templates for equivalent event snapshots', () => {
        const config = buildBaseConfig({} as any, {} as any);
        const firstEvents = [
            makeClinicalEvent(
                { eventType: 'LAB_TEST' },
                [{ key: 'TEST', value: 'CEA' }]
            ),
        ];
        const secondEvents = [
            makeClinicalEvent(
                { eventType: 'LAB_TEST' },
                [{ key: 'TEST', value: 'CEA' }]
            ),
        ];

        const first = sortTracks(config, firstEvents);
        const second = sortTracks(config, secondEvents);

        assert.deepEqual(
            second.map(track => track.uid),
            first.map(track => track.uid)
        );
        assert.notStrictEqual(second, first);
        assert.notStrictEqual(second[0], first[0]);
    });

    it('returns isolated clones so caller mutations do not leak into cached track specs', () => {
        const config = buildBaseConfig({} as any, {} as any);
        const events = [
            makeClinicalEvent(
                { eventType: 'LAB_TEST' },
                [{ key: 'TEST', value: 'CEA' }]
            ),
        ];

        const first = sortTracks(config, events);
        first[0].uid = 'mutated';
        first[0].items.push(first[0].items[0]);

        const second = sortTracks(config, events);

        assert.equal(second[0].uid, 'LAB_TEST');
        assert.lengthOf(second[0].items, 0);
        assert.lengthOf(second[0].tracks || [], 1);
    });

    it('reuses cached track-spec templates when the caller provides a shared event signature', () => {
        const config = buildBaseConfig({} as any, {} as any);
        const firstEvents = [
            makeClinicalEvent(
                { eventType: 'LAB_TEST' },
                [{ key: 'TEST', value: 'CEA' }]
            ),
        ];
        const secondEvents = [
            makeClinicalEvent(
                { eventType: 'LAB_TEST' },
                [{ key: 'TEST', value: 'CEA' }]
            ),
        ];
        const sharedSignature =
            'LAB_TEST::P-1::study::patient-key::sample-key::5::5::TEST:CEA';

        const first = sortTracks(config, firstEvents, sharedSignature);
        const second = sortTracks(config, secondEvents, sharedSignature);

        assert.deepEqual(
            second.map(track => track.uid),
            first.map(track => track.uid)
        );
        assert.notStrictEqual(second, first);
        assert.notStrictEqual(second[0], first[0]);
    });

    it('preserves first-seen order for event types outside the configured sort order', () => {
        const config = {
            sortOrder: ['TREATMENT'],
            trackStructures: [],
        } as any;
        const events = [
            makeClinicalEvent({ eventType: 'LAB_TEST' }),
            makeClinicalEvent({ eventType: 'IMAGING' }),
            makeClinicalEvent({ eventType: 'LAB_TEST' }),
        ];

        const tracks = sortTracks(config, events);

        assert.deepEqual(
            tracks.map(track => track.uid),
            ['LAB_TEST', 'IMAGING']
        );
    });

    it('recomputes the derived sort-config cache when sortOrder mutates in place', () => {
        const config = {
            sortOrder: ['TREATMENT'],
            trackStructures: [],
        } as any;
        const events = [
            makeClinicalEvent({ eventType: 'LAB_TEST' }),
            makeClinicalEvent({ eventType: 'TREATMENT' }),
        ];

        const first = sortTracks(config, events);
        config.sortOrder[0] = 'LAB_TEST';
        const second = sortTracks(config, events);

        assert.deepEqual(
            first.map(track => track.uid),
            ['TREATMENT', 'LAB_TEST']
        );
        assert.deepEqual(
            second.map(track => track.uid),
            ['LAB_TEST', 'TREATMENT']
        );
    });
});

function makePathologyEvent({
    imageCount,
    nonServableImageCount,
    subtype = 'H&E',
}: {
    imageCount: string;
    nonServableImageCount: string;
    subtype?: string;
}): TimelineEvent {
    return {
        event: {
            patientId: 'P-1',
            startNumberOfDaysSinceDiagnosis: 5,
            attributes: [
                { key: 'IMAGE_COUNT', value: imageCount },
                {
                    key: 'NON_SERVABLE_IMAGE_COUNT',
                    value: nonServableImageCount,
                },
                { key: 'SUBTYPE', value: subtype },
                { key: 'SAMPLE_ID', value: 'S-1' },
                { key: 'WSI_TIMEPOINT_SOURCE', value: 'Biopsy' },
                { key: 'LINKOUT', value: '/patient/wsiHESlides?studyId=study' },
            ],
        },
    } as TimelineEvent;
}

describe('#allResultValuesAreNumerical', () => {
    let events: TimelineEvent[];

    beforeEach(() => {
        events = [
            {
                event: {
                    attributes: [{ key: 'RESULT', value: '0.6' }],
                },
            },
            {
                event: {
                    attributes: [{ key: 'RESULT', value: '10' }],
                },
            },
        ] as TimelineEvent[];
    });

    it('catches all numerical condition', () => {
        assert.isTrue(allResultValuesAreNumerical(events));
    });

    it('catches non numerical', () => {
        events.push({
            event: {
                attributes: [{ key: 'RESULT', value: 'S' }],
            },
        } as TimelineEvent);
        assert.isFalse(allResultValuesAreNumerical(events));
    });

    it('handles zero as numeric', () => {
        events.push({
            event: {
                attributes: [{ key: 'RESULT', value: '0' }],
            },
        } as TimelineEvent);
        assert.isTrue(allResultValuesAreNumerical(events));
    });

    it('catches missing RESULT attribute', () => {
        events.push(({
            event: {
                attributes: [],
            },
        } as any) as TimelineEvent);
        assert.isFalse(allResultValuesAreNumerical(events));
    });
});

describe('pathology timeline badge rendering', () => {
    const track = { type: 'H&E' } as TimelineTrackSpecification;

    function getRenderedRects(event: TimelineEvent) {
        const renderer = TestRenderer.create(
            <svg>{renderPathologyCountBadge([event], 0, track)}</svg>
        );

        return renderer.root.findAllByType('rect');
    }

    it('renders servable-only badges with the subtype color and no non-servable segment', () => {
        const rects = getRenderedRects(
            makePathologyEvent({
                imageCount: '3',
                nonServableImageCount: '0',
            })
        );

        assert.equal(rects[1].props.fill, '#1f77b4');
        assert.lengthOf(
            rects.filter(
                rect => rect.props.fill === PATHOLOGY_NON_VIEWABLE_FILL
            ),
            0
        );
    });

    it('renders non-servable-only badges as a full-width non-servable segment', () => {
        const rects = getRenderedRects(
            makePathologyEvent({
                imageCount: '0',
                nonServableImageCount: '4',
            })
        );

        assert.equal(rects[1].props.fill, PATHOLOGY_NON_VIEWABLE_FILL);
        assert.equal(rects[1].props.width, 18);
    });

    it('renders mixed badges as proportional servable and non-servable segments', () => {
        const rects = getRenderedRects(
            makePathologyEvent({
                imageCount: '1',
                nonServableImageCount: '3',
            })
        );

        assert.equal(rects[1].props.fill, '#1f77b4');
        assert.equal(rects[2].props.fill, PATHOLOGY_NON_VIEWABLE_FILL);
        assert.closeTo(rects[1].props.width, 4.5, 0.001);
        assert.closeTo(rects[2].props.width, 13.5, 0.001);
    });

    it('keeps the centered label equal to the total count', () => {
        const renderer = TestRenderer.create(
            <svg>
                {renderPathologyCountBadge(
                    [
                        makePathologyEvent({
                            imageCount: '1',
                            nonServableImageCount: '2',
                        }),
                    ],
                    0,
                    track
                )}
            </svg>
        );

        assert.equal(renderer.root.findByType('text').children.join(''), '3');
    });

    it('does not link a non-servable-only badge', () => {
        const renderer = TestRenderer.create(
            <svg>
                {renderPathologyCountBadge(
                    [
                        makePathologyEvent({
                            imageCount: '0',
                            nonServableImageCount: '2',
                        }),
                    ],
                    0,
                    track
                )}
            </svg>
        );

        assert.lengthOf(renderer.root.findAllByType('a'), 0);
    });

    it('links a combined badge when any grouped event is servable', () => {
        const nonServableEvent = makePathologyEvent({
            imageCount: '0',
            nonServableImageCount: '2',
        });
        nonServableEvent.event.attributes = nonServableEvent.event.attributes.filter(
            attribute => attribute.key !== 'LINKOUT'
        );
        const servableEvent = makePathologyEvent({
            imageCount: '1',
            nonServableImageCount: '0',
        });
        const renderer = TestRenderer.create(
            <svg>
                {renderPathologyCountBadge(
                    [nonServableEvent, servableEvent],
                    0,
                    track
                )}
            </svg>
        );

        assert.equal(
            renderer.root.findByType('a').props.href,
            '/patient/wsiHESlides?studyId=study'
        );
    });

    it('does not link a combined badge when grouped events have different slide targets', () => {
        const blockEvent = makePathologyEvent({
            imageCount: '4',
            nonServableImageCount: '0',
        });
        const unmatchedEvent = makePathologyEvent({
            imageCount: '1',
            nonServableImageCount: '0',
        });
        unmatchedEvent.event.attributes = unmatchedEvent.event.attributes.map(
            attribute =>
                attribute.key === 'LINKOUT'
                    ? {
                          ...attribute,
                          value:
                              '/patient/wsiHESlides?studyId=study&matchLevel=Unmatched',
                      }
                    : attribute
        );

        const renderer = TestRenderer.create(
            <svg>
                {renderPathologyCountBadge(
                    [blockEvent, unmatchedEvent],
                    0,
                    track
                )}
            </svg>
        );

        assert.lengthOf(renderer.root.findAllByType('a'), 0);
    });

    it('links a combined badge when grouped events differ only by specimen key', () => {
        const firstPartEvent = makePathologyEvent({
            imageCount: '2',
            nonServableImageCount: '0',
        });
        firstPartEvent.event.attributes = firstPartEvent.event.attributes
            .map(attribute =>
                attribute.key === 'LINKOUT'
                    ? {
                          ...attribute,
                          value:
                              '/patient/wsiHESlides?studyId=study&sampleId=S-1&stainFilter=hne&matchLevel=PART&specimenKey=part%3A%3A1',
                      }
                    : attribute
            )
            .concat([
                { key: 'MATCH_LEVEL', value: 'PART' },
                { key: 'SPECIMEN', value: 'Part 1' },
            ]);
        const secondPartEvent = makePathologyEvent({
            imageCount: '3',
            nonServableImageCount: '0',
        });
        secondPartEvent.event.attributes = secondPartEvent.event.attributes
            .map(attribute =>
                attribute.key === 'LINKOUT'
                    ? {
                          ...attribute,
                          value:
                              '/patient/wsiHESlides?studyId=study&sampleId=S-1&stainFilter=hne&matchLevel=PART&specimenKey=part%3A%3A2',
                      }
                    : attribute
            )
            .concat([
                { key: 'MATCH_LEVEL', value: 'PART' },
                { key: 'SPECIMEN', value: 'Part 2' },
            ]);

        const renderer = TestRenderer.create(
            <svg>
                {renderPathologyCountBadge(
                    [firstPartEvent, secondPartEvent],
                    0,
                    track
                )}
            </svg>
        );

        assert.equal(
            renderer.root.findByType('a').props.href,
            '/patient/wsiHESlides?studyId=study&sampleId=S-1&stainFilter=hne&matchLevel=PART'
        );
    });

    it('reuses a deterministic clip-path id for equivalent grouped badge payloads', () => {
        const blockEvent = makePathologyEvent({
            imageCount: '4',
            nonServableImageCount: '0',
        });
        const unmatchedEvent = makePathologyEvent({
            imageCount: '1',
            nonServableImageCount: '0',
        });
        unmatchedEvent.event.attributes = unmatchedEvent.event.attributes.map(
            attribute =>
                attribute.key === 'LINKOUT'
                    ? {
                          ...attribute,
                          value:
                              '/patient/wsiHESlides?studyId=study&matchLevel=Unmatched',
                      }
                    : attribute
        );

        const firstRenderer = TestRenderer.create(
            <svg>
                {renderPathologyCountBadge(
                    [blockEvent, unmatchedEvent],
                    0,
                    track
                )}
            </svg>
        );
        const secondRenderer = TestRenderer.create(
            <svg>
                {renderPathologyCountBadge(
                    [blockEvent, unmatchedEvent],
                    0,
                    track
                )}
            </svg>
        );

        const firstId = firstRenderer.root.findByType('clipPath').props.id;
        const secondId = secondRenderer.root.findByType('clipPath').props.id;

        assert.equal(firstId, secondId);
        assert.include(firstId, 'pathology-count-badge');
    });
});

describe('pathology timeline tooltip', () => {
    it('uses the standard tooltip table with a date and aggregate slide details', () => {
        const renderer = TestRenderer.create(
            renderPathologyTooltip(
                [
                    makePathologyEvent({
                        imageCount: '2',
                        nonServableImageCount: '0',
                    }),
                ],
                { type: 'H&E' } as TimelineTrackSpecification
            ) as React.ReactElement
        );

        const text = JSON.stringify(renderer.toJSON());
        assert.include(text, 'PATHOLOGY TYPE');
        assert.include(text, 'Slides');
        assert.include(text, 'VIEWABLE SLIDES');
        assert.include(text, '2');
        assert.notInclude(text, 'NON-VIEWABLE SLIDES');
        assert.notInclude(text, 'SAMPLE');
        assert.notInclude(text, 'TIMEPOINT SOURCE');
        assert.include(text, 'DATE');
        assert.include(text, '5 days');
        assert.notInclude(text, 'Slides at this timepoint');
        assert.notInclude(text, 'Slide 1 (H&E, block 1): Proc d-5');
        assert.equal(
            renderer.root.findByType('a').props.href,
            '/patient/wsiHESlides?studyId=study'
        );
    });

    it('shows concise non-servable details without a slide link', () => {
        const renderer = TestRenderer.create(
            renderPathologyTooltip(
                makePathologyEvent({
                    imageCount: '0',
                    nonServableImageCount: '3',
                }),
                { type: 'H&E' } as TimelineTrackSpecification
            ) as React.ReactElement
        );

        const text = JSON.stringify(renderer.toJSON());
        assert.include(text, 'NON-VIEWABLE SLIDES');
        assert.include(text, '3');
        assert.notInclude(text, '"VIEWABLE SLIDES"');
        assert.lengthOf(renderer.root.findAllByType('a'), 0);
    });

    it('shows separate linkouts when grouped pathology events have different targets', () => {
        const blockEvent = makePathologyEvent({
            imageCount: '4',
            nonServableImageCount: '0',
        });
        blockEvent.event.attributes = blockEvent.event.attributes.concat([
            { key: 'MATCH_LEVEL', value: 'BLOCK' },
            { key: 'SPECIMEN', value: 'Part 1 / Block 5T' },
        ]);
        const unmatchedEvent = makePathologyEvent({
            imageCount: '1',
            nonServableImageCount: '0',
        });
        unmatchedEvent.event.attributes = unmatchedEvent.event.attributes
            .map(attribute =>
                attribute.key === 'LINKOUT'
                    ? {
                          ...attribute,
                          value:
                              '/patient/wsiHESlides?studyId=study&matchLevel=Unmatched',
                      }
                    : attribute
            )
            .concat([
                { key: 'MATCH_LEVEL', value: 'Unmatched' },
                { key: 'SPECIMEN', value: 'Part 2' },
            ]);

        const renderer = TestRenderer.create(
            renderPathologyTooltip([blockEvent, unmatchedEvent], {
                type: 'H&E',
            } as TimelineTrackSpecification) as React.ReactElement
        );

        const links = renderer.root.findAllByType('a');
        assert.lengthOf(links, 2);
        assert.equal(
            links[0].props.href,
            '/patient/wsiHESlides?studyId=study&matchLevel=Unmatched'
        );
        assert.equal(links[1].props.href, '/patient/wsiHESlides?studyId=study');
        const text = JSON.stringify(renderer.toJSON());
        assert.include(text, 'LINKOUTS');
        assert.include(text, '1 - Unmatched - Part 2');
        assert.include(text, '4 - BLOCK - Part 1 / Block 5T');
    });

    it('collapses specimen-only pathology link differences into one summary linkout', () => {
        const firstPartEvent = makePathologyEvent({
            imageCount: '2',
            nonServableImageCount: '0',
        });
        firstPartEvent.event.attributes = firstPartEvent.event.attributes
            .map(attribute =>
                attribute.key === 'LINKOUT'
                    ? {
                          ...attribute,
                          value:
                              '/patient/wsiHESlides?studyId=study&sampleId=S-1&stainFilter=hne&matchLevel=PART&specimenKey=part%3A%3A1',
                      }
                    : attribute
            )
            .concat([
                { key: 'MATCH_LEVEL', value: 'PART' },
                { key: 'SPECIMEN', value: 'Part 1' },
            ]);
        const secondPartEvent = makePathologyEvent({
            imageCount: '3',
            nonServableImageCount: '0',
        });
        secondPartEvent.event.attributes = secondPartEvent.event.attributes
            .map(attribute =>
                attribute.key === 'LINKOUT'
                    ? {
                          ...attribute,
                          value:
                              '/patient/wsiHESlides?studyId=study&sampleId=S-1&stainFilter=hne&matchLevel=PART&specimenKey=part%3A%3A2',
                      }
                    : attribute
            )
            .concat([
                { key: 'MATCH_LEVEL', value: 'PART' },
                { key: 'SPECIMEN', value: 'Part 2' },
            ]);

        const renderer = TestRenderer.create(
            renderPathologyTooltip([firstPartEvent, secondPartEvent], {
                type: 'H&E',
            } as TimelineTrackSpecification) as React.ReactElement
        );

        const links = renderer.root.findAllByType('a');
        assert.lengthOf(links, 1);
        assert.equal(
            links[0].props.href,
            '/patient/wsiHESlides?studyId=study&sampleId=S-1&stainFilter=hne&matchLevel=PART'
        );
        const text = JSON.stringify(renderer.toJSON());
        assert.include(text, 'VIEWABLE SLIDES');
        assert.include(text, '5');
        assert.include(text, 'SPECIMEN');
        assert.include(text, 'Part 1, Part 2');
        assert.notInclude(text, 'LINKOUTS');
    });

    it('renders grouped pathology link rows without React key warnings', () => {
        const blockEvent = makePathologyEvent({
            imageCount: '4',
            nonServableImageCount: '0',
        });
        blockEvent.event.attributes = blockEvent.event.attributes.concat([
            { key: 'MATCH_LEVEL', value: 'BLOCK' },
            { key: 'SPECIMEN', value: 'Part 1 / Block 5T' },
        ]);
        const unmatchedEvent = makePathologyEvent({
            imageCount: '1',
            nonServableImageCount: '0',
        });
        unmatchedEvent.event.attributes = unmatchedEvent.event.attributes
            .map(attribute =>
                attribute.key === 'LINKOUT'
                    ? {
                          ...attribute,
                          value:
                              '/patient/wsiHESlides?studyId=study&matchLevel=Unmatched',
                      }
                    : attribute
            )
            .concat([
                { key: 'MATCH_LEVEL', value: 'Unmatched' },
                { key: 'SPECIMEN', value: 'Part 2' },
            ]);
        const consoleErrorSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        TestRenderer.create(
            renderPathologyTooltip([blockEvent, unmatchedEvent], {
                type: 'H&E',
            } as TimelineTrackSpecification) as React.ReactElement
        );

        expect(consoleErrorSpy).not.toHaveBeenCalledWith(
            expect.stringContaining(
                'Each child in a list should have a unique "key" prop'
            ),
            expect.anything(),
            expect.anything()
        );

        consoleErrorSpy.mockRestore();
    });
});
