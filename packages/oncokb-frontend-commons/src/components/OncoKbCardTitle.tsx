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

function getProteinChangeForDisplay(proteinChange: string | undefined) {
    if (!proteinChange) {
        return undefined;
    }
    if (!proteinChange.startsWith('p.') && /\d/.test(proteinChange)) {
        return `p.${proteinChange}`;
    }
    return proteinChange;
}

function getCdnaChangeForDisplay(cDnaChange: string | undefined) {
    return cDnaChange ? cDnaChange.split(':').pop() : undefined;
}

function getDisplayTumorType(tumorType: string) {
    return _.startCase(_.toLower(tumorType));
}

export const OncoKbCardTitle: React.FunctionComponent<OncoKbCardDefaultTitleProps> = (
    props: OncoKbCardDefaultTitleProps
) => {
    const titleClassName = `${mainStyles['title']} ${
        mainStyles['oncokb-variant-title']
    }`;
    const cDnaChange = getCdnaChangeForDisplay(props.cDnaChange);
    const proteinChange = getProteinChangeForDisplay(props.proteinChange);
    const displayTumorType = getDisplayTumorType(props.tumorType);
    const showHugoSymbol =
        props.hugoSymbol && props.hugoSymbol !== OTHER_BIOMARKER_HUGO_SYMBOL;

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
                            {props.isGermline && cDnaChange && (
                                <>
                                    &middot;{' '}
                                </>
                            )}
                            <span
                                className={
                                    props.isGermline
                                        ? mainStyles['title-protein-change']
                                        : undefined
                                }
                            >
                                {props.isGermline
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
