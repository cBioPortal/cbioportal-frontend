import * as React from 'react';
import _ from 'lodash';
import { IMutationalSignature } from '../../model/MutationalSignature';
import { GenericAssayTypeConstants } from './GenericAssayCommonUtils';
import { deriveDisplayTextFromGenericAssayType } from 'pages/resultsView/plots/PlotsTabUtils';

export enum MutationalSignaturesVersion {
    V2 = 'v2',
    V3 = 'v3',
}

export enum MutationalSignatureStableIdKeyWord {
    MutationalSignatureContributionKeyWord = 'contribution',
    MutationalSignatureConfidenceKeyWord = 'pvalue',
}

export const MUTATIONAL_SIGNATURES_SIGNIFICANT_PVALUE_THRESHOLD = 0.05;

export const RESERVED_MUTATIONAL_SIGNATURE_COLORS: {
    [category: string]: string;
} = {
    smoking: '#3366cc',
    unknown: '#dc3912',
    aflatoxin: '#0099c6',
    hrd: '#66aa00',
    tmz: '#b82e2e',
    uv: '#316395',
    ighv: '#994499',
    apobec: '#22aa99',
    age: '#6633cc',
    pole: '#e67300',
    sequencing: '#651067',
    ber: '#5574a6',
    platinum: '#3b3eac',
    ros: '#b77322',
    haloalkane: '#b91383',
    aid: '#f4359e',
    aza: '#9c5935',
    'mmr/msi': '#8b0707',
    'aid/apobec': '#aaaa11',
    'aristolochic acid': '#ff9900',
    'defective mmr/msi': '#dd4477',
    'defective dna mismatch repair': '#109618',
    'tobacco chewing': '#990099',
    'pol-eta': '#16d620',
}; // Source: D3

export function getColorByMutationalSignatureCategory(category: string) {
    return RESERVED_MUTATIONAL_SIGNATURE_COLORS[category.toLowerCase()];
}

export function getVersionOption(version: string) {
    return {
        label: `${deriveDisplayTextFromGenericAssayType(
            GenericAssayTypeConstants.MUTATIONAL_SIGNATURE
        )} ${version.toUpperCase()}`,
        value: version,
    };
}

export function getVersionOptions(versions: string[]) {
    return versions.map(version => {
        return getVersionOption(version);
    });
}

export type ISampleProgressBarProps = {
    contribution: string;
    color: string;
};

export const SampleProgressBar: React.FunctionComponent<ISampleProgressBarProps> = ({
    contribution,
    color,
}) => {
    let contributionPerc = Math.round(parseFloat(contribution) * 100);

    let progressBarClassName: string = 'progress-bar-info';
    let progressBarStyle: { [s: string]: string } = {
        backgroundColor: color,
    };

    return (
        <div
            className="progress"
            style={{ position: 'relative', width: 100, marginBottom: 0 }}
        >
            <div
                data-test="progress-bar"
                className={`progress-bar ${progressBarClassName}`}
                role="progressbar"
                aria-valuenow={contributionPerc}
                aria-valuemin={0}
                aria-valuemax={100}
                style={Object.assign(progressBarStyle, {
                    width: `${contributionPerc}%`,
                })}
            />
            <div
                style={{
                    position: 'absolute',
                    textShadow:
                        '-1px 0 white, 0 1px white, 1px 0 white, 0 -1px white',
                    width: 100,
                    marginTop: 2,
                    textAlign: 'center',
                }}
            >
                {contributionPerc}%
            </div>
        </div>
    );
};

export function getSignificantMutationalSignatures(
    mutationalSignatureData: IMutationalSignature[],
    sampleId: string
): IMutationalSignature[] {
    return (
        _.chain(mutationalSignatureData)
            .filter(signature => signature.sampleId === sampleId)
            .filter(
                signature =>
                    signature.confidence <
                    MUTATIONAL_SIGNATURES_SIGNIFICANT_PVALUE_THRESHOLD
            )
            // sort by value, desc
            .sortBy(signature => -signature.value)
            .value()
    );
}
