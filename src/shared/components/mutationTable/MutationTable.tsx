import * as React from 'react';
import EnhancedReactTable from "../enhancedReactTable/EnhancedReactTable";
import {IEnhancedReactTableProps, IColumnDefMap} from "../enhancedReactTable/IEnhancedReactTableProps";
import GeneColumnFormatter from "./column/GeneColumnFormatter";
import SampleColumnFormatter from "./column/SampleColumnFormatter";
import ProteinChangeColumnFormatter from "./column/ProteinChangeColumnFormatter";

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
                formatter: SampleColumnFormatter,
                sortable: SampleColumnFormatter.sortFunction,
                filterable: true,
                visible: true
            },
            gene: {
                name: "Gene",
                formatter: GeneColumnFormatter,
                sortable: GeneColumnFormatter.sortFunction,
                filterable: true,
                visible: true
            },
            proteinChange: {
                name: "Protein Change",
                formatter: ProteinChangeColumnFormatter,
                sortable: ProteinChangeColumnFormatter.sortFunction,
                filterable: true,
                visible: true
            },
            startPos: {
                name: "Start Pos",
                dataField: "startPos",
                sortable: true,
                filterable: false,
                visible: true
            },
            endPos: {
                name: "End Pos",
                dataField: "endPos",
                sortable: true,
                filterable: false,
                visible: true
            },
            referenceAllele: {
                name: "Ref",
                dataField: "referenceAllele",
                sortable: false,
                filterable: false,
                visible: true
            },
            variantAllele: {
                name: "Var",
                dataField: "variantAllele",
                sortable: false,
                filterable: false,
                visible: true
            },
            mutationStatus: {
                name: "MS",
                dataField: "mutationStatus",
                sortable: true,
                filterable: true,
                visible: true
            },
            validationStatus: {
                name: "VS",
                dataField: "validationStatus",
                sortable: true,
                filterable: true,
                visible: true
            },
            center: {
                name: "center",
                sortable: true,
                filterable: true,
                visible: true
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

    private mergeProps(props:IEnhancedReactTableProps)
    {
        const rawData:Array<any> = props.rawData;

        const defaultProps:IEnhancedReactTableProps = {
            rawData,
            columns: MutationTable.defaultColumns,
            reactTableProps: {
                className: "table",
                id: "table"
            }
        };

        // TODO merge provided props with the default props!
        return defaultProps;
    }
};

