import * as React from 'react';
import Icon from 'shared/components/cohort/LetterIcon';
import { If, Then, Else } from 'react-if';

/**
 * Gets the GISTIC ToolTip Component.
 * @param qValue GISTIC Q-Vale.
 * @param peakGeneCount Number of Genes within the GISTIC Peak.
 */
export function getGisticTooltip(qValue: number, peakGeneCount = 0) {
    return (
        <div>
            Candidate driver gene, as determined by the <b>GISTIC</b> algorithm.
            <p />
            The GISTIC algorithm identifies likely driver copy number
            <br />
            alterations by evaluating the frequency and amplitude of
            <br />
            observed CNA events within the entire study.
            <p />
            <span> Q-value: {(qValue || 0).toExponential(3)}</span>
            <If condition={peakGeneCount > 0}>
                <Then>
                    <br />
                    <span> Number of genes in the peak: {peakGeneCount}</span>
                </Then>
            </If>
        </div>
    );
}

/**
 * Makes the GISTIC Icon
 * @param qValue GISTIC Q-Value
 * @param peakGeneCount Number of Genes within the GISTIC Peak
 */
export function makeGisticIcon(qValue: number, peakGeneCount: number) {
    const tooltipCallback = () => getGisticTooltip(qValue, peakGeneCount);
    let iconStyle = {
        cursor: 'default',
    };
    return (
        <span style={iconStyle}>
            <Icon text="G" tooltip={tooltipCallback} />
        </span>
    );
}
