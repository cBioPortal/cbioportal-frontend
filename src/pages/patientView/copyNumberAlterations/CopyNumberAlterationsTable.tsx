import * as React from 'react';
import EnhancedReactTable from "../../../shared/components/enhancedReactTable/EnhancedReactTable";
import {
    IColumnDefMap
} from "../../../shared/components/enhancedReactTable/IEnhancedReactTableProps";
import {DiscreteCopyNumberData} from "../../../shared/api/generated/CBioPortalAPI";
import {IColumnFormatterData} from "../../../shared/components/enhancedReactTable/IColumnFormatter";
import {ITableHeaderControlsProps} from "../../../shared/components/tableHeaderControls/TableHeaderControls";

// EnhancedReactTable is a generic component which requires data type argument
class ReactTable extends EnhancedReactTable<{}> {};

export interface ICopyNumberAlterationsTableProps  {
    rawData:DiscreteCopyNumberData[]
};

/**
 * @author Selcuk Onur Sumer
 */
export default class CopyNumberAlterationsTable extends React.Component<ICopyNumberAlterationsTableProps, {}>
{
    public static get columns():IColumnDefMap
    {
        return {
            gene: {
                name: "Gene",
                priority: 5.00,
                columnDataFunction: (data: IColumnFormatterData<DiscreteCopyNumberData>)=>{ return data.rowData!.gene.hugoGeneSymbol },
                sortable: true,
                filterable: true
            },

            cytoBand: {
                name: "Cytoband",
                priority: 5.00,
                columnDataFunction: (data: IColumnFormatterData<DiscreteCopyNumberData>)=>{ return data.rowData!.gene.cytoband },
                sortable: true,
                filterable: true
            },
        };
    };

    private headerControlsProps:ITableHeaderControlsProps;

    constructor(props:ICopyNumberAlterationsTableProps)
    {
        super(props);
        this.state = {};

        this.headerControlsProps = {
            showPagination: true,
            copyDownloadClassName: "pull-right",
            searchClassName: "pull-left",
        }
    }

    public render() {

        return (
            <div>
                <ReactTable
                    reactTableProps={{ className:"table table-striped table-border-top", hideFilterInput:true }}
                    initItemsPerPage={25}
                    headerControlsProps={this.headerControlsProps}
                    columns={CopyNumberAlterationsTable.columns}
                    rawData={this.props.rawData}
                />
            </div>
        );
    }

};

