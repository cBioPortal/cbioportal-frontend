import { MatchLevel } from './wsiViewerTypes';

/** Block label without a leading "Block", which some sources already include. */
export function blockName(label: string): string {
    return label.replace(/^block\s+/i, '');
}

export function formatSpecimenLabel(
    specimen: Pick<
        {
            match_level: MatchLevel;
            part_number?: string | null;
            part_description?: string | null;
            block_label?: string | null;
            block_number?: string | null;
        },
        | 'match_level'
        | 'part_number'
        | 'part_description'
        | 'block_label'
        | 'block_number'
    >
): string {
    const partLabel = specimen.part_number
        ? `Part ${specimen.part_number}`
        : specimen.part_description || 'Specimen';
    const blockLabel = specimen.block_label || specimen.block_number || null;

    if (specimen.match_level === 'BLOCK' && blockLabel) {
        return `${partLabel} / Block ${blockName(blockLabel)}`;
    }

    return partLabel;
}
