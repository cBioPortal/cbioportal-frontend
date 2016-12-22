import * as React from 'react';
import * as lodash from 'lodash';

import EnhancedReactTable from "../enhancedReactTable/EnhancedReactTable";
import {IEnhancedReactTableProps, IColumnDefMap} from "../enhancedReactTable/IEnhancedReactTableProps";
import GeneColumnFormatter from "./column/GeneColumnFormatter";
import SampleColumnFormatter from "./column/SampleColumnFormatter";
import ProteinChangeColumnFormatter from "./column/ProteinChangeColumnFormatter";
import MutationAssessorColumnFormatter from "./column/MutationAssessorColumnFormatter";
import MutationTypeColumnFormatter from "./column/MutationTypeColumnFormatter";
import {IColumnFormatterData} from '../enhancedReactTable/IColumnFormatter';

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationTable extends React.Component<IEnhancedReactTableProps, {}>
{
    private static makeSingleValueColumnDataGetter(dataField:string) {
        return function(data:IColumnFormatterData) {
            let ret = null;

            if (data.columnData)
            {
                ret = data.columnData;
            }
            else if (data.rowData)
            {
                const rowDataArr = [].concat(data.rowData);
                if (rowDataArr.length > 0) {
                    ret = rowDataArr[0][dataField];
                }
            }

            return ret;
        };
    }

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
                columnData: MutationTable.makeSingleValueColumnDataGetter("startPos"),
                sortable: true,
                filterable: false
            },
            endPos: {
                name: "End Pos",
                priority: 6.00,
                columnData: MutationTable.makeSingleValueColumnDataGetter("endPos"),
                sortable: true,
                filterable: false
            },
            referenceAllele: {
                name: "Ref",
                priority: 7.00,
                columnData: MutationTable.makeSingleValueColumnDataGetter("referenceAllele"),
                sortable: false,
                filterable: false
            },
            variantAllele: {
                name: "Var",
                priority: 8.00,
                columnData: MutationTable.makeSingleValueColumnDataGetter("variantAllele"),
                sortable: false,
                filterable: false
            },
            mutationStatus: {
                name: "MS",
                priority: 9.00,
                columnData: MutationTable.makeSingleValueColumnDataGetter("mutationStatus"),
                sortable: true,
                filterable: true
            },
            validationStatus: {
                name: "VS",
                priority: 10.00,
                columnData: MutationTable.makeSingleValueColumnDataGetter("validationStatus"),
                sortable: true,
                filterable: true
            },
            center: {
                name: "Center",
                priority: 11.00,
                columnData: MutationTable.makeSingleValueColumnDataGetter("center"),
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
                dataField:"normalRefCount"
            },
            normalAltCount: {
                name: "Alt Count (N)",
                priority: 14.00,
                dataField:"normalAltCount"
            },
            tumorRefCount: {
                name: "Ref Count (T)",
                priority: 15.00,
                dataField:"tumorRefCount"
            },
            tumorAltCount: {
                name: "Alt Count (T)",
                priority: 16.00,
                dataField:"tumorAltCount"
            },
            /*
            // TODO we don't have data field for frequencies, we need to calculate them!
            normalAlleleFreq : {
                name: "Allele Freq (N)",
                priority: 17.00
            },
            tumorAlleleFreq: {
                name: "Allele Freq (T)",
                priority: 18.00
            }*/
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

