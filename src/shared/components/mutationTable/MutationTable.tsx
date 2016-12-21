import * as React from 'react';
import * as lodash from 'lodash';

import EnhancedReactTable from "../enhancedReactTable/EnhancedReactTable";
import {IEnhancedReactTableProps, IColumnDefMap} from "../enhancedReactTable/IEnhancedReactTableProps";
import GeneColumnFormatter from "./column/GeneColumnFormatter";
import SampleColumnFormatter from "./column/SampleColumnFormatter";
import ProteinChangeColumnFormatter from "./column/ProteinChangeColumnFormatter";
import MutationAssessorColumnFormatter from "./column/MutationAssessorColumnFormatter";
import MutationTypeColumnFormatter from "./column/MutationTypeColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationTable extends React.Component<IEnhancedReactTableProps, {}>
{
    public static get defaultColumns():IColumnDefMap
    {
        return {
            sampleId: {
                name: "Sample",
                formatter: SampleColumnFormatter.renderFunction,
                sortable: true,
                filterable: true
            },
            gene: {
                name: "Gene",
                formatter: GeneColumnFormatter.renderFunction,
                sortable: true,
                filterable: true
            },
            proteinChange: {
                name: "Protein Change",
                formatter: ProteinChangeColumnFormatter.renderFunction,
                sortable: ProteinChangeColumnFormatter.sortFunction,
                filterable: true
            },
            mutationType: {
                name: "Mutation Type",
                formatter: MutationTypeColumnFormatter.renderFunction,
                sortable: true,
                filterable: true
            },
            startPos: {
                name: "Start Pos",
                dataField: "startPos",
                sortable: true,
                filterable: false
            },
            endPos: {
                name: "End Pos",
                dataField: "endPos",
                sortable: true,
                filterable: false
            },
            referenceAllele: {
                name: "Ref",
                dataField: "referenceAllele",
                sortable: false,
                filterable: false
            },
            variantAllele: {
                name: "Var",
                dataField: "variantAllele",
                sortable: false,
                filterable: false
            },
            mutationStatus: {
                name: "MS",
                dataField: "mutationStatus",
                sortable: true,
                filterable: true
            },
            validationStatus: {
                name: "VS",
                dataField: "validationStatus",
                sortable: true,
                filterable: true
            },
            center: {
                name: "Center",
                dataField: "center",
                sortable: true,
                filterable: true
            },
            mutationAssessor: {
                name: "Mutation Assessor",
                formatter: MutationAssessorColumnFormatter.renderFunction,
                sortable: MutationAssessorColumnFormatter.sortFunction,
                filterable: true
            },
            normalRefCount: {
                name: "Ref Count (N)",
                dataField: "normalRefCount"
            },
            normalAltCount: {
                name: "Alt Count (N)",
                dataField: "normalAltCount"
            },
            tumorRefCount: {
                name: "Ref Count (T)",
                dataField: "tumorRefCount"
            },
            tumorAltCount: {
                name: "Alt Count (T)",
                dataField: "tumorAltCount"
            },
            // TODO we don't have data field for frequencies, we need to calculate them!
            normalAlleleFreq : {
                name: "Allele Freq (N)"
            },
            tumorAlleleFreq: {
                name: "Allele Freq (T)"
            }
        };
    };

    constructor(props:IEnhancedReactTableProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        const {reactTableProps, columns, rawData} = this.mergeProps(this.props);

        return(
            <EnhancedReactTable
                reactTableProps={reactTableProps}
                columns={columns}
                rawData={rawData}
            />
        );
    }

    private mergeProps(props:IEnhancedReactTableProps):IEnhancedReactTableProps
    {
        const defaultProps:IEnhancedReactTableProps = {
            rawData: [],
            columns: MutationTable.defaultColumns,
            reactTableProps: {
                className: "table table-striped"
            }
        };

        // merge provided props with the default props
        return lodash.merge(defaultProps, props);
    }
};

