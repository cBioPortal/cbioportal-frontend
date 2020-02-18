import _ from 'lodash';
import * as React from 'react';

import ColumnHeader from '../column/ColumnHeader';
import { Column } from 'react-table';
import { Mutation } from '../../model/Mutation';
import ProteinChange, { proteinChangeSortMethod } from '../column/ProteinChange';
import { annotationSortMethod } from '../column/Annotation';
import { gnomadSortMethod } from '../column/Gnomad';
import { clinVarSortMethod } from '../column/ClinVar';
import MutationType from '../column/MutationType';
import MutationStatus from '../column/MutationStatus';

export enum MutationColumn {
    PROTEIN_CHANGE = 'proteinChange',
    ANNOTATION = 'annotation',
    MUTATION_STATUS = 'mutationStatus',
    MUTATION_TYPE = 'mutationType',
    CHROMOSOME = 'chromosome',
    START_POSITION = 'startPosition',
    END_POSITION = 'endPosition',
    REFERENCE_ALLELE = 'referenceAllele',
    VARIANT_ALLELE = 'variantAllele',
    GNOMAD = 'gnomad',
    CLINVAR = 'clinVarId',
}

export enum MutationColumnName {
    PROTEIN_CHANGE = 'Protein Change',
    ANNOTATION = 'Annotation',
    MUTATION_STATUS = 'Mutation Status',
    MUTATION_TYPE = 'Mutation Type',
    CHROMOSOME = 'Chromosome',
    START_POSITION = 'Start Pos',
    END_POSITION = 'End Pos',
    REFERENCE_ALLELE = 'Ref',
    VARIANT_ALLELE = 'Var',
    GNOMAD = 'gnomAD',
    CLINVAR = 'ClinVar ID',
}

export function rightAlignedCell(cellProps: any) {
    return <span className="pull-right mr-3">{cellProps.value}</span>;
}

export const MUTATION_COLUMN_HEADERS = {
    [MutationColumn.PROTEIN_CHANGE]: (
        <ColumnHeader
            headerContent={<span className="pull-left">{MutationColumnName.PROTEIN_CHANGE}</span>}
        />
    ),
    [MutationColumn.ANNOTATION]: (
        <ColumnHeader
            headerContent={<span className="pull-left">{MutationColumnName.ANNOTATION}</span>}
        />
    ),
    [MutationColumn.MUTATION_STATUS]: (
        <ColumnHeader
            headerContent={<span className="pull-left">{MutationColumnName.MUTATION_STATUS}</span>}
        />
    ),
    [MutationColumn.MUTATION_TYPE]: (
        <ColumnHeader
            headerContent={<span className="pull-left">{MutationColumnName.MUTATION_TYPE}</span>}
        />
    ),
    [MutationColumn.CHROMOSOME]: (
        <ColumnHeader
            headerContent={<span className="pull-right mr-3">{MutationColumnName.CHROMOSOME}</span>}
        />
    ),
    [MutationColumn.START_POSITION]: (
        <ColumnHeader
            headerContent={
                <span className="pull-right mr-3">{MutationColumnName.START_POSITION}</span>
            }
        />
    ),
    [MutationColumn.END_POSITION]: (
        <ColumnHeader
            headerContent={
                <span className="pull-right mr-3">{MutationColumnName.END_POSITION}</span>
            }
        />
    ),
    [MutationColumn.REFERENCE_ALLELE]: (
        <ColumnHeader
            headerContent={<span className="pull-left">{MutationColumnName.REFERENCE_ALLELE}</span>}
            overlay={<span>Reference Allele</span>}
        />
    ),
    [MutationColumn.VARIANT_ALLELE]: (
        <ColumnHeader
            headerContent={<span className="pull-left">{MutationColumnName.VARIANT_ALLELE}</span>}
            overlay={<span>Variant Allele</span>}
        />
    ),
    [MutationColumn.GNOMAD]: (
        <ColumnHeader
            headerContent={
                <span className="pull-right mr-3">
                    {MutationColumnName.GNOMAD} <i className="fa fa-info-circle" />
                </span>
            }
            overlay={
                <span>
                    <a href="https://gnomad.broadinstitute.org/" target="_blank">
                        gnomAD
                    </a>{' '}
                    population allele frequencies. Overall population allele frequency is shown.
                    Hover over a frequency to see the frequency for each specific population.
                </span>
            }
        />
    ),
    [MutationColumn.CLINVAR]: (
        <ColumnHeader
            headerContent={
                <span className="pull-right mr-3">
                    {MutationColumnName.CLINVAR} <i className="fa fa-info-circle" />
                </span>
            }
            overlay={
                <span>
                    <a href="https://www.ncbi.nlm.nih.gov/clinvar/" target="_blank">
                        ClinVar
                    </a>{' '}
                    aggregates information about genomic variation and its relationship to human
                    health.
                </span>
            }
        />
    ),
};

/**
 * These default columns only include static props.
 * So, for some columns, like Annotation, no default accessor or Cell (render) properties included.
 */
export const MUTATION_COLUMNS_DEFINITION = {
    [MutationColumn.PROTEIN_CHANGE]: {
        id: MutationColumn.PROTEIN_CHANGE,
        name: MutationColumnName.PROTEIN_CHANGE,
        accessor: MutationColumn.PROTEIN_CHANGE,
        searchable: true,
        Cell: (column: any) => <ProteinChange mutation={column.original} />,
        Header: MUTATION_COLUMN_HEADERS[MutationColumn.PROTEIN_CHANGE],
        sortMethod: proteinChangeSortMethod,
    },
    [MutationColumn.ANNOTATION]: {
        id: MutationColumn.ANNOTATION,
        name: MutationColumnName.ANNOTATION,
        Header: MUTATION_COLUMN_HEADERS[MutationColumn.ANNOTATION],
        sortMethod: annotationSortMethod,
    },
    [MutationColumn.MUTATION_TYPE]: {
        id: MutationColumn.MUTATION_TYPE,
        name: MutationColumnName.MUTATION_TYPE,
        accessor: MutationColumn.MUTATION_TYPE,
        searchable: true,
        Cell: (column: any) => <MutationType mutation={column.original} />,
        Header: MUTATION_COLUMN_HEADERS[MutationColumn.MUTATION_TYPE],
    },
    [MutationColumn.MUTATION_STATUS]: {
        id: MutationColumn.MUTATION_STATUS,
        name: MutationColumnName.MUTATION_STATUS,
        accessor: MutationColumn.MUTATION_STATUS,
        searchable: true,
        Cell: (column: any) => <MutationStatus mutation={column.original} />,
        Header: MUTATION_COLUMN_HEADERS[MutationColumn.MUTATION_STATUS],
    },
    [MutationColumn.CHROMOSOME]: {
        id: MutationColumn.CHROMOSOME,
        name: MutationColumnName.CHROMOSOME,
        accessor: MutationColumn.CHROMOSOME,
        searchable: true,
        Cell: rightAlignedCell,
        Header: MUTATION_COLUMN_HEADERS[MutationColumn.CHROMOSOME],
        show: false,
    },
    [MutationColumn.START_POSITION]: {
        id: MutationColumn.START_POSITION,
        name: MutationColumnName.START_POSITION,
        accessor: MutationColumn.START_POSITION,
        searchable: true,
        Cell: rightAlignedCell,
        Header: MUTATION_COLUMN_HEADERS[MutationColumn.START_POSITION],
        show: false,
    },
    [MutationColumn.END_POSITION]: {
        id: MutationColumn.END_POSITION,
        name: MutationColumnName.END_POSITION,
        accessor: MutationColumn.END_POSITION,
        searchable: true,
        Cell: rightAlignedCell,
        Header: MUTATION_COLUMN_HEADERS[MutationColumn.END_POSITION],
        show: false,
    },
    [MutationColumn.REFERENCE_ALLELE]: {
        id: MutationColumn.REFERENCE_ALLELE,
        name: MutationColumnName.REFERENCE_ALLELE,
        accessor: MutationColumn.REFERENCE_ALLELE,
        searchable: true,
        Header: MUTATION_COLUMN_HEADERS[MutationColumn.REFERENCE_ALLELE],
        show: false,
    },
    [MutationColumn.VARIANT_ALLELE]: {
        id: MutationColumn.VARIANT_ALLELE,
        name: MutationColumnName.VARIANT_ALLELE,
        accessor: MutationColumn.VARIANT_ALLELE,
        searchable: true,
        Header: MUTATION_COLUMN_HEADERS[MutationColumn.VARIANT_ALLELE],
        show: false,
    },
    [MutationColumn.GNOMAD]: {
        id: MutationColumn.GNOMAD,
        name: MutationColumnName.GNOMAD,
        Header: MUTATION_COLUMN_HEADERS[MutationColumn.GNOMAD],
        sortMethod: gnomadSortMethod,
    },
    [MutationColumn.CLINVAR]: {
        id: MutationColumn.CLINVAR,
        name: MutationColumnName.CLINVAR,
        Header: MUTATION_COLUMN_HEADERS[MutationColumn.CLINVAR],
        sortMethod: clinVarSortMethod,
    },
};

export const DEFAULT_MUTATION_COLUMNS = [
    MUTATION_COLUMNS_DEFINITION[MutationColumn.PROTEIN_CHANGE],
    MUTATION_COLUMNS_DEFINITION[MutationColumn.MUTATION_TYPE],
    MUTATION_COLUMNS_DEFINITION[MutationColumn.MUTATION_STATUS],
    MUTATION_COLUMNS_DEFINITION[MutationColumn.CHROMOSOME],
    MUTATION_COLUMNS_DEFINITION[MutationColumn.START_POSITION],
    MUTATION_COLUMNS_DEFINITION[MutationColumn.END_POSITION],
    MUTATION_COLUMNS_DEFINITION[MutationColumn.REFERENCE_ALLELE],
    MUTATION_COLUMNS_DEFINITION[MutationColumn.VARIANT_ALLELE],
    MUTATION_COLUMNS_DEFINITION[MutationColumn.CLINVAR],
];

export function mergeColumns(
    defaultColumns: Column<Partial<Mutation>>[],
    customColumns: Column<Partial<Mutation>>[]
) {
    const merged: Column<Partial<Mutation>>[] = [];
    const overrides: Column<Partial<Mutation>>[] = [];

    defaultColumns.forEach(column => {
        const colOverride = customColumns.find(c => c.id === column.id);
        merged.push(colOverride || column);

        if (colOverride) {
            overrides.push(colOverride);
        }
    });

    return [...merged, ..._.difference(customColumns, overrides)];
}
