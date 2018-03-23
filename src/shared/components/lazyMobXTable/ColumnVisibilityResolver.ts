import {Column} from "./LazyMobXTable";

export function resolveColumnVisibilityByColumnDefinition<T>(columns: Column<T>[]): {[columnId: string]: boolean}
{
    const colVis:{[columnId: string]: boolean} = {};

    columns.forEach((column:Column<T>) => {
        // every column is visible by default unless it is flagged otherwise
        let visible = true;

        if (column.visible !== undefined) {
            visible = column.visible;
        }

        colVis[column.name] = visible;
    });

    return colVis;
}

export function resolveColumnVisibility(columnVisibilityByColumnDefinition: {[columnId: string]: boolean},
                                        columnVisibility?: {[columnId: string]: boolean},
                                        columnVisibilityOverride?: {[columnId: string]: boolean}): {[columnId: string]: boolean}
{
    let colVis: {[columnId: string]: boolean};

    // if a custom columnVisibility object is provided use that one
    if (columnVisibility) {
        colVis = {...columnVisibility};
    }
    else  {
        colVis = {
            // resolve visibility by column definition
            ...columnVisibilityByColumnDefinition,
            // if exists override with the state from the latest user selection
            ...(columnVisibilityOverride || {})
        };
    }

    return colVis;
}
