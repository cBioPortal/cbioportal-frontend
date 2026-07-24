import { Mutation } from 'cbioportal-ts-api-client';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { IMutationLabelSpec } from './StructureVisualizer';
import {
    formatMutationDetailLines,
    formatMutationLabelShort,
} from './VariantAnnotationFormatting';

export function buildMutationLabels(
    options: {
        mutationsByPosition: { [pos: number]: Mutation[] };
        proteinToStructurePosition: (proteinPosition: number) => number | undefined;
        isHighlighted: (proteinPosition: number) => boolean;
        indexedVariantAnnotations?: {
            [genomicLocation: string]: VariantAnnotation;
        };
    }
): IMutationLabelSpec[] {
    const labels: IMutationLabelSpec[] = [];

    Object.keys(options.mutationsByPosition).forEach(positionKey => {
        const proteinPosition = parseInt(positionKey, 10);
        const mutations = options.mutationsByPosition[proteinPosition];

        if (
            Number.isNaN(proteinPosition) ||
            !mutations ||
            mutations.length === 0
        ) {
            return;
        }

        const structurePosition =
            options.proteinToStructurePosition(proteinPosition);

        if (structurePosition == null) {
            return;
        }

        labels.push({
            proteinPosition,
            structurePosition,
            labelText: formatMutationLabelShort(
                mutations,
                options.indexedVariantAnnotations
            ),
            detailLines: formatMutationDetailLines(
                mutations,
                options.indexedVariantAnnotations
            ),
            highlighted: options.isHighlighted(proteinPosition),
        });
    });

    return labels.sort((a, b) => a.structurePosition - b.structurePosition);
}
