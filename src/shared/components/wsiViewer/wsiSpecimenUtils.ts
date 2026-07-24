import { MatchLevel } from './wsiViewerTypes';

export function formatSpecimenLabel(
    association: Pick<
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
    const partLabel = association.part_number
        ? `Part ${association.part_number}`
        : association.part_description || 'Specimen';
    const blockLabel =
        association.block_label || association.block_number || null;

    if (association.match_level === 'BLOCK' && blockLabel) {
        return `${partLabel} / Block ${blockLabel}`;
    }

    return partLabel;
}
