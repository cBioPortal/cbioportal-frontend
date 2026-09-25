import { CancerStudy, StructuralVariant } from 'cbioportal-ts-api-client';
import { Exon } from 'genome-nexus-ts-api-client';
import ResultsViewStructuralVariantMapperDataStore from './ResultsViewStructuralVariantMapperDataStore';
import {
    matchesColumnFilter,
    structuralVariantColumnValue,
} from './StructuralVariantFilters';
import { FusionTableColumnType as Column } from 'shared/components/structuralVariantTable/StructuralVariantTable';

const variant = (values: Partial<StructuralVariant>): StructuralVariant =>
    ({
        sampleId: 'A',
        site1Position: 0,
        dnaSupport: 'Yes',
        uniqueSampleKey: 'sample-1',
        ...values,
    } as StructuralVariant);

describe('structural variant column filters', () => {
    it('uses inclusive numeric bounds and handles zero and empty values', () => {
        const filter = {
            kind: 'numeric' as const,
            lowerBound: 0,
            upperBound: 10,
            hideEmptyValues: false,
        };
        expect(matchesColumnFilter(0, filter)).toBe(true);
        expect(matchesColumnFilter(10, filter)).toBe(true);
        expect(matchesColumnFilter(11, filter)).toBe(false);
        expect(matchesColumnFilter(null, filter)).toBe(true);
        expect(
            matchesColumnFilter(null, { ...filter, hideEmptyValues: true })
        ).toBe(false);
    });

    it('resolves derived and string-valued columns', () => {
        const row = [variant({ site1Position: 5 })];
        expect(structuralVariantColumnValue(row, Column.DNA_SUPPORT)).toBe(
            'Yes'
        );
        expect(
            structuralVariantColumnValue(
                [variant({ studyId: 'study-a' })],
                Column.STUDY,
                {
                    studyIdToStudy: {
                        'study-a': { name: 'Study A' } as CancerStudy,
                    },
                }
            )
        ).toBe('Study A');
        expect(
            structuralVariantColumnValue(row, Column.CANCER_TYPE_DETAILED, {
                uniqueSampleKeyToTumorType: { 'sample-1': 'Lung' },
            })
        ).toBe('Lung');
        expect(
            structuralVariantColumnValue(row, Column.ANNOTATION, {
                annotationValue: () => 'Oncogenic',
            })
        ).toBe('Oncogenic');
        expect(structuralVariantColumnValue(row, Column.SITE1_EXON)).toBeNull();
        expect(
            structuralVariantColumnValue(
                [
                    variant({
                        site1EnsemblTranscriptId: 'ENST1',
                        site1Position: 5,
                    }),
                ],
                Column.SITE1_EXON,
                {
                    transcriptToExons: new Map([
                        [
                            'ENST1',
                            [
                                {
                                    exonStart: 1,
                                    exonEnd: 10,
                                    rank: 1,
                                } as Exon,
                            ],
                        ],
                    ]),
                }
            )
        ).toBe('Exon 1');
    });

    it('combines column filters with text search and supports removal', () => {
        const store = new ResultsViewStructuralVariantMapperDataStore([
            [
                variant({
                    sampleId: 'Alpha',
                    site1Position: 0,
                    dnaSupport: 'Yes',
                }),
            ],
            [
                variant({
                    sampleId: 'Beta',
                    site1Position: 10,
                    dnaSupport: 'No',
                }),
            ],
            [
                variant({
                    sampleId: 'Gamma',
                    site1Position: 20,
                    dnaSupport: 'Yes',
                }),
            ],
        ]);
        store.setFilter((row, _text, upper) =>
            row[0].sampleId.toUpperCase().includes(upper || '')
        );
        store.setColumnFilter(Column.SITE1_POSITION, {
            kind: 'numeric',
            lowerBound: 0,
            upperBound: 10,
            hideEmptyValues: false,
        });
        store.setColumnFilter(Column.DNA_SUPPORT, {
            kind: 'categorical',
            filterCondition: 'equals',
            filterString: '',
            selections: new Set(['Yes']),
        });
        expect(store.tableData.map(row => row[0].sampleId)).toEqual(['Alpha']);
        store.filterString = 'beta';
        expect(store.tableData).toHaveLength(0);
        store.setColumnFilter(Column.DNA_SUPPORT);
        expect(store.tableData.map(row => row[0].sampleId)).toEqual(['Beta']);
        store.setColumnFilter(Column.SITE1_POSITION);
        store.filterString = '';
        expect(store.tableData).toHaveLength(3);
    });

    it('applies categorical selection and search conditions to blanks', () => {
        const filter = {
            kind: 'categorical' as const,
            filterCondition: 'beginsWith',
            filterString: 'LU',
            selections: new Set(['Lung', '(Blanks)']),
        };
        expect(matchesColumnFilter('Lung', filter)).toBe(true);
        expect(matchesColumnFilter('Breast', filter)).toBe(false);
        expect(matchesColumnFilter(null, filter)).toBe(false);
        expect(matchesColumnFilter(null, { ...filter, filterString: '' })).toBe(
            true
        );
        expect(
            matchesColumnFilter('Lung', {
                ...filter,
                filterCondition: 'doesNotContain',
                filterString: 'UNG',
            })
        ).toBe(false);
    });
});
