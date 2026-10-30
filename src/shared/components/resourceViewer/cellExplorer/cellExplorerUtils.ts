/** Resources with this id are shown in the Cell Explorer viewer, never in a frame. */
export const CELL_EXPLORER_RESOURCE_ID = 'CELL_EXPLORER';

/**
 * Keys of a CELL_EXPLORER row's metadata. The row's URL is the dataset's Cell Explorer page;
 * the metadata says what the viewer opens.
 */
export const CELL_EXPLORER_METADATA = {
    /** The dataset's AnnData zarr store. */
    zarrUrl: 'zarr_url',
    /** An obs column to color the cells by when the dataset opens. */
    colorByCategory: 'color_by_category',
    /** A gene to color the cells by when the dataset opens. */
    colorByGene: 'color_by_gene',
};

export type CellExplorerColorBy = { type: 'category' | 'gene'; value: string };

export function isCellExplorerResource(row: { resourceId: string }): boolean {
    return row.resourceId === CELL_EXPLORER_RESOURCE_ID;
}

/** The viewer's initial coloring, a category taking precedence over a gene. */
export function colorByFor(
    metadata: Record<string, string>
): CellExplorerColorBy | undefined {
    const category = metadata[CELL_EXPLORER_METADATA.colorByCategory];
    if (category) {
        return { type: 'category', value: category };
    }
    const gene = metadata[CELL_EXPLORER_METADATA.colorByGene];
    if (gene) {
        return { type: 'gene', value: gene };
    }
    return undefined;
}
