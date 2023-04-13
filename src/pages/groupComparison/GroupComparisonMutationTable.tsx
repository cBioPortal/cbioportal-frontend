import * as React from 'react';
import {
    IMutationTableProps,
    MutationTableColumnType,
    default as MutationTable,
    MutationTableColumn,
} from 'shared/components/mutationTable/MutationTable';
import { createMutationNamespaceColumns } from 'shared/components/mutationTable/MutationTableUtils';
import _ from 'lodash';
import { adjustVisibility } from 'shared/components/alterationsTableUtils';
import { getServerConfig } from 'config/config';
import { ComparisonGroup } from './GroupComparisonUtils';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { Mutation, Sample } from 'cbioportal-ts-api-client';
import GroupMutatedCountPercentageColumnFormatter from 'shared/components/mutationTable/column/GroupMutatedCountPercentageColumnFormatter.tsx';
import LogRatioColumnFormatter from 'shared/components/mutationTable/column/LogRatioColumnFormatter';
import EnrichedInColumnFormatter from 'shared/components/mutationTable/column/EnrichedInColumnFormatter';
import AlterationOverlapColumnFormatter from 'shared/components/mutationTable/column/AlterationOverlapColumnFormatter';
import PValueColumnFormatter from 'shared/components/mutationTable/column/PValueColumnFormatter';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';
import QValueColumnFormatter from 'shared/components/mutationTable/column/QValueColumnFormatter';

export interface IGroupComparisonMutationTableProps
    extends IMutationTableProps {
    // add comparison view specific props here if needed
    isCanonicalTranscript: boolean | undefined;
    profiledPatientCountsByGroup: {
        [groupIndex: number]: number;
    };
    groups: ComparisonGroup[];
    sampleSet: ComplexKeyMap<Sample>;
    getRowDataByProteinChange: () => {
        [proteinChange: string]: ComparisonMutationsRow;
    };
}

export default class GroupComparisonMutationTable extends MutationTable<
    IGroupComparisonMutationTableProps
> {
    public static defaultProps = {
        ...MutationTable.defaultProps,
        columns: [
            MutationTableColumnType.ANNOTATION,
            MutationTableColumnType.MUTATION_STATUS,
            MutationTableColumnType.PROTEIN_CHANGE,
            MutationTableColumnType.MUTATION_TYPE,
            '(A) Group',
            '(B) Group',
            'Log2 Ratio',
            'Enriched in',
            'Alteration Overlap',
            'P_VALUE',
            'Q_VALUE',
        ],
        columnVisibilityProps: {},
    };

    constructor(props: IGroupComparisonMutationTableProps) {
        super(props);
    }

    protected generateColumns() {
        super.generateColumns();
        const rowDataByProteinChange = this.props.getRowDataByProteinChange();

        this._columns['(A) Group'] = {
            name: this.props.groups[0].nameWithOrdinal,
            render: (d: Mutation[]) =>
                GroupMutatedCountPercentageColumnFormatter.renderFunction(
                    rowDataByProteinChange,
                    0,
                    d
                ),
            download: (d: Mutation[]) =>
                GroupMutatedCountPercentageColumnFormatter.getGroupMutatedCountPercentageTextValue(
                    rowDataByProteinChange,
                    0,
                    d
                ),
            sortBy: (d: Mutation[]) =>
                GroupMutatedCountPercentageColumnFormatter.getMutatedCountData(
                    rowDataByProteinChange,
                    0,
                    d
                ),
            tooltip: (
                <span>
                    <strong>{this.props.groups[0].nameWithOrdinal}:</strong>{' '}
                    Number (percentage) of patients in{' '}
                    {this.props.groups[0].nameWithOrdinal} that have an
                    alteration in the selected gene for the listed protein
                    change
                </span>
            ),
        };

        this._columns['(B) Group'] = {
            name: this.props.groups[1].nameWithOrdinal,
            render: (d: Mutation[]) =>
                GroupMutatedCountPercentageColumnFormatter.renderFunction(
                    rowDataByProteinChange,
                    1,
                    d
                ),
            download: (d: Mutation[]) =>
                GroupMutatedCountPercentageColumnFormatter.getGroupMutatedCountPercentageTextValue(
                    rowDataByProteinChange,
                    1,
                    d
                ),
            sortBy: (d: Mutation[]) =>
                GroupMutatedCountPercentageColumnFormatter.getMutatedCountData(
                    rowDataByProteinChange,
                    1,
                    d
                ),
            tooltip: (
                <span>
                    <strong>{this.props.groups[1].nameWithOrdinal}:</strong>{' '}
                    Number (percentage) of patients in{' '}
                    {this.props.groups[1].nameWithOrdinal} that have an
                    alteration in the selected gene for the listed protein
                    change
                </span>
            ),
        };

        this._columns['Log2 Ratio'] = {
            name: 'Log2 Ratio',
            render: (d: Mutation[]) =>
                LogRatioColumnFormatter.renderFunction(
                    rowDataByProteinChange,
                    d
                ),
            download: (d: Mutation[]) =>
                LogRatioColumnFormatter.getLogRatioTextValue(
                    rowDataByProteinChange,
                    d
                ),
            sortBy: (d: Mutation[]) =>
                LogRatioColumnFormatter.getLogRatioData(
                    rowDataByProteinChange,
                    d
                ),
            tooltip: (
                <span>
                    Log2 based ratio of (pct in{' '}
                    {this.props.groups[0].nameWithOrdinal}/ pct in{' '}
                    {this.props.groups[1].nameWithOrdinal})
                </span>
            ),
        };

        this._columns['Enriched in'] = {
            name: 'Enriched in',
            render: (d: Mutation[]) =>
                EnrichedInColumnFormatter.renderFunction(
                    rowDataByProteinChange,
                    d,
                    this.props.groups
                ),
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) =>
                EnrichedInColumnFormatter.getFilterValue(
                    rowDataByProteinChange,
                    d,
                    filterStringUpper
                ),
            download: (d: Mutation[]) =>
                EnrichedInColumnFormatter.getEnrichedInData(
                    rowDataByProteinChange,
                    d
                ),
            sortBy: (d: Mutation[]) =>
                EnrichedInColumnFormatter.getEnrichedInData(
                    rowDataByProteinChange,
                    d
                ),
            tooltip: (
                <table>
                    <tr>
                        <td>Log ratio {'>'} 0</td>
                        <td>
                            : Enriched in {this.props.groups[0].nameWithOrdinal}
                        </td>
                    </tr>
                    <tr>
                        <td>Log ratio &lt;= 0</td>
                        <td>
                            : Enriched in {this.props.groups[1].nameWithOrdinal}
                        </td>
                    </tr>
                    <tr>
                        <td>q-Value &lt; 0.05</td>
                        <td>: Significant association</td>
                    </tr>
                </table>
            ),
        };

        this._columns['Alteration Overlap'] = {
            name: 'Alteration Overlap',
            headerRender: () => <span>Co-occurrence Pattern</span>,
            render: (d: Mutation[]) =>
                AlterationOverlapColumnFormatter.renderFunction(
                    rowDataByProteinChange,
                    d,
                    this.props.profiledPatientCountsByGroup,
                    this.props.sampleSet,
                    this.props.groups
                ),
            tooltip: (
                <table>
                    <tr>
                        <td>Upper row</td>
                        <td>: Patients colored according to group.</td>
                    </tr>
                    <tr>
                        <td>Lower row</td>
                        <td>
                            : Patients with an alteration in the selected gene
                            for the listed protein change are highlighted.
                        </td>
                    </tr>
                </table>
            ),
        };

        this._columns['P_VALUE'] = {
            name: 'p-Value',
            render: (d: Mutation[]) =>
                PValueColumnFormatter.renderFunction(rowDataByProteinChange, d),
            download: (d: Mutation[]) =>
                PValueColumnFormatter.getPValueTextValue(
                    rowDataByProteinChange,
                    d
                ),
            sortBy: (d: Mutation[]) =>
                PValueColumnFormatter.getPValueData(rowDataByProteinChange, d),
            tooltip: <span>Derived from two-sided Fisher Exact test</span>,
        };

        this._columns['Q_VALUE'] = {
            name: 'q-Value',
            render: (d: Mutation[]) =>
                QValueColumnFormatter.renderFunction(rowDataByProteinChange, d),
            download: (d: Mutation[]) =>
                QValueColumnFormatter.getQValueTextValue(
                    rowDataByProteinChange,
                    d
                ),
            sortBy: (d: Mutation[]) =>
                QValueColumnFormatter.getQValueData(rowDataByProteinChange, d),
            tooltip: <span>Derived from Benjamini-Hochberg procedure</span>,
        };

        // generate namespace columns
        const namespaceColumns = createMutationNamespaceColumns(
            this.props.namespaceColumns
        );
        _.forIn(
            namespaceColumns,
            (column: MutationTableColumn, columnName: string) => {
                this._columns[columnName] = column;
            }
        );

        // disable annotation column if non canonical transcript is selected
        this._columns[MutationTableColumnType.ANNOTATION].shouldExclude = () =>
            this.props.isCanonicalTranscript === false;

        // order columns
        this._columns[MutationTableColumnType.PROTEIN_CHANGE].order = 10;
        this._columns[MutationTableColumnType.ANNOTATION].order = 20;
        this._columns[MutationTableColumnType.MUTATION_TYPE].order = 30;
        this._columns['(A) Group'].order = 40;
        this._columns['(B) Group'].order = 50;
        this._columns['Alteration Overlap'].order = 60;
        this._columns['Log2 Ratio'].order = 70;
        this._columns['P_VALUE'].order = 80;
        this._columns['Q_VALUE'].order = 90;
        this._columns['Enriched in'].order = 100;
        this._columns[MutationTableColumnType.MUTATION_STATUS].order = 110;

        //Adjust column visibility according to portal.properties
        adjustVisibility(
            this._columns,
            Object.keys(namespaceColumns),
            getServerConfig()
                .skin_comparison_view_mutation_table_columns_show_on_init,
            getServerConfig()
                .skin_mutation_table_namespace_column_show_by_default
        );
    }
}
