import * as React from 'react';
import Icon from 'shared/components/cohort/LetterIcon';

/**
 * Gets the MutSig ToolTip.
 * @param qValue Q-Value
 */
export function getMutSigTooltip(qValue: number) {
    return (
        <div>
            Candidate driver gene, as determined by the <b>MutSig</b>
            <br />
            algorithm.
            <p />
            The MutSig algorithm identifies likely driver genes
            <br />
            by evaluating the frequency of observed mutations within
            <br />
            the entire study.
            <p />
            <span> Q-value: {(qValue || 0).toExponential(3)}</span>
        </div>
    );
}

/**
 * Makes the MutSig Icon
 * @param qValue Makes the MutSig Icon with Tooltip
 */
export function makeMutSigIcon(qValue: number) {
    let iconStyle = {
        cursor: 'default',
    };
    const tooltipCallback = () => getMutSigTooltip(qValue);
    return (
        <span style={iconStyle}>
            <Icon text="M" tooltip={tooltipCallback} />
        </span>
    );
}
