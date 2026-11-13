import {
    getClinicalDataSortAttributeId,
    getSlideCountColumnSpecs,
    isSlideCountChartMeta,
} from './ClinicalDataTab';
import { ChartMeta } from '../StudyViewUtils';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';

const ALL_SLIDE_COUNT_IDS = [
    'WSI_SAMPLE_SLIDE_COUNT',
    'WSI_PATIENT_SLIDE_COUNT',
    'WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT',
    'WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT',
    'WSI_PATIENT_PART_MATCHED_SLIDE_COUNT',
    'WSI_PATIENT_BLOCK_MATCHED_SLIDE_COUNT',
];

function attribute(
    clinicalAttributeId: string,
    displayName: string = clinicalAttributeId,
    description: string = clinicalAttributeId
): ClinicalAttribute {
    return {
        clinicalAttributeId,
        displayName,
        description,
        datatype: 'NUMBER',
        patientAttribute: true,
        priority: '1',
        studyId: 'study',
    } as ClinicalAttribute;
}

function chartMeta(clinicalAttribute?: ClinicalAttribute): ChartMeta {
    return {
        uniqueKey: clinicalAttribute
            ? clinicalAttribute.clinicalAttributeId
            : 'SAMPLES_COUNT',
        displayName: clinicalAttribute
            ? clinicalAttribute.displayName
            : 'Samples',
        clinicalAttribute,
    } as ChartMeta;
}

describe('getSlideCountColumnSpecs', () => {
    it('returns all six columns in a fixed order when the study has all six attributes', () => {
        const columns = getSlideCountColumnSpecs(
            [...ALL_SLIDE_COUNT_IDS]
                .reverse()
                .map(id => attribute(id))
                .concat(attribute('AGE'))
        );

        expect(columns.map(column => column.attributeId)).toEqual(
            ALL_SLIDE_COUNT_IDS
        );
        expect(columns.map(column => column.displayName)).toEqual([
            'WSI Slides per Sample',
            'WSI Slides per Patient',
            'WSI Slides per Sample, Part-matched',
            'WSI Slides per Sample, Block-matched',
            'WSI Slides per Patient, Part-matched',
            'WSI Slides per Patient, Block-matched',
        ]);
        expect(
            columns
                .filter(column => column.visible)
                .map(column => column.attributeId)
        ).toEqual(['WSI_PATIENT_SLIDE_COUNT']);
    });

    it('returns only the columns whose attribute the study has', () => {
        const columns = getSlideCountColumnSpecs([
            attribute('WSI_PATIENT_BLOCK_MATCHED_SLIDE_COUNT'),
            attribute('AGE'),
            attribute('WSI_SAMPLE_SLIDE_COUNT'),
        ]);

        expect(columns.map(column => column.attributeId)).toEqual([
            'WSI_SAMPLE_SLIDE_COUNT',
            'WSI_PATIENT_BLOCK_MATCHED_SLIDE_COUNT',
        ]);
    });

    it('returns no columns when the study has none of the attributes', () => {
        expect(
            getSlideCountColumnSpecs([attribute('AGE'), attribute('SEX')])
        ).toEqual([]);
        expect(getSlideCountColumnSpecs([])).toEqual([]);
    });

    it("uses the study's own display name and description", () => {
        const [column] = getSlideCountColumnSpecs([
            attribute(
                'WSI_PATIENT_SLIDE_COUNT',
                'Scanned slides',
                'Number of scanned slides for the patient'
            ),
        ]);

        expect(column).toEqual({
            attributeId: 'WSI_PATIENT_SLIDE_COUNT',
            displayName: 'Scanned slides',
            description: 'Number of scanned slides for the patient',
            visible: true,
        });
    });

    it('falls back to the built-in name when the metadata is missing or repeats the id', () => {
        const columns = getSlideCountColumnSpecs([
            attribute('WSI_PATIENT_SLIDE_COUNT'),
            attribute('WSI_SAMPLE_SLIDE_COUNT', '', ''),
        ]);

        expect(columns).toEqual([
            {
                attributeId: 'WSI_SAMPLE_SLIDE_COUNT',
                displayName: 'WSI Slides per Sample',
                description: '',
                visible: false,
            },
            {
                attributeId: 'WSI_PATIENT_SLIDE_COUNT',
                displayName: 'WSI Slides per Patient',
                description: '',
                visible: true,
            },
        ]);
    });
});

describe('getClinicalDataSortAttributeId', () => {
    const slideCountColumns = getSlideCountColumnSpecs(
        ALL_SLIDE_COUNT_IDS.map(id => attribute(id))
    );

    it('resolves the slide-count column names to their attribute ids', () => {
        expect(
            slideCountColumns.map(column =>
                getClinicalDataSortAttributeId(
                    column.displayName,
                    slideCountColumns,
                    {}
                )
            )
        ).toEqual(ALL_SLIDE_COUNT_IDS);
    });

    it('prefers the slide-count column over another attribute with the same display name', () => {
        expect(
            getClinicalDataSortAttributeId(
                'WSI Slides per Patient',
                slideCountColumns,
                {
                    'WSI Slides per Patient': attribute(
                        'OTHER_SLIDE_ATTRIBUTE',
                        'WSI Slides per Patient'
                    ),
                }
            )
        ).toBe('WSI_PATIENT_SLIDE_COUNT');
    });

    it('resolves the ID columns and other attributes as before', () => {
        const byDisplayName = { Age: attribute('AGE', 'Age') };
        expect(
            getClinicalDataSortAttributeId(
                'Patient ID',
                slideCountColumns,
                byDisplayName
            )
        ).toBe('patientId');
        expect(
            getClinicalDataSortAttributeId(
                'Sample ID',
                slideCountColumns,
                byDisplayName
            )
        ).toBe('sampleId');
        expect(
            getClinicalDataSortAttributeId(
                'Age',
                slideCountColumns,
                byDisplayName
            )
        ).toBe('AGE');
        expect(
            getClinicalDataSortAttributeId(
                undefined,
                slideCountColumns,
                byDisplayName
            )
        ).toBeUndefined();
        expect(
            getClinicalDataSortAttributeId(
                'Unknown',
                slideCountColumns,
                undefined
            )
        ).toBeUndefined();
    });
});

describe('isSlideCountChartMeta', () => {
    it('excludes the slide-count attributes from the generic clinical columns', () => {
        const chartMetas = [
            chartMeta(attribute('AGE', 'Age')),
            ...ALL_SLIDE_COUNT_IDS.map(id => chartMeta(attribute(id))),
            chartMeta(attribute('WSI_OTHER_COUNT')),
            chartMeta(),
        ];

        expect(
            chartMetas
                .filter(meta => !isSlideCountChartMeta(meta))
                .map(meta => meta.uniqueKey)
        ).toEqual(['AGE', 'WSI_OTHER_COUNT', 'SAMPLES_COUNT']);
    });
});
