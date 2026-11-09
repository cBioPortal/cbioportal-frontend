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
    /** An obs column whose values identify the cBioPortal samples or patients the cells are from. */
    zarrIdColumn: 'zarr_id_column',
    /** SAMPLE_ID, or the sample attribute whose values appear in the zarr ID column. */
    sampleIdAttribute: 'cbioportal_sample_id_attribute',
    /** PATIENT_ID, or the patient attribute whose values appear in the zarr ID column. */
    patientIdAttribute: 'cbioportal_patient_id_attribute',
};

export type CellExplorerColorBy = { type: 'category' | 'gene'; value: string };

/** How a dataset's cells are matched to cBioPortal samples or patients. */
export type CellExplorerIdMapping = {
    zarrColumn: string;
    level: 'sample' | 'patient';
    /** SAMPLE_ID or PATIENT_ID for the IDs themselves, otherwise a clinical attribute. */
    attribute: string;
};

/** Samples a page has selected; they say which cells to highlight. */
export type CellExplorerSelection = {
    studyId: string;
    sampleId: string;
    patientId: string;
}[];

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

/** How the cells match cBioPortal, a sample attribute taking precedence over a patient one. */
export function idMappingFor(
    metadata: Record<string, string>
): CellExplorerIdMapping | undefined {
    const zarrColumn = metadata[CELL_EXPLORER_METADATA.zarrIdColumn];
    if (!zarrColumn) {
        return undefined;
    }
    const sampleAttribute = metadata[CELL_EXPLORER_METADATA.sampleIdAttribute];
    if (sampleAttribute) {
        return { zarrColumn, level: 'sample', attribute: sampleAttribute };
    }
    const patientAttribute =
        metadata[CELL_EXPLORER_METADATA.patientIdAttribute];
    if (patientAttribute) {
        return { zarrColumn, level: 'patient', attribute: patientAttribute };
    }
    return undefined;
}

/** Whether the zarr holds the sample or patient IDs themselves rather than an attribute's values. */
export function mapsToIds(mapping: CellExplorerIdMapping): boolean {
    return (
        mapping.attribute ===
        (mapping.level === 'sample' ? 'SAMPLE_ID' : 'PATIENT_ID')
    );
}

/**
 * The zarr IDs of the selected samples or their patients in one study. attributeValues maps a
 * sample or patient ID to its value of the mapping's attribute; selections without a value are
 * left out.
 */
export function zarrIdsFor(
    mapping: CellExplorerIdMapping,
    studyId: string,
    selection: CellExplorerSelection,
    attributeValues?: Map<string, string>
): string[] {
    const ids = new Set<string>();
    for (const sample of selection) {
        if (sample.studyId !== studyId) {
            continue;
        }
        const id =
            mapping.level === 'sample' ? sample.sampleId : sample.patientId;
        const zarrId = mapsToIds(mapping) ? id : attributeValues?.get(id);
        if (zarrId) {
            ids.add(zarrId);
        }
    }
    return Array.from(ids);
}
