import _ from 'lodash';
import Pluralize from 'pluralize';

export type StructuralVariantLabel = 'structural variant' | 'fusion';

export type StructuralVariantLabelResolver = () => StructuralVariantLabel;

export function resolveStructuralVariantLabel(
    resolver?: StructuralVariantLabelResolver,
    showFusionTerminology?: boolean
): StructuralVariantLabel {
    if (resolver) {
        return resolver();
    }

    return showFusionTerminology ? 'fusion' : 'structural variant';
}

export function toPluralStructuralVariantLabel(
    label: StructuralVariantLabel
): string {
    return Pluralize(label).toLowerCase();
}

export function toLowerCaseStructuralVariantLabel(
    label: StructuralVariantLabel
): string {
    return Pluralize.singular(label).toLowerCase();
}

export function toLowerCasePluralStructuralVariantLabel(
    label: StructuralVariantLabel
): string {
    return Pluralize(label).toLowerCase();
}

export function toTitleCaseStructuralVariantLabel(
    label: StructuralVariantLabel
): string {
    return _.startCase(toLowerCaseStructuralVariantLabel(label));
}

export function toTitleCasePluralStructuralVariantLabel(
    label: StructuralVariantLabel
): string {
    return _.startCase(toLowerCasePluralStructuralVariantLabel(label));
}

export function toSentenceCaseStructuralVariantLabel(
    label: StructuralVariantLabel
): string {
    return _.upperFirst(toLowerCaseStructuralVariantLabel(label));
}

export function toSentenceCasePluralStructuralVariantLabel(
    label: StructuralVariantLabel
): string {
    return _.upperFirst(toLowerCasePluralStructuralVariantLabel(label));
}

export function toShortStructuralVariantLabel(
    label: StructuralVariantLabel
): string {
    return label === 'fusion' ? 'fusion' : 'SV';
}
