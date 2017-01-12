import * as React from 'react';
import * as lodash from 'lodash';

import EnhancedReactTable from "../enhancedReactTable/EnhancedReactTable";
import {IColumnDefMap} from "../enhancedReactTable/IEnhancedReactTableProps";
import {IMutationTableProps, MutationTableRowData} from "./IMutationTableProps";
import GeneColumnFormatter from "./column/GeneColumnFormatter";
import ChromosomeColumnFormatter from "./column/ChromosomeColumnFormatter";
import SampleColumnFormatter from "./column/SampleColumnFormatter";
import ProteinChangeColumnFormatter from "./column/ProteinChangeColumnFormatter";
import MutationAssessorColumnFormatter from "./column/MutationAssessorColumnFormatter";
import MutationTypeColumnFormatter from "./column/MutationTypeColumnFormatter";

// EnhancedReactTable is a generic component which requires data type argument
class ReactTable extends EnhancedReactTable<MutationTableRowData> {};

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationTable extends React.Component<IMutationTableProps, {}>
{
    public static get defaultColumns():IColumnDefMap
    {
        return {
            sampleId: {
                name: "Sample",
                priority: 1.00,
                formatter: SampleColumnFormatter.renderFunction,
                sortable: true,
                filterable: true
            },
            gene: {
                name: "Gene",
                priority: 2.00,
                formatter: GeneColumnFormatter.renderFunction,
                sortable: true,
                filterable: true
            },
            proteinChange: {
                name: "Protein Change",
                priority: 3.00,
                formatter: ProteinChangeColumnFormatter.renderFunction,
                sortable: ProteinChangeColumnFormatter.sortFunction,
                filterable: true
            },
            chromosome: {
                name: "Chromosome",
                priority: 4.00,
                columnData: ChromosomeColumnFormatter.getData,
                sortable: ChromosomeColumnFormatter.sortFunction,
                filterable: true
            },
            startPos: {
                name: "Start Pos",
                priority: 5.00,
                dataField: "startPosition",
                sortable: true,
                filterable: false
            },
            endPos: {
                name: "End Pos",
                priority: 6.00,
                dataField: "endPosition",
                sortable: true,
                filterable: false
            },
            referenceAllele: {
                name: "Ref",
                priority: 7.00,
                dataField: "referenceAllele",
                sortable: true,
                filterable: false
            },
            variantAllele: {
                name: "Var",
                priority: 8.00,
                dataField: "variantAllele",
                sortable: true,
                filterable: false
            },
            mutationStatus: {
                name: "MS",
                priority: 9.00,
                dataField: "mutationStatus",
                sortable: true,
                filterable: true
            },
            validationStatus: {
                name: "VS",
                priority: 10.00,
                dataField: "validationStatus",
                sortable: true,
                filterable: true
            },
            mutationType: {
                name: "Mutation Type",
                priority: 11.00,
                formatter: MutationTypeColumnFormatter.renderFunction,
                sortable: true,
                filterable: true
            },
            center: {
                name: "Center",
                priority: 12.00,
                dataField: "center",
                sortable: true,
                filterable: true
            },
            tumorAlleleFreq: {
                name: "Allele Freq (T)",
                priority: 13.00,
                sortable: true
            },
            tumorAltCount: {
                name: "Alt Count (T)",
                priority: 14.00,
                dataField: "tumorAltCount",
                sortable: true
            },
            tumorRefCount: {
                name: "Ref Count (T)",
                priority: 15.00,
                dataField: "tumorRefCount",
                sortable: true
            },
            normalAlleleFreq : {
                name: "Allele Freq (N)",
                priority: 16.00,
                sortable: true
            },
            normalAltCount: {
                name: "Alt Count (N)",
                priority: 17.00,
                dataField: "normalAltCount",
                sortable: true
            },
            normalRefCount: {
                name: "Ref Count (N)",
                priority: 18.00,
                dataField: "normalRefCount",
                sortable: true
            },
            mutationAssessor: {
                name: "Mutation Assessor",
                priority: 19.00,
                formatter: MutationAssessorColumnFormatter.renderFunction,
                sortable: MutationAssessorColumnFormatter.sortFunction,
                filterable: true
            }
        };
    };

    constructor(props:IMutationTableProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        const {reactTableProps, headerControlsProps, columns, rawData} = this.mergeProps(this.props);

        return(
            <div>
                <ReactTable
                    itemsName="mutations"
                    reactTableProps={reactTableProps}
                    headerControlsProps={headerControlsProps}
                    columns={columns}
                    rawData={rawData}
                />
            </div>
        );
    }

    private mergeProps(props:IMutationTableProps):IMutationTableProps
    {
        const defaultProps:IMutationTableProps = {
            title: "Mutations",
            rawData: [],
            columns: MutationTable.defaultColumns,
            headerControlsProps: {
                className: "pull-right"
            },
            reactTableProps: {
                className: "table table-striped table-border-top",
                hideFilterInput:true
            }
        };

        // merge provided props with the default props
        return lodash.merge(defaultProps, props);
    }
};

