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
import {
    ComparisonGroup,
    SIGNIFICANT_QVALUE_THRESHOLD,
} from './GroupComparisonUtils';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { Mutation, Sample } from 'cbioportal-ts-api-client';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';
import {
    getGroupMutatedCountPercentageTextValue,
    getMutatedCountData,
    groupMutatedCountPercentageRenderFunction,
} from 'shared/components/mutationTable/column/GroupMutatedCountPercentageColumnFormatter';
import {
    getLogRatioData,
    getLogRatioTextValue,
    logRatioRenderFunction,
} from 'shared/components/mutationTable/column/LogRatioColumnFormatter';
import {
    enrichedInRenderFunction,
    getEnrichedInData,
    getEnrichedInFilterValue,
} from 'shared/components/mutationTable/column/EnrichedInColumnFormatter';
import { mutationOverlapRenderFunction } from 'shared/components/mutationTable/column/MutationOverlapColumnFormatter';
import {
    getPValueData,
    getPValueTextValue,
    pValueRenderFunction,
} from 'shared/components/mutationTable/column/PValueColumnFormatter';
import {
    getQValueData,
    getQValueTextValue,
    qValueRenderFunction,
} from 'shared/components/mutationTable/column/QValueColumnFormatter';

export interface IGroupComparisonMutationTableProps
    extends IMutationTableProps {
    // add comparison view specific props here if needed
    isCanonicalTranscript: boolean | undefined;
    profiledPatientCounts: number[];
    groups: ComparisonGroup[];
    sampleSet: ComplexKeyMap<Sample>;
    rowDataByProteinChange: {
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
            MutationTableColumnType.NUM_MUTATED_GROUP_A,
            MutationTableColumnType.NUM_MUTATED_GROUP_B,
            MutationTableColumnType.LOG_RATIO,
            MutationTableColumnType.ENRICHED_IN,
            MutationTableColumnType.MUTATION_OVERLAP,
            MutationTableColumnType.P_VALUE,
            MutationTableColumnType.Q_VALUE,
        ],
        columnVisibilityProps: {},
    };

    constructor(props: IGroupComparisonMutationTableProps) {
        super(props);
    }

    protected generateColumns() {
        super.generateColumns();

        this._columns[MutationTableColumnType.NUM_MUTATED_GROUP_A] = {
            name: this.props.groups[0].nameWithOrdinal,
            render: (d: Mutation[]) =>
                groupMutatedCountPercentageRenderFunction(
                    this.props.rowDataByProteinChange,
                    0,
                    d
                ),
            download: (d: Mutation[]) =>
                getGroupMutatedCountPercentageTextValue(
                    this.props.rowDataByProteinChange,
                    0,
                    d
                ),
            sortBy: (d: Mutation[]) =>
                getMutatedCountData(this.props.rowDataByProteinChange, 0, d),
            tooltip: (
                <span>
                    <strong>{this.props.groups[0].nameWithOrdinal}:</strong>{' '}
                    Number (percentage) of patients in{' '}
                    {this.props.groups[0].nameWithOrdinal} that have a mutation
                    in the selected gene for the listed protein change
                </span>
            ),
        };

        this._columns[MutationTableColumnType.NUM_MUTATED_GROUP_B] = {
            name: this.props.groups[1].nameWithOrdinal,
            render: (d: Mutation[]) =>
                groupMutatedCountPercentageRenderFunction(
                    this.props.rowDataByProteinChange,
                    1,
                    d
                ),
            download: (d: Mutation[]) =>
                getGroupMutatedCountPercentageTextValue(
                    this.props.rowDataByProteinChange,
                    1,
                    d
                ),
            sortBy: (d: Mutation[]) =>
                getMutatedCountData(this.props.rowDataByProteinChange, 1, d),
            tooltip: (
                <span>
                    <strong>{this.props.groups[1].nameWithOrdinal}:</strong>{' '}
                    Number (percentage) of patients in{' '}
                    {this.props.groups[1].nameWithOrdinal} that have a mutation
                    in the selected gene for the listed protein change
                </span>
            ),
        };

        this._columns[MutationTableColumnType.LOG_RATIO] = {
            name: MutationTableColumnType.LOG_RATIO,
            render: (d: Mutation[]) =>
                logRatioRenderFunction(this.props.rowDataByProteinChange, d),
            download: (d: Mutation[]) =>
                getLogRatioTextValue(this.props.rowDataByProteinChange, d),
            sortBy: (d: Mutation[]) =>
                getLogRatioData(this.props.rowDataByProteinChange, d),
            tooltip: (
                <span>
                    Log2 based ratio of (pct in{' '}
                    {this.props.groups[0].nameWithOrdinal}/ pct in{' '}
                    {this.props.groups[1].nameWithOrdinal})
                </span>
            ),
        };

        this._columns[MutationTableColumnType.ENRICHED_IN] = {
            name: MutationTableColumnType.ENRICHED_IN,
            render: (d: Mutation[]) =>
                enrichedInRenderFunction(
                    this.props.rowDataByProteinChange,
                    d,
                    this.props.groups
                ),
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) =>
                getEnrichedInFilterValue(
                    this.props.rowDataByProteinChange,
                    d,
                    filterStringUpper
                ),
            download: (d: Mutation[]) =>
                getEnrichedInData(this.props.rowDataByProteinChange, d),
            sortBy: (d: Mutation[]) =>
                getEnrichedInData(this.props.rowDataByProteinChange, d),
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
                        <td>q-Value &lt; {SIGNIFICANT_QVALUE_THRESHOLD}</td>
                        <td>: Significant association</td>
                    </tr>
                </table>
            ),
        };

        this._columns[MutationTableColumnType.MUTATION_OVERLAP] = {
            name: MutationTableColumnType.MUTATION_OVERLAP,
            headerRender: () => <span>Co-occurrence Pattern</span>,
            render: (d: Mutation[]) =>
                mutationOverlapRenderFunction(
                    this.props.rowDataByProteinChange,
                    d,
                    this.props.profiledPatientCounts,
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
                            : Patients with a mutation in the selected gene for
                            the listed protein change are highlighted.
                        </td>
                    </tr>
                </table>
            ),
        };

        this._columns[MutationTableColumnType.P_VALUE] = {
            name: 'p-Value',
            render: (d: Mutation[]) =>
                pValueRenderFunction(this.props.rowDataByProteinChange, d),
            download: (d: Mutation[]) =>
                getPValueTextValue(this.props.rowDataByProteinChange, d),
            sortBy: (d: Mutation[]) =>
                getPValueData(this.props.rowDataByProteinChange, d),
            tooltip: <span>Derived from two-sided Fisher Exact test</span>,
        };

        this._columns[MutationTableColumnType.Q_VALUE] = {
            name: 'q-Value',
            render: (d: Mutation[]) =>
                qValueRenderFunction(this.props.rowDataByProteinChange, d),
            download: (d: Mutation[]) =>
                getQValueTextValue(this.props.rowDataByProteinChange, d),
            sortBy: (d: Mutation[]) =>
                getQValueData(this.props.rowDataByProteinChange, d),
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
        this._columns[MutationTableColumnType.NUM_MUTATED_GROUP_A].order = 40;
        this._columns[MutationTableColumnType.NUM_MUTATED_GROUP_B].order = 50;
        this._columns[MutationTableColumnType.MUTATION_OVERLAP].order = 60;
        this._columns[MutationTableColumnType.LOG_RATIO].order = 70;
        this._columns[MutationTableColumnType.P_VALUE].order = 80;
        this._columns[MutationTableColumnType.Q_VALUE].order = 90;
        this._columns[MutationTableColumnType.ENRICHED_IN].order = 100;
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
