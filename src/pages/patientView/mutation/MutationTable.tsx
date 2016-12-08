import * as React from 'react';
import EnhancedReactTable from "../../../shared/components/enhancedReactTable/EnhancedReactTable";
import IEnhancedReactTableProps from "../../../shared/components/enhancedReactTable/IEnhancedReactTableProps";
import GeneColumnFormatter from "./column/GeneColumnFormatter";
import SampleColumnFormatter from "./column/SampleColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationTable extends React.Component<IEnhancedReactTableProps, {}>
{
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
            columns: [
                {
                    name: "Gene",
                    formatter: GeneColumnFormatter,
                    sortable: true,
                    filterable: true,
                    visible: true
                },
                {
                    name: "Sample",
                    formatter: SampleColumnFormatter,
                    sortable: true,
                    filterable: true,
                    visible: true
                },
                {
                    name: "Start Pos",
                    dataField: "startPos",
                    sortable: true,
                    filterable: true,
                    visible: true
                },
                {
                    name: "center",
                    sortable: true,
                    filterable: true,
                    visible: true
                },
            ],
            reactTableProps: {
                className: "table",
                id: "table"
            }
        };

        // TODO merge provided props with the default props!
        return defaultProps;
    }
};

