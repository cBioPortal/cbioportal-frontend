import * as React from 'react';
import * as lodash from 'lodash';

import EnhancedReactTable from "../enhancedReactTable/EnhancedReactTable";
import {IColumnDefMap} from "../enhancedReactTable/IEnhancedReactTableProps";
import {IMutationTableProps} from "./IMutationTableProps";
import GeneColumnFormatter from "./column/GeneColumnFormatter";
import SampleColumnFormatter from "./column/SampleColumnFormatter";
import ProteinChangeColumnFormatter from "./column/ProteinChangeColumnFormatter";
import MutationAssessorColumnFormatter from "./column/MutationAssessorColumnFormatter";
import MutationTypeColumnFormatter from "./column/MutationTypeColumnFormatter";
import TableHeaderControls from "shared/components/tableHeaderControls/TableHeaderControls";


/**
 * @author Selcuk Onur Sumer
 */
export default class MutationTable extends React.Component<IMutationTableProps, { filter:string }>
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
            mutationType: {
                name: "Mutation Type",
                priority: 4.00,
                formatter: MutationTypeColumnFormatter.renderFunction,
                sortable: true,
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
                sortable: false,
                filterable: false
            },
            variantAllele: {
                name: "Var",
                priority: 8.00,
                dataField: "variantAllele",
                sortable: false,
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
            center: {
                name: "Center",
                priority: 11.00,
                dataField: "center",
                sortable: true,
                filterable: true
            },
            mutationAssessor: {
                name: "Mutation Assessor",
                priority: 12.00,
                formatter: MutationAssessorColumnFormatter.renderFunction,
                sortable: MutationAssessorColumnFormatter.sortFunction,
                filterable: true
            },
            normalRefCount: {
                name: "Ref Count (N)",
                priority: 13.00,
                dataField: "normalRefCount"
            },
            normalAltCount: {
                name: "Alt Count (N)",
                priority: 14.00,
                dataField: "normalAltCount"
            },
            tumorRefCount: {
                name: "Ref Count (T)",
                priority: 15.00,
                dataField: "tumorRefCount"
            },
            tumorAltCount: {
                name: "Alt Count (T)",
                priority: 16.00,
                dataField: "tumorAltCount"
            },
            // TODO we don't have data field for frequencies, we need to calculate them!
            normalAlleleFreq : {
                name: "Allele Freq (N)",
                priority: 17.00
            },
            tumorAlleleFreq: {
                name: "Allele Freq (T)",
                priority: 18.00
            }
        };
    };

    constructor(props:IMutationTableProps)
    {
        super(props);
        this.state = { filter:'' };

        // binding "this" to handler functions
        this.handleFilterInput = this.handleFilterInput.bind(this);
    }

    public render()
    {
        const {reactTableProps, columns, rawData, title} = this.mergeProps(this.props);

        return(
            <div>
                <h4 className="pull-left">{title}</h4>
                <TableHeaderControls showCopyAndDownload={false} handleInput={this.handleFilterInput} showSearch={true} className="pull-right" />
                <EnhancedReactTable
                    reactTableProps={reactTableProps}
                    columns={columns}
                    rawData={rawData}
                />
            </div>
        );
    }

    private handleFilterInput(filter: string)
    {
        return this.setState({ filter:filter });
    }

    private mergeProps(props:IMutationTableProps):IMutationTableProps
    {
        const defaultProps:IMutationTableProps = {
            title: "Mutations",
            rawData: [],
            columns: MutationTable.defaultColumns,
            reactTableProps: {
                className: "table table-striped",
                hideFilterInput:true,
                filterBy:this.state.filter
            }
        };

        // merge provided props with the default props
        return lodash.merge(defaultProps, props);
    }
};

