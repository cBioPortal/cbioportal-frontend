import { FunctionalImpactData } from './FunctionalImpactColumnFormatter';
import { optionId } from 'shared/components/sectionedFilterMenu/SectionedFilterUtils';
import { SectionedFilterSection } from 'shared/components/sectionedFilterMenu/SectionedFilterMenu';

/**
 * Functional impact column filter options, grouped by predictor, e.g.
 * "sift:deleterious" or "polyphen2:none" (see SectionedFilterUtils).
 */
export enum FunctionalImpactFilterSource {
    MUTATION_ASSESSOR = 'mutationAssessor',
    SIFT = 'sift',
    POLYPHEN2 = 'polyphen2',
    ALPHAMISSENSE = 'alphaMissense',
}

// option of the mutations without a prediction of the predictor
export const NO_PREDICTION = 'none';

function normalizePrediction(prediction: string | undefined) {
    return prediction ? prediction.trim().toLowerCase() : NO_PREDICTION;
}

// all filter options that match the functional impact data of a mutation
export function getFunctionalImpactOptionIds(
    data: FunctionalImpactData,
    showMutationAssessor: boolean
): string[] {
    const ids = [
        optionId(
            FunctionalImpactFilterSource.SIFT,
            normalizePrediction(data.siftPrediction)
        ),
        optionId(
            FunctionalImpactFilterSource.POLYPHEN2,
            normalizePrediction(data.polyPhenPrediction)
        ),
        optionId(
            FunctionalImpactFilterSource.ALPHAMISSENSE,
            normalizePrediction(data.alphaMissensePrediction)
        ),
    ];
    if (showMutationAssessor) {
        ids.push(
            optionId(
                FunctionalImpactFilterSource.MUTATION_ASSESSOR,
                normalizePrediction(
                    data.mutationAssessor &&
                        data.mutationAssessor.functionalImpactPrediction
                )
            )
        );
    }
    return ids;
}

// e.g. "deleterious_low_confidence" -> "Deleterious (low confidence)"
export function formatPrediction(prediction: string) {
    if (prediction === NO_PREDICTION) {
        return 'No prediction';
    }
    const text = prediction
        .replace(/_low_confidence$/, ' (low confidence)')
        .replace(/_/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function section(
    id: FunctionalImpactFilterSource,
    title: string,
    predictions: string[]
): SectionedFilterSection {
    return {
        id,
        title,
        options: [...predictions, NO_PREDICTION].map(prediction => ({
            id: optionId(id, prediction),
            label: formatPrediction(prediction),
        })),
        labelOtherOption: formatPrediction,
    };
}

/**
 * Sections of the functional impact column filter, one per predictor, with the
 * predictions of the column legend.
 */
export function getFunctionalImpactFilterSections(
    showMutationAssessor: boolean
): SectionedFilterSection[] {
    return [
        ...(showMutationAssessor
            ? [
                  section(
                      FunctionalImpactFilterSource.MUTATION_ASSESSOR,
                      'Mutation Assessor',
                      ['high', 'medium', 'low', 'neutral']
                  ),
              ]
            : []),
        section(FunctionalImpactFilterSource.SIFT, 'SIFT', [
            'deleterious',
            'deleterious_low_confidence',
            'tolerated_low_confidence',
            'tolerated',
        ]),
        section(FunctionalImpactFilterSource.POLYPHEN2, 'PolyPhen-2', [
            'probably_damaging',
            'possibly_damaging',
            'benign',
        ]),
        section(FunctionalImpactFilterSource.ALPHAMISSENSE, 'AlphaMissense', [
            'pathogenic',
            'ambiguous',
            'benign',
        ]),
    ];
}
