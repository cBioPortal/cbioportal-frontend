import * as React  from 'react';
import * as _ from 'lodash';
import {CosmicMutation} from "../../api/generated/CBioPortalAPIInternal";
import EnhancedReactTable from "../enhancedReactTable/EnhancedReactTable";
import {IEnhancedReactTableProps} from "../enhancedReactTable/IEnhancedReactTableProps";
import ProteinChangeColumnFormatter from "../mutationTable/column/ProteinChangeColumnFormatter";


export interface ICosmicTableProps extends IEnhancedReactTableProps<CosmicMutation> {}

// EnhancedReactTable is a generic component which requires data type argument
class ReactTable extends EnhancedReactTable<CosmicMutation> {}

/**
 * @author Selcuk Onur Sumer
 */
export default class CosmicMutationTable extends React.Component<ICosmicTableProps, {}>
{

    constructor(props: ICosmicTableProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        const {
            reactTableProps,
            initItemsPerPage,
            headerControlsProps,
            columns,
            rawData
        } = this.mergeProps(this.props);

        return(
            <div>
                <ReactTable
                    reactTableProps={reactTableProps}
                    initItemsPerPage={initItemsPerPage}
                    headerControlsProps={headerControlsProps}
                    columns={columns}
                    rawData={rawData}
                />
            </div>
        );
    }

    private mergeProps(props:ICosmicTableProps):ICosmicTableProps
    {
        const columns = {
            cosmicId: {
                name: "COSMIC ID",
                priority: 1.00,
                dataField: "cosmicMutationId",
                sortable: true
            },
            proteinChange: {
                name: "Protein Change",
                priority: 2.00,
                dataField: "proteinChange",
                sortable: (a:string, b:string)=>{
                    const aValue = ProteinChangeColumnFormatter.extractSortValue(a);
                    const bValue = ProteinChangeColumnFormatter.extractSortValue(b);
                    if (aValue === bValue) {
                        return 0;
                    } else if (aValue === null) {
                        return 1;
                    } else if (bValue === null) {
                        return -1;
                    } else {
                        return aValue > bValue ? 1 : -1;
                    }
                },
                filterable: true
            },
            occurrence: {
                name: "Occurrence",
                priority: 3.00,
                dataField: "count",
                sortable: true
            }
        };

        const defaultProps:ICosmicTableProps = {
            rawData: [],
            columns: columns,
            initItemsPerPage: 10,
            headerControlsProps: {
                showPagination: true,
                showHideShowColumnButton: false,
                showCopyAndDownload: false,
                showSearch: false,
                copyDownloadClassName: "pull-right",
                searchClassName: "pull-left",
            },
            reactTableProps: {
                className: "table table-striped table-border-top",
                hideFilterInput:true,
                defaultSort: {column: columns.occurrence.name, direction: 'desc'}
            }
        };

        // merge provided props with the default props
        return _.merge(defaultProps, props);
    }
}
