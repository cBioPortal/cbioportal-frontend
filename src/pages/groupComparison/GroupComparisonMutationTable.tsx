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

export interface IGroupComparisonMutationTableProps
    extends IMutationTableProps {
    // add comparison view specific props here if needed
    totalNumberOfExons?: string;
    isCanonicalTranscript: boolean | undefined;
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
            MutationTableColumnType.GROUP_A,
            MutationTableColumnType.GROUP_B,
            MutationTableColumnType.LOG_RATIO,
        ],
        columnVisibilityProps: {},
    };

    constructor(props: IGroupComparisonMutationTableProps) {
        super(props);
    }

    componentWillUpdate(nextProps: IGroupComparisonMutationTableProps) {
        this._columns[MutationTableColumnType.STUDY].visible = !!(
            nextProps.studyIdToStudy &&
            Object.keys(nextProps.studyIdToStudy).length > 1
        );
    }

    protected generateColumns() {
        super.generateColumns();

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
        this._columns[MutationTableColumnType.GROUP_A].order = 40;
        this._columns[MutationTableColumnType.GROUP_B].order = 50;
        this._columns[MutationTableColumnType.LOG_RATIO].order = 60;
        this._columns[MutationTableColumnType.MUTATION_STATUS].order = 70;

        this._columns[MutationTableColumnType.GROUP_A].shouldExclude = () => {
            return (
                !this.props.mutationCountsByProteinChangeForGroup ||
                !this.props.profiledPatientCountsByGroup
            );
        };

        this._columns[MutationTableColumnType.GROUP_B].shouldExclude = () => {
            return (
                !this.props.mutationCountsByProteinChangeForGroup ||
                !this.props.profiledPatientCountsByGroup
            );
        };

        this._columns[MutationTableColumnType.LOG_RATIO].shouldExclude = () => {
            return (
                !this.props.mutationCountsByProteinChangeForGroup ||
                !this.props.profiledPatientCountsByGroup
            );
        };

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
