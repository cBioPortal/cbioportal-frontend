import * as React from 'react';
import _ from 'lodash';
import mainStyles from './main.module.scss';
import { OTHER_BIOMARKER_HUGO_SYMBOL } from './constants';

type OncoKbCardDefaultTitleProps = {
    isGermline?: boolean;
    hugoSymbol: string;
    cDnaChange?: string;
    tumorType: string;
    proteinChange?: string;
    displayCancerTypeInTitle?: boolean;
};

// A structural variant's alteration is already a complete label
// ("BRCA1-SORCS2 Fusion", "BRCA1 intragenic") rather than a protein change, so
// it takes no "p." prefix and does not repeat the gene symbol it already names.
const STRUCTURAL_VARIANT_ALTERATION_PATTERN = /\b(fusion|intragenic)\b/i;

export function isStructuralVariantAlteration(alteration: string | undefined) {
    return (
        !!alteration && STRUCTURAL_VARIANT_ALTERATION_PATTERN.test(alteration)
    );
}

function getProteinChangeForDisplay(proteinChange: string | undefined) {
    if (!proteinChange || isStructuralVariantAlteration(proteinChange)) {
        return proteinChange;
    }
    if (!proteinChange.startsWith('p.') && /\d/.test(proteinChange)) {
        return `p.${proteinChange}`;
    }
    return proteinChange;
}

function alterationNamesGene(
    alteration: string | undefined,
    hugoSymbol: string
) {
    return (
        !!alteration &&
        !!hugoSymbol &&
        alteration.toUpperCase().includes(hugoSymbol.toUpperCase())
    );
}

function getCdnaChangeForDisplay(cDnaChange: string | undefined) {
    return cDnaChange ? cDnaChange.split(':').pop() : undefined;
}

function getDisplayTumorType(tumorType: string) {
    return _.chain(tumorType)
        .toLower()
        .startCase()
        .value();
}

export const OncoKbCardTitle: React.FunctionComponent<OncoKbCardDefaultTitleProps> = (
    props: OncoKbCardDefaultTitleProps
) => {
    const titleClassName = `${mainStyles['title']} ${mainStyles['oncokb-variant-title']}`;
    const cDnaChange = getCdnaChangeForDisplay(props.cDnaChange);
    const proteinChange = getProteinChangeForDisplay(props.proteinChange);
    const displayTumorType = getDisplayTumorType(props.tumorType);
    const isStructuralVariant = isStructuralVariantAlteration(proteinChange);
    const showHugoSymbol =
        props.hugoSymbol &&
        props.hugoSymbol !== OTHER_BIOMARKER_HUGO_SYMBOL &&
        !(
            isStructuralVariant &&
            alterationNamesGene(proteinChange, props.hugoSymbol)
        );

    return (
        <div className={titleClassName} data-test="oncokb-card-title">
            <div className={mainStyles['title-main']}>
                <span>
                    {showHugoSymbol && props.hugoSymbol}
                    {props.isGermline && cDnaChange && (
                        <>
                            {showHugoSymbol && ' '}
                            {cDnaChange}
                        </>
                    )}
                    {proteinChange && (
                        <>
                            {(showHugoSymbol ||
                                (props.isGermline && cDnaChange)) &&
                                ' '}
                            {props.isGermline && cDnaChange && <>&middot; </>}
                            <span
                                className={
                                    props.isGermline && !isStructuralVariant
                                        ? mainStyles['title-protein-change']
                                        : undefined
                                }
                            >
                                {props.isGermline && !isStructuralVariant
                                    ? `(${proteinChange})`
                                    : proteinChange}
                            </span>
                        </>
                    )}
                </span>
                {props.isGermline && (
                    <span className={mainStyles['germline-badge']}>
                        Germline
                    </span>
                )}
            </div>
            {props.tumorType && props.displayCancerTypeInTitle && (
                <div className={mainStyles['title-subtitle']}>
                    {displayTumorType}
                </div>
            )}
        </div>
    );
};
