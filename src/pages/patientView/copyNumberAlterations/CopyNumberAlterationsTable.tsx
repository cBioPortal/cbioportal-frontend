import * as React from 'react';
import * as _ from 'lodash';

import EnhancedReactTable from "../../../shared/components/enhancedReactTable/EnhancedReactTable";
import {IColumnDefMap} from "../../../shared/components/enhancedReactTable/IEnhancedReactTableProps";

// EnhancedReactTable is a generic component which requires data type argument
class ReactTable extends EnhancedReactTable<{}> {};

export interface ICopyNumberAlterationsTableProps  {



};

/**
 * @author Selcuk Onur Sumer
 */
export default class CopyNumberAlterationsTable extends React.Component<ICopyNumberAlterationsTableProps, {}>
{
    public static get columns():IColumnDefMap
    {
        return {

            startPos: {
                name: "Start Pos",
                priority: 5.00,
                dataField: "sampleId",
                sortable: true,
                filterable: false
            },
            // endPos: {
            //     name: "End Pos",
            //     priority: 6.00,
            //     dataField: "endPosition",
            //     sortable: true,
            //     filterable: false
            // },
            // referenceAllele: {
            //     name: "Ref",
            //     priority: 7.00,
            //     dataField: "referenceAllele",
            //     sortable: true,
            //     filterable: false
            // },
            // variantAllele: {
            //     name: "Var",
            //     priority: 8.00,
            //     dataField: "variantAllele",
            //     sortable: true,
            //     filterable: false
            // }
        };
    };

    constructor(props:ICopyNumberAlterationsTableProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {

        const defaultProps:ICopyNumberAlterationsTableProps = {
            title: "Copy Number Alterations",
            rawData: [],
            initItemsPerPage: 25,
            headerControlsProps: {
                showPagination: true,
                copyDownloadClassName: "pull-right",
                searchClassName: "pull-left",
            },
            reactTableProps: {
                className: "table table-striped table-border-top",
                hideFilterInput:true
            }
        };


        console.log(this);

        return(
            <div>
                <ReactTable
                    reactTableProps={defaultProps.reactTableProps}
                    initItemsPerPage={defaultProps.initItemsPerPage}
                    headerControlsProps={defaultProps.headerControlsProps}
                    columns={CopyNumberAlterationsTable.columns}
                    rawData={this.props.rawData}
                />
            </div>
        );
    }

};

