import {observer} from "mobx-react";
import * as React from "react";

import {ColumnSelector, ColumnSelectorProps, ColumnVisibilityDef} from "../ColumnSelector";

type DataTableToolbarProps = {
    showColumnVisibility?: boolean;
    visibilityToggle?: (selectedColumnIds: string[]) => void;
    columnVisibility?: ColumnVisibilityDef[];
    columnSelectorProps?: ColumnSelectorProps;
}

@observer
export default class DataTableToolbar extends React.Component<DataTableToolbarProps, {}>
{
    public static defaultProps: Partial<DataTableToolbarProps> = {
        showColumnVisibility: true
    };

    public render()
    {
        return (
            <div
                className="dataTableMainToolbar"
                style={{paddingBottom: "0.4rem"}}
            >
                {this.props.showColumnVisibility && (
                    <div
                        className="small"
                        style={{width: 150, marginLeft: "auto"}}
                    >
                        <ColumnSelector
                            columnVisibility={this.props.columnVisibility}
                            onColumnToggled={this.props.visibilityToggle}
                            {...this.props.columnSelectorProps}
                        />
                    </div>
                )}
            </div>
        );
    }

}
