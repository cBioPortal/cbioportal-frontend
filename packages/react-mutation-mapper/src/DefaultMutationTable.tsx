import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {Column} from "react-table";

import Annotation, {annotationSortMethod, getAnnotationData} from "./component/column/Annotation";
import ColumnHeader from "./component/column/ColumnHeader";
import MutationStatus from "./component/column/MutationStatus";
import MutationType from "./component/column/MutationType";
import ProteinChange, {proteinChangeSortMethod} from "./component/column/ProteinChange";
import {IHotspotIndex} from "./model/CancerHotspot";
import {MobxCache} from "./model/MobxCache";
import {Mutation} from "./model/Mutation";
import {CancerGene, IOncoKbData} from "./model/OncoKb";
import {RemoteData} from "./model/RemoteData";
import {SimpleCache} from "./model/SimpleCache";
import DataTable, {DataTableProps, getInitialColumnDataStatus} from "./DataTable";

export type DefaultMutationTableProps = {
    hotspotData?: RemoteData<IHotspotIndex | undefined>;
    oncoKbData?: RemoteData<IOncoKbData | Error | undefined>;
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>;
    oncoKbEvidenceCache?: SimpleCache;
    pubMedCache?: MobxCache;
    columns?: Column<Partial<Mutation>>[];
    appendColumns?: boolean;
} & DataTableProps<Partial<Mutation>>;

export enum MutationColumn {
    PROTEIN_CHANGE = "proteinChange",
    ANNOTATION = "annotation",
    MUTATION_STATUS = "mutationStatus",
    MUTATION_TYPE = "mutationType",
    CHROMOSOME = "chromosome",
    START_POSITION = "startPosition",
    END_POSITION = "endPosition",
    REFERENCE_ALLELE = "referenceAllele",
    VARIANT_ALLELE = "variantAllele"
}

export enum MutationColumnName {
    PROTEIN_CHANGE = "Protein Change",
    ANNOTATION = "Annotation",
    MUTATION_STATUS = "Mutation Status",
    MUTATION_TYPE = "Mutation Type",
    CHROMOSOME = "Chromosome",
    START_POSITION = "Start Pos",
    END_POSITION = "End Pos",
    REFERENCE_ALLELE = "Ref",
    VARIANT_ALLELE = "Var"
}

const HEADERS = {
    [MutationColumn.PROTEIN_CHANGE]: (
        <ColumnHeader headerContent={<span>{MutationColumnName.PROTEIN_CHANGE}</span>} />
    ),
    [MutationColumn.ANNOTATION]: (
        <ColumnHeader headerContent={<span>{MutationColumnName.ANNOTATION}</span>} />
    ),
    [MutationColumn.MUTATION_STATUS]: (
        <ColumnHeader headerContent={<span>{MutationColumnName.MUTATION_STATUS}</span>} />
    ),
    [MutationColumn.MUTATION_TYPE]: (
        <ColumnHeader headerContent={<span>{MutationColumnName.MUTATION_TYPE}</span>} />
    ),
    [MutationColumn.CHROMOSOME]: (
        <ColumnHeader headerContent={<span>{MutationColumnName.CHROMOSOME}</span>} />
    ),
    [MutationColumn.START_POSITION]: (
        <ColumnHeader headerContent={<span>{MutationColumnName.START_POSITION}</span>} />
    ),
    [MutationColumn.END_POSITION]: (
        <ColumnHeader headerContent={<span>{MutationColumnName.END_POSITION}</span>} />
    ),
    [MutationColumn.REFERENCE_ALLELE]: (
        <ColumnHeader headerContent={<span>{MutationColumnName.REFERENCE_ALLELE}</span>} overlay={<span>Reference Allele</span>} />
    ),
    [MutationColumn.VARIANT_ALLELE]: (
        <ColumnHeader headerContent={<span>{MutationColumnName.VARIANT_ALLELE}</span>} overlay={<span>Variant Allele</span>} />
    ),
};

@observer
class DefaultMutationTableComponent extends DataTable<Partial<Mutation>> {}

@observer
export default class DefaultMutationTable extends React.Component<DefaultMutationTableProps, {}>
{
    public static defaultProps = {
        initialSortColumn: MutationColumn.ANNOTATION,
        appendColumns: true
    };

    @computed
    get initialColumnDataStatus() {
        return getInitialColumnDataStatus(this.props.initialSortColumnData);
    }

    // TODO generalize this for all columns
    @computed
    get annotationColumnAccessor() {
        return (mutation: Mutation) =>
            this.props.initialSortColumn! === MutationColumn.ANNOTATION && this.initialColumnDataStatus === "pending" ?
                undefined : getAnnotationData(
                    mutation,
                    this.props.oncoKbCancerGenes,
                    this.props.hotspotData,
                    this.props.oncoKbData
                );
    }

    @computed
    get initialSortColumnData() {
        return this.props.initialSortColumnData || [
            this.props.oncoKbCancerGenes,
            this.props.hotspotData,
            this.props.oncoKbData
        ];
    }

    @computed
    get columns() {
        // TODO allow inserting columns into any arbitrary position (not just at the end of the list)
        if (this.props.columns) {
            return this.props.appendColumns ? [...this.defaultColumns, ...this.props.columns] : this.props.columns;
        }
        else {
            return this.defaultColumns;
        }
    }

    @computed
    get defaultColumns() {
        return [
            {
                id: MutationColumn.PROTEIN_CHANGE,
                name: MutationColumnName.PROTEIN_CHANGE,
                accessor: MutationColumn.PROTEIN_CHANGE,
                Cell: (column: any) => <ProteinChange mutation={column.original} />,
                Header: HEADERS[MutationColumn.PROTEIN_CHANGE],
                sortMethod: proteinChangeSortMethod
            },
            {
                id: MutationColumn.ANNOTATION,
                name: MutationColumnName.ANNOTATION,
                accessor: this.annotationColumnAccessor,
                Cell: (column: any) =>
                    <Annotation
                        mutation={column.original}
                        enableOncoKb={true}
                        enableHotspot={true}
                        hotspotData={this.props.hotspotData}
                        oncoKbData={this.props.oncoKbData}
                        oncoKbCancerGenes={this.props.oncoKbCancerGenes}
                        oncoKbEvidenceCache={this.props.oncoKbEvidenceCache}
                        pubMedCache={this.props.pubMedCache}
                    />,
                Header: HEADERS[MutationColumn.ANNOTATION],
                sortMethod: annotationSortMethod
            },
            {
                id: MutationColumn.MUTATION_TYPE,
                name: MutationColumnName.MUTATION_TYPE,
                accessor: MutationColumn.MUTATION_TYPE,
                Cell: (column: any) => <MutationType mutation={column.original} />,
                Header: HEADERS[MutationColumn.MUTATION_TYPE]
            },
            {
                id: MutationColumn.MUTATION_STATUS,
                name: MutationColumnName.MUTATION_STATUS,
                accessor: MutationColumn.MUTATION_STATUS,
                Cell: (column: any) => <MutationStatus mutation={column.original} />,
                Header: HEADERS[MutationColumn.MUTATION_STATUS]
            },
            {
                id: MutationColumn.CHROMOSOME,
                name: MutationColumnName.CHROMOSOME,
                accessor: MutationColumn.CHROMOSOME,
                Header: HEADERS[MutationColumn.CHROMOSOME],
                show: false
            },
            {
                id: MutationColumn.START_POSITION,
                name: MutationColumnName.START_POSITION,
                accessor: MutationColumn.START_POSITION,
                Header: HEADERS[MutationColumn.START_POSITION],
                show: false
            },
            {
                id: MutationColumn.END_POSITION,
                name: MutationColumnName.END_POSITION,
                accessor: MutationColumn.END_POSITION,
                Header: HEADERS[MutationColumn.END_POSITION],
                show: false
            },
            {
                id: MutationColumn.REFERENCE_ALLELE,
                name: MutationColumnName.REFERENCE_ALLELE,
                accessor: MutationColumn.REFERENCE_ALLELE,
                Header: HEADERS[MutationColumn.REFERENCE_ALLELE],
                show: false
            },
            {
                id: MutationColumn.VARIANT_ALLELE,
                name: MutationColumnName.VARIANT_ALLELE,
                accessor: MutationColumn.VARIANT_ALLELE,
                Header: HEADERS[MutationColumn.VARIANT_ALLELE],
                show: false
            }
        ];
    }

    public render() {
        return (
            <DefaultMutationTableComponent
                {...this.props}
                columns={this.columns}
                initialSortColumnData={this.initialSortColumnData}
            />
        );
    }
}
