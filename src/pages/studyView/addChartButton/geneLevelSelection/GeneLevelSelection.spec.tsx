import { assert } from 'chai';
import { Gene } from 'cbioportal-ts-api-client';
import {
    DataType,
    MolecularProfileOption,
} from 'pages/studyView/StudyViewUtils';
import {
    AlterationTypeConstants,
    MutationOptionConstants,
} from 'shared/constants';
import GeneLevelSelection from './GeneLevelSelection';
import {
    MRNA_TAB_GENE_GROUPS,
    STUDY_VIEW_DEFAULT_GENE_SPECIFIC_VIOLIN_GROUP_ID,
} from 'pages/patientView/mrna/mrnaTabGeneGroups';

describe('GeneLevelSelection', () => {
    function initValidGeneQuery(
        component: GeneLevelSelection,
        geneSymbols: string[]
    ) {
        (component as any)._queryStr = geneSymbols.join(' ');
        (component as any)._oql = {
            query: geneSymbols.map(() => ({ alterations: false })),
        };
        (component as any)._genes = {
            found: geneSymbols.map(
                gene => (({ hugoGeneSymbol: gene } as unknown) as Gene)
            ),
            suggestions: [],
        };
    }

    function createComponent(profile: MolecularProfileOption) {
        return new GeneLevelSelection({
            molecularProfileOptionsPromise: {
                isComplete: true,
                result: [profile],
            },
            onSubmit: () => {},
            containerWidth: 600,
        } as any);
    }

    it('shows violin and bar chart radio options for multi-gene numeric selections', () => {
        const component = createComponent({
            value: 'mrna',
            count: 100,
            label: 'mRNA Expression',
            description: 'mRNA expression profile',
            dataType: DataType.NUMBER,
            alterationType: 'MRNA_EXPRESSION',
        });
        initValidGeneQuery(component, ['TP53', 'EGFR']);

        assert.deepEqual(
            (component as any).chartSelectionOptions.map((option: any) =>
                (component as any).getChartOptionLabel(option)
            ),
            ['Add 1 Violin Plot', 'Add 2 Bar Charts']
        );
    });

    it('shows full bar chart radio option count for larger multi-gene selections', () => {
        const component = createComponent({
            value: 'mrna',
            count: 100,
            label: 'mRNA Expression',
            description: 'mRNA expression profile',
            dataType: DataType.NUMBER,
            alterationType: 'MRNA_EXPRESSION',
        });
        initValidGeneQuery(
            component,
            Array.from({ length: 12 }, (_, i) => `GENE${i + 1}`)
        );

        assert.deepEqual(
            (component as any).chartSelectionOptions.map((option: any) =>
                (component as any).getChartOptionLabel(option)
            ),
            ['Add 1 Violin Plot', 'Add 12 Bar Charts']
        );
    });

    it('submits violin aggregation by default for multi-gene numeric selections', () => {
        let submittedCharts: any[] = [];
        const component = new GeneLevelSelection({
            molecularProfileOptionsPromise: {
                isComplete: true,
                result: [
                    {
                        value: 'mrna',
                        count: 100,
                        label: 'mRNA Expression',
                        description: 'mRNA expression profile',
                        dataType: DataType.NUMBER,
                        alterationType: 'MRNA_EXPRESSION',
                    },
                ],
            },
            onSubmit: (charts: any[]) => {
                submittedCharts = charts;
            },
            containerWidth: 600,
        } as any);
        initValidGeneQuery(
            component,
            Array.from({ length: 12 }, (_, i) => `GENE${i + 1}`)
        );

        (component as any).onAddChart();

        assert.equal(submittedCharts.length, 12);
        assert.isTrue(
            submittedCharts.every(chart => !chart.disableViolinAggregation)
        );
    });

    it('submits individual bar charts when bar chart radio option is selected', () => {
        let submittedCharts: any[] = [];
        const component = new GeneLevelSelection({
            molecularProfileOptionsPromise: {
                isComplete: true,
                result: [
                    {
                        value: 'mrna',
                        count: 100,
                        label: 'mRNA Expression',
                        description: 'mRNA expression profile',
                        dataType: DataType.NUMBER,
                        alterationType: 'MRNA_EXPRESSION',
                    },
                ],
            },
            onSubmit: (charts: any[]) => {
                submittedCharts = charts;
            },
            containerWidth: 600,
        } as any);
        initValidGeneQuery(
            component,
            Array.from({ length: 12 }, (_, i) => `GENE${i + 1}`)
        );

        (component as any)._selectedChartOptionKey = 'bar';
        (component as any).onAddChart();

        assert.equal(submittedCharts.length, 12);
        assert.isTrue(
            submittedCharts.every(chart => chart.disableViolinAggregation)
        );
        assert.deepEqual(
            submittedCharts.map(chart => chart.hugoGeneSymbol),
            Array.from({ length: 12 }, (_, i) => `GENE${i + 1}`)
        );
    });

    it('shows bar chart button text for single-gene numeric selections', () => {
        const component = createComponent({
            value: 'mrna',
            count: 100,
            label: 'mRNA Expression',
            description: 'mRNA expression profile',
            dataType: DataType.NUMBER,
            alterationType: 'MRNA_EXPRESSION',
        });
        initValidGeneQuery(component, ['TP53']);

        assert.deepEqual(
            (component as any).chartSelectionOptions.map((option: any) =>
                (component as any).getChartOptionLabel(option)
            ),
            ['Add 1 Bar Chart']
        );
    });

    it('shows pie chart radio option for multi-gene categorical selections', () => {
        const component = createComponent({
            value: 'cna',
            count: 100,
            label: 'Discrete CNA',
            description: 'discrete cna profile',
            dataType: DataType.STRING,
            alterationType: 'COPY_NUMBER_ALTERATION',
        });
        initValidGeneQuery(component, ['TP53', 'EGFR']);

        assert.deepEqual(
            (component as any).chartSelectionOptions.map((option: any) =>
                (component as any).getChartOptionLabel(option)
            ),
            ['Add 2 Pie Charts']
        );
    });

    it('shows mutation type chart radio option when mutation-type sub-option is selected', () => {
        const component = createComponent({
            value: 'mut',
            count: 100,
            label: 'Mutations',
            description: 'mutation profile',
            dataType: DataType.STRING,
            alterationType: AlterationTypeConstants.MUTATION_EXTENDED,
        });
        initValidGeneQuery(component, ['TP53', 'EGFR']);
        (component as any)._selectedSubProfileOption = {
            value: MutationOptionConstants.MUTATION_TYPE,
            label: 'Mutation Type',
        };

        assert.deepEqual(
            (component as any).chartSelectionOptions.map((option: any) =>
                (component as any).getChartOptionLabel(option)
            ),
            ['Add 2 Mutation Type Charts']
        );
    });

    it('does not render chart type options when there are zero charts to add', () => {
        const component = createComponent({
            value: 'mrna',
            count: 100,
            label: 'mRNA Expression',
            description: 'mRNA expression profile',
            dataType: DataType.NUMBER,
            alterationType: 'MRNA_EXPRESSION',
        });

        assert.deepEqual((component as any).chartSelectionOptions, []);
        assert.isUndefined((component as any).selectedChartSelectionOption);
    });

    it('adds study-view default violin group right below User-defined List', () => {
        const component = createComponent({
            value: 'mrna',
            count: 100,
            label: 'mRNA Expression',
            description: 'mRNA expression profile',
            dataType: DataType.NUMBER,
            alterationType: 'MRNA_EXPRESSION',
        });

        const defaultGroup = MRNA_TAB_GENE_GROUPS.find(
            g => g.id === STUDY_VIEW_DEFAULT_GENE_SPECIFIC_VIOLIN_GROUP_ID
        )!;

        assert.equal(
            (component as any).geneSetOptions[0].label,
            'User-defined List'
        );
        assert.equal(
            (component as any).geneSetOptions[1].label,
            `ADC targets (${defaultGroup.genes.length} genes)`
        );
        assert.equal(
            (component as any).geneSetOptions[1].value,
            defaultGroup.genes.join(' ')
        );
    });

    it('keeps user-defined list option available in the gene-set dropdown', () => {
        const component = createComponent({
            value: 'mrna',
            count: 100,
            label: 'mRNA Expression',
            description: 'mRNA expression profile',
            dataType: DataType.NUMBER,
            alterationType: 'MRNA_EXPRESSION',
        });

        assert.isTrue(
            (component as any).geneSetOptions.some(
                (option: { label: string; value: string }) =>
                    option.label === 'User-defined List' && option.value === ''
            )
        );
    });
});
