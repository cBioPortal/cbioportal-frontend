import * as React from 'react';

export default class OncoKbHelper {
    public static get LEVELS(): string[] {
        return ['1', '2', '2A', '2B', '3A', '3B', '4', 'R1', 'R2'];
    }

    public static get LEVEL_DESC(): { [level: string]: JSX.Element } {
        return {
            '1': (
                <span>
                    <b>FDA-recognized</b> biomarker predictive of response to an{' '}
                    <b>FDA-approved</b> drug <b>in this indication</b>
                </span>
            ),
            '2': (
                <span>
                    <b>Standard care</b> biomarker recommended by the NCCN or
                    other expert panels predictive of response to an{' '}
                    <b>FDA-approved drug</b> in this indication
                </span>
            ),
            '2A': (
                <span>
                    <b>Standard care</b> biomarker predictive of response to an{' '}
                    <b>FDA-approved</b> drug <b>in this indication</b>
                </span>
            ),
            '2B': (
                <span>
                    <b>Standard care</b> biomarker predictive of response to an{' '}
                    <b>FDA-approved</b> drug <b>in another indication</b>, but
                    not standard care for this indication
                </span>
            ),
            '3A': (
                <span>
                    <b>Compelling clinical evidence</b> supports the biomarker
                    as being predictive of response to a drug{' '}
                    <b>in this indication</b>
                </span>
            ),
            '3B': (
                <span>
                    <b>Compelling clinical evidence</b> supports the biomarker
                    as being predictive of response to a drug{' '}
                    <b>in another indication</b>
                </span>
            ),
            '4': (
                <span>
                    <b>Compelling biological evidence</b> supports the biomarker
                    as being predictive of response to a drug
                </span>
            ),
            R1: (
                <span>
                    <b>Standard care</b> biomarker predictive of{' '}
                    <b>resistance</b> to an <b>FDA-approved</b> drug{' '}
                    <b>in this indication</b>
                </span>
            ),
            R2: (
                <span>
                    <b>Compelling clinical evidence</b> supports the biomarker
                    as being predictive of <b>resistance</b> to a drug
                </span>
            ),
        };
    }
}
