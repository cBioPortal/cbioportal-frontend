export interface ISimpleColumnVisibilityDef {
    name: string;
    id?: string;
    visible?: boolean;
}

export function resolveColumnVisibilityByColumnDefinition(columns: ISimpleColumnVisibilityDef[] = []): {[columnId: string]: boolean}
{
    const colVis:{[columnId: string]: boolean} = {};

    columns.forEach((column: ISimpleColumnVisibilityDef) => {
        // every column is visible by default unless it is flagged otherwise
        let visible = true;

        if (column.visible !== undefined) {
            visible = column.visible;
        }

        // if no id exists, just use name for key
        const key = column.id || column.name;

        colVis[key] = visible;
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

export function toggleColumnVisibility(columnVisibility: {[columnId: string]: boolean}|undefined,
                                       columnId: string,
                                       columnVisibilityDefs?: ISimpleColumnVisibilityDef[]): {[columnId: string]: boolean}
{
    let colVis = columnVisibility;

    // if not init yet: it means that no prior user action on column visibility
    // just copy the contents from the provided columnVisibility definition
    if (!colVis) {
        colVis = resolveColumnVisibilityByColumnDefinition(columnVisibilityDefs);
    }

    // toggle column visibility
    colVis[columnId] = !colVis[columnId];

    return colVis;
}
