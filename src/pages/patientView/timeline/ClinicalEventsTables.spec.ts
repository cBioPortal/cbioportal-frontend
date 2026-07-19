import { ClinicalEvent } from 'cbioportal-ts-api-client';
import * as clinicalEventSignatureUtils from './clinicalEventSignatureUtils';
import * as pathologyTimelineUtils from './pathologyTimelineUtils';
import { buildClinicalEventTableData } from './ClinicalEventsTables';

function makePathologyEvent(
    date: number,
    subtype: string,
    servableCount: number,
    nonServableCount: number,
    overrides: Partial<ClinicalEvent> = {},
    extraAttributes: Array<{ key: string; value: string }> = []
): ClinicalEvent {
    const totalCount = servableCount + nonServableCount;
    return {
        attributes: [
            { key: 'SUBTYPE', value: subtype },
            { key: 'IMAGE_COUNT', value: String(servableCount) },
            {
                key: 'NON_SERVABLE_IMAGE_COUNT',
                value: String(nonServableCount),
            },
            { key: 'TOTAL_IMAGE_COUNT', value: String(totalCount) },
            ...extraAttributes,
        ],
        endNumberOfDaysSinceDiagnosis: date,
        eventType: 'PATHOLOGY',
        patientId: 'P-1',
        startNumberOfDaysSinceDiagnosis: date,
        studyId: 'study',
        uniquePatientKey: 'study_P-1',
        uniqueSampleKey: `study_P-1-${date}-${subtype}`,
        ...overrides,
    };
}

function makePathologySlideEvent(
    date: number,
    subtype: string,
    servableCount: number,
    nonServableCount: number,
    overrides: Partial<ClinicalEvent> = {},
    extraAttributes: Array<{ key: string; value: string }> = []
): ClinicalEvent {
    return {
        ...makePathologyEvent(
            date,
            subtype,
            servableCount,
            nonServableCount,
            overrides,
            extraAttributes
        ),
        eventType: 'PATHOLOGY SLIDES',
    };
}

describe('buildClinicalEventTableData pathology slides', () => {
    it('renders separate pathology slide rows with sample, match, and specimen details', () => {
        const data = buildClinicalEventTableData(
            [
                makePathologySlideEvent(
                    -20,
                    'H&E',
                    2,
                    0,
                    {},
                    [
                        { key: 'SAMPLE_ID', value: 'S-1' },
                        { key: 'MATCH_LEVEL', value: 'PART' },
                        { key: 'SPECIMEN', value: 'Part 1 / Block A1' },
                        {
                            key: 'LINKOUT',
                            value:
                                '/patient/wsiHESlides?studyId=study&caseId=P-1&sampleId=S-1&stainFilter=hne',
                        },
                    ]
                ),
                makePathologySlideEvent(
                    -20,
                    'H&E',
                    0,
                    3,
                    {},
                    [
                        { key: 'SAMPLE_ID', value: 'Unmatched' },
                        { key: 'MATCH_LEVEL', value: 'Unmatched' },
                        { key: 'SPECIMEN', value: 'Part 2' },
                    ]
                ),
                makePathologySlideEvent(
                    -20,
                    'IHC',
                    1,
                    0,
                    {},
                    [
                        { key: 'SAMPLE_ID', value: 'S-1' },
                        { key: 'MATCH_LEVEL', value: 'BLOCK' },
                        { key: 'SPECIMEN', value: 'Part 1 / Block A1' },
                        {
                            key: 'LINKOUT',
                            value:
                                '/patient/wsiHESlides?studyId=study&caseId=P-1&sampleId=S-1&stainFilter=ihc',
                        },
                    ]
                ),
            ],
            'study',
            'P-1'
        )['PATHOLOGY SLIDES'];

        expect(data).toEqual([
            [
                'DATE (DAYS)',
                'SAMPLE',
                'MATCH',
                'SPECIMEN',
                'SLIDE TYPE',
                'SLIDES',
                'LINKOUT',
            ],
            [
                '-20',
                'S-1',
                'BLOCK',
                'Part 1 / Block A1',
                'IHC',
                '1 (1 viewable)',
                'View 1 of 1||/patient/wsiHESlides?studyId=study&caseId=P-1&sampleId=S-1&stainFilter=ihc',
            ],
            [
                '-20',
                'S-1',
                'PART',
                'Part 1 / Block A1',
                'H&E',
                '2 (2 viewable)',
                'View 2 of 2||/patient/wsiHESlides?studyId=study&caseId=P-1&sampleId=S-1&stainFilter=hne',
            ],
            [
                '-20',
                'Unmatched',
                'Unmatched',
                'Part 2',
                'H&E',
                '3',
                '',
            ],
        ]);
    });

    it('does not link non-viewable-only rows', () => {
        const data = buildClinicalEventTableData(
            [
                makePathologySlideEvent(
                    5,
                    'H&E',
                    0,
                    4,
                    {},
                    [{ key: 'SAMPLE_ID', value: 'Unmatched' }]
                ),
            ],
            'study',
            'P-1'
        )['PATHOLOGY SLIDES'];

        expect(data[1]).toEqual([
            '5',
            'Unmatched',
            '',
            '',
            'H&E',
            '4',
            '',
        ]);
    });

    it('uses separate rows for the same slide type on different dates', () => {
        const data = buildClinicalEventTableData(
            [
                makePathologySlideEvent(-20, 'H&E', 2, 0, {}, [
                    { key: 'SAMPLE_ID', value: 'S-1' },
                ]),
                makePathologySlideEvent(-10, 'H&E', 1, 0, {}, [
                    { key: 'SAMPLE_ID', value: 'S-1' },
                ]),
            ],
            'study',
            'P-1'
        )['PATHOLOGY SLIDES'];

        expect(data.slice(1).map(row => [row[0], row[4]])).toEqual([
            ['-20', 'H&E'],
            ['-10', 'H&E'],
        ]);
    });

    it('collapses specimen rows when date, sample, match, and slide type match', () => {
        const data = buildClinicalEventTableData(
            [
                makePathologySlideEvent(-20, 'H&E', 2, 0, {}, [
                    { key: 'SAMPLE_ID', value: 'S-1' },
                    { key: 'MATCH_LEVEL', value: 'PART' },
                    { key: 'SPECIMEN', value: 'Part 1 / Block A1' },
                    {
                        key: 'LINKOUT',
                        value:
                            '/patient/wsiHESlides?studyId=study&caseId=P-1&sampleId=S-1&stainFilter=hne&matchLevel=PART&specimenKey=part%3A%3A1',
                    },
                ]),
                makePathologySlideEvent(-20, 'H&E', 1, 1, {}, [
                    { key: 'SAMPLE_ID', value: 'S-1' },
                    { key: 'MATCH_LEVEL', value: 'PART' },
                    { key: 'SPECIMEN', value: 'Part 2 / Block B1' },
                    {
                        key: 'LINKOUT',
                        value:
                            '/patient/wsiHESlides?studyId=study&caseId=P-1&sampleId=S-1&stainFilter=hne&matchLevel=PART&specimenKey=part%3A%3A2',
                    },
                ]),
            ],
            'study',
            'P-1'
        )['PATHOLOGY SLIDES'];

        expect(data).toEqual([
            [
                'DATE (DAYS)',
                'SAMPLE',
                'MATCH',
                'SPECIMEN',
                'SLIDE TYPE',
                'SLIDES',
                'LINKOUT',
            ],
            [
                '-20',
                'S-1',
                'PART',
                'Part 1 / Block A1, Part 2 / Block B1',
                'H&E',
                '4 (3 viewable)',
                'View 3 of 4||/patient/wsiHESlides?studyId=study&caseId=P-1&sampleId=S-1&stainFilter=hne&matchLevel=PART',
            ],
        ]);
    });

    it('does not treat pathology biomarker results as slide types', () => {
        const biomarkerEvent = makePathologyEvent(5, 'MMR Deficiency', 0, 0);
        biomarkerEvent.attributes = [
            { key: 'SUBTYPE', value: 'MMR Deficiency' },
        ];

        const data = buildClinicalEventTableData(
            [biomarkerEvent],
            'study',
            'P-1'
        )['PATHOLOGY SLIDES'];

        expect(data).toBeUndefined();
    });

    it('does not treat legacy pathology events with slide counts as pathology slides', () => {
        const legacyPathologyEvent = makePathologyEvent(5, 'H&E', 1, 0);

        const data = buildClinicalEventTableData(
            [legacyPathologyEvent],
            'study',
            'P-1'
        );

        expect(data['PATHOLOGY SLIDES']).toBeUndefined();
        expect(data['PATHOLOGY BIOMARKERS']).toBeDefined();
    });

    it('separates pathology slides from pathology biomarkers', () => {
        const slideEvent = makePathologySlideEvent(-20, 'H&E', 2, 0);
        const biomarkerEvent = makePathologyEvent(-20, 'PD-L1 Positive', 0, 0);
        biomarkerEvent.attributes = [
            { key: 'SUBTYPE', value: 'PD-L1 Positive' },
        ];

        const data = buildClinicalEventTableData(
            [slideEvent, biomarkerEvent],
            'study',
            'P-1'
        );

        expect(data['PATHOLOGY SLIDES']).toHaveLength(2);
        expect(data['PATHOLOGY BIOMARKERS']).toBeDefined();
        expect(data.PATHOLOGY).toBeUndefined();
    });

    it('reuses grouped table data for equivalent augmented event snapshots', () => {
        const firstEvents = [
            makePathologySlideEvent(-20, 'H&E', 2, 0),
            {
                ...makePathologyEvent(5, 'PD-L1 Positive', 0, 0),
                attributes: [{ key: 'SUBTYPE', value: 'PD-L1 Positive' }],
            },
        ];
        const secondEvents = [
            {
                ...makePathologySlideEvent(-20, 'H&E', 2, 0),
                attributes: [
                    { key: 'TOTAL_IMAGE_COUNT', value: '2' },
                    { key: 'NON_SERVABLE_IMAGE_COUNT', value: '0' },
                    { key: 'IMAGE_COUNT', value: '2' },
                    { key: 'SUBTYPE', value: 'H&E' },
                ],
            },
            {
                ...makePathologyEvent(5, 'PD-L1 Positive', 0, 0),
                attributes: [{ key: 'SUBTYPE', value: 'PD-L1 Positive' }],
            },
        ];

        const firstData = buildClinicalEventTableData(
            firstEvents,
            'study',
            'P-1'
        );
        const secondData = buildClinicalEventTableData(
            secondEvents,
            'study',
            'P-1'
        );

        expect(secondData).toBe(firstData);
        expect(secondData['PATHOLOGY SLIDES']).toBe(firstData['PATHOLOGY SLIDES']);
        expect(secondData['PATHOLOGY BIOMARKERS']).toBe(
            firstData['PATHOLOGY BIOMARKERS']
        );
    });

    it('reuses pathology slide rows when only non-WSI events change', () => {
        const slideEvent = makePathologySlideEvent(-20, 'H&E', 2, 0);
        const firstEvents = [
            slideEvent,
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                studyId: 'study',
                uniquePatientKey: 'study_P-1',
                uniqueSampleKey: 'study_P-1-treatment-1',
                startNumberOfDaysSinceDiagnosis: 5,
                endNumberOfDaysSinceDiagnosis: 5,
                attributes: [{ key: 'AGENT', value: 'Drug A' }],
            } as ClinicalEvent,
        ];
        const secondEvents = [
            slideEvent,
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                studyId: 'study',
                uniquePatientKey: 'study_P-1',
                uniqueSampleKey: 'study_P-1-treatment-2',
                startNumberOfDaysSinceDiagnosis: 10,
                endNumberOfDaysSinceDiagnosis: 10,
                attributes: [{ key: 'AGENT', value: 'Drug B' }],
            } as ClinicalEvent,
        ];

        const firstData = buildClinicalEventTableData(
            firstEvents,
            'study',
            'P-1'
        );
        const secondData = buildClinicalEventTableData(
            secondEvents,
            'study',
            'P-1'
        );

        expect(secondData['PATHOLOGY SLIDES']).toBe(firstData['PATHOLOGY SLIDES']);
        expect(secondData.TREATMENT).not.toBe(firstData.TREATMENT);
    });

    it('rebuilds grouped table data when an event changes buckets in place', () => {
        const mutableEvents = [
            makePathologySlideEvent(-20, 'H&E', 2, 0),
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                studyId: 'study',
                uniquePatientKey: 'study_P-1',
                uniqueSampleKey: 'study_P-1-treatment-1',
                startNumberOfDaysSinceDiagnosis: 5,
                endNumberOfDaysSinceDiagnosis: 5,
                attributes: [{ key: 'AGENT', value: 'Drug A' }],
            } as ClinicalEvent,
        ];

        const firstData = buildClinicalEventTableData(
            mutableEvents,
            'study',
            'P-1'
        );

        mutableEvents[1] = makePathologySlideEvent(-10, 'IHC', 1, 0);

        const secondData = buildClinicalEventTableData(
            mutableEvents,
            'study',
            'P-1'
        );

        expect(secondData).not.toBe(firstData);
        expect(secondData.TREATMENT).toBeUndefined();
        expect(secondData['PATHOLOGY SLIDES']).toEqual([
            [
                'DATE (DAYS)',
                'SAMPLE',
                'MATCH',
                'SPECIMEN',
                'SLIDE TYPE',
                'SLIDES',
                'LINKOUT',
            ],
            ['-20', '—', '', '', 'H&E', '2 (2 viewable)', ''],
            ['-10', '—', '', '', 'IHC', '1 (1 viewable)', ''],
        ]);
    });

    it('rebuilds non-WSI table rows when equivalent events arrive in a different order', () => {
        const treatmentA = {
            eventType: 'TREATMENT',
            patientId: 'P-1',
            studyId: 'study',
            uniquePatientKey: 'study_P-1',
            uniqueSampleKey: 'study_P-1-treatment-1',
            startNumberOfDaysSinceDiagnosis: 5,
            endNumberOfDaysSinceDiagnosis: 5,
            attributes: [{ key: 'AGENT', value: 'Drug A' }],
        } as ClinicalEvent;
        const treatmentB = {
            eventType: 'TREATMENT',
            patientId: 'P-1',
            studyId: 'study',
            uniquePatientKey: 'study_P-1',
            uniqueSampleKey: 'study_P-1-treatment-2',
            startNumberOfDaysSinceDiagnosis: 10,
            endNumberOfDaysSinceDiagnosis: 10,
            attributes: [{ key: 'AGENT', value: 'Drug B' }],
        } as ClinicalEvent;

        const firstData = buildClinicalEventTableData(
            [makePathologySlideEvent(-20, 'H&E', 2, 0), treatmentA, treatmentB],
            'study',
            'P-1'
        );
        const secondData = buildClinicalEventTableData(
            [makePathologySlideEvent(-20, 'H&E', 2, 0), treatmentB, treatmentA],
            'study',
            'P-1'
        );

        expect(firstData.TREATMENT).not.toBe(secondData.TREATMENT);
        expect(firstData.TREATMENT?.slice(1).map(row => row[4])).toEqual([
            'Drug A',
            'Drug B',
        ]);
        expect(secondData.TREATMENT?.slice(1).map(row => row[4])).toEqual([
            'Drug B',
            'Drug A',
        ]);
    });

    it('does not rebuild timeline signatures for partitioned subgroups when the top-level signature is provided', () => {
        const buildTimelineEventsSignatureSpy = jest.spyOn(
            pathologyTimelineUtils,
            'buildTimelineEventsSignature'
        );
        const events = [
            makePathologySlideEvent(-20, 'H&E', 2, 0),
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                studyId: 'study',
                uniquePatientKey: 'study_P-1',
                uniqueSampleKey: 'study_P-1-treatment-1',
                startNumberOfDaysSinceDiagnosis: 5,
                endNumberOfDaysSinceDiagnosis: 5,
                attributes: [{ key: 'AGENT', value: 'Drug A' }],
            } as ClinicalEvent,
            makePathologySlideEvent(-10, 'IHC', 1, 0),
        ];

        buildClinicalEventTableData(
            events,
            'study',
            'P-1',
            'shared-top-level-signature'
        );

        expect(buildTimelineEventsSignatureSpy).not.toHaveBeenCalled();
    });
});
