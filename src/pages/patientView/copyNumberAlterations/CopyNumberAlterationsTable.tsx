import * as React from 'react';
import * as _ from 'lodash';

import EnhancedReactTable from "../../../shared/components/enhancedReactTable/EnhancedReactTable";
import {IColumnDefMap} from "../../../shared/components/enhancedReactTable/IEnhancedReactTableProps";

// EnhancedReactTable is a generic component which requires data type argument
class ReactTable extends EnhancedReactTable<MutationTableRowData> {};

export interface ICopyNumberAlterationsTableProps  {



};

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationTable extends React.Component<ICopyNumberAlterationsTableProps, {}>
{
    public static get defaultColumns():IColumnDefMap
    {
        return {

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
            }
        };
    };

    constructor(props:ICopyNumberAlterationsTableProps)
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
        } = this.props;

        return(
            <div>
                <ReactTable
                    itemsName="mutations"
                    reactTableProps={reactTableProps}
                    initItemsPerPage={initItemsPerPage}
                    headerControlsProps={headerControlsProps}
                    columns={columns}
                    rawData={rawData}
                />
            </div>
        );
    }

    // private mergeProps(props:IMutationTableProps):IMutationTableProps
    // {
    //     const defaultProps:IMutationTableProps = {
    //         title: "Mutations",
    //         rawData: [],
    //         columns: MutationTable.defaultColumns,
    //         initItemsPerPage: 25,
    //         headerControlsProps: {
    //             showPagination: true,
    //             copyDownloadClassName: "pull-right",
    //             searchClassName: "pull-left",
    //         },
    //         reactTableProps: {
    //             className: "table table-striped table-border-top",
    //             hideFilterInput:true
    //         }
    //     };
    //
    //     // merge provided props with the default props
    //     return _.merge(defaultProps, props);
    // }
};

