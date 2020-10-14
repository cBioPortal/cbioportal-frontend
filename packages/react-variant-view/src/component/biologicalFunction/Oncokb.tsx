import { observer } from 'mobx-react';
import * as React from 'react';

import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';

interface IOncokbProps {
    oncokb: IndicatorQueryResp | undefined;
    isCanonicalTranscriptSelected: boolean;
}

export enum ONCOGENICITY {
    ONCOGENIC = 'Oncogenic',
    LIKELY_ONCOGENIC = 'Likely Oncogenic',
    PREDICTED_ONCOGENIC = 'Predicted Oncogenic',
    NEUTRAL = 'Neutral',
    LIKELY_NEUTRAL = 'Likely Neutral',
    INCONCLUSIVE = 'Inconclusive',
    VUS = 'vus',
    UNKNOWN = 'Unknown',
}

export const ONCOGENICITY_CLASS_NAMES: { [oncogenic: string]: string } = {
    [ONCOGENICITY.ONCOGENIC]: 'oncogenic',
    [ONCOGENICITY.LIKELY_ONCOGENIC]: 'oncogenic',
    [ONCOGENICITY.PREDICTED_ONCOGENIC]: 'oncogenic',
    [ONCOGENICITY.NEUTRAL]: 'neutral',
    [ONCOGENICITY.LIKELY_NEUTRAL]: 'neutral',
    [ONCOGENICITY.INCONCLUSIVE]: 'inconclusive',
    [ONCOGENICITY.VUS]: 'vus',
    [ONCOGENICITY.UNKNOWN]: 'unknown',
};

export enum MUTATION_EFFECT {
    GAIN_OF_FUNCTION = 'Gain-of-function',
    LIKELY_GAIN_OF_FUNCTION = 'Likely Gain-of-function',
    LOSS_OF_FUNCTION = 'Loss-of-function',
    LIKELY_LOSS_OF_FUNCTION = 'Likely Loss-of-function',
    SWITCH_OF_FUNCTION = 'Switch-of-function',
    LIKELY_SWITCH_OF_FUNCTION = 'Likely Switch-of-function',
    NEUTRAL = 'Neutral',
    LIKELY_NEUTRAL = 'Likely Neutral',
    INCONCLUSIVE = 'Inconclusive',
    UNKNOWN = 'Unknown',
}

export const MUTATION_EFFECT_CLASS_NAMES: {
    [mutationEffect: string]: string;
} = {
    [MUTATION_EFFECT.GAIN_OF_FUNCTION]: 'gain',
    [MUTATION_EFFECT.LIKELY_GAIN_OF_FUNCTION]: 'gain',
    [MUTATION_EFFECT.LOSS_OF_FUNCTION]: 'loss',
    [MUTATION_EFFECT.LIKELY_LOSS_OF_FUNCTION]: 'loss',
    [MUTATION_EFFECT.SWITCH_OF_FUNCTION]: 'switch',
    [MUTATION_EFFECT.LIKELY_SWITCH_OF_FUNCTION]: 'switch',
    [MUTATION_EFFECT.NEUTRAL]: 'neutral',
    [MUTATION_EFFECT.LIKELY_NEUTRAL]: 'neutral',
    [MUTATION_EFFECT.INCONCLUSIVE]: 'inconclusive',
    [MUTATION_EFFECT.UNKNOWN]: 'unknown',
};

export const ONCOKB_URL = 'https://www.oncokb.org';

@observer
export default class Oncokb extends React.Component<IOncokbProps> {
    public oncogenicity(oncokb: IndicatorQueryResp) {
        if (oncokb.oncogenic && oncokb.oncogenic !== '') {
            return oncokb.oncogenic;
        } else {
            return null;
        }
    }
    public oncokbTooltip(oncokbUrl: string) {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <span>
                        <a
                            href={oncokbUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            OncoKB
                        </a>{' '}
                        is a precision oncology knowledge base and contains
                        <br />
                        information about the effects and treatment implications
                        <br />
                        of specific cancer gene alterations. <br />
                    </span>
                }
            >
                <a href={oncokbUrl} target="_blank" rel="noopener noreferrer">
                    OncoKB&nbsp;
                    <i className="fas fa-external-link-alt" />
                    {!this.props.isCanonicalTranscriptSelected && (
                        <span> *</span>
                    )}
                </a>
            </DefaultTooltip>
        );
    }

    public mutationEffect(oncokb: IndicatorQueryResp) {
        if (oncokb.mutationEffect && oncokb.mutationEffect.knownEffect !== '') {
            return oncokb.mutationEffect.knownEffect;
        } else {
            return null;
        }
    }

    public render() {
        const oncokbUrl = generateOncokbLink(ONCOKB_URL, this.props.oncokb);
        return this.props.oncokb ? (
            <div className={featureTableStyle['functional-group']}>
                <div className={featureTableStyle['data-source']}>
                    {this.oncokbTooltip(oncokbUrl)}
                </div>
                <div className={featureTableStyle['data-with-link']}>
                    {this.biologicalFunctionData(
                        this.mutationEffect(this.props.oncokb),
                        this.oncogenicity(this.props.oncokb),
                        oncokbUrl
                    )}
                </div>
            </div>
        ) : (
            <div className={featureTableStyle['functional-group']}>
                <div className={featureTableStyle['data-source']}>
                    {this.oncokbTooltip(oncokbUrl)}
                </div>
                <div>N/A</div>
            </div>
        );
    }

    private biologicalFunctionData(
        mutationEffect: string | null,
        oncogenicity: string | null,
        oncokbUrl: string
    ) {
        let biologicalFunctionData: string | null = null;
        if (mutationEffect && oncogenicity) {
            biologicalFunctionData = `${mutationEffect}, ${oncogenicity}`;
        } else if (mutationEffect) {
            biologicalFunctionData = oncogenicity;
        } else if (oncogenicity) {
            biologicalFunctionData = mutationEffect;
        } else {
            biologicalFunctionData = 'N/A';
        }
        return (
            <a href={oncokbUrl} target="_blank" rel="noopener noreferrer">
                <p>{biologicalFunctionData}</p>
            </a>
        );
    }
}

export function generateOncokbLink(
    link: string,
    oncokb: IndicatorQueryResp | undefined
): string {
    let url = link;
    const hugoSymbol = oncokb && oncokb.query && oncokb.query.hugoSymbol;
    const alteration = oncokb && oncokb.query && oncokb.query.alteration;
    if (hugoSymbol && alteration) {
        url = `${url}/gene/${hugoSymbol}/${alteration}`;
    }
    return url;
}
