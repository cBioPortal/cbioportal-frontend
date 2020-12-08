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
    smoking: '#b221e8',
    hrd: '#f06b49',
    tmz: '#076b82',
    uv: '#ffec00',
    apobec: '#8ed14b',
    age: '#3b99d4',
    aging: '#3b99d4',
    pole: '#19413e',
    sequencing: '#651067',
    ber: '#5574a6',
    platinum: '#3b3eac',
    ros: '#b77322',
    haloalkane: '#b91383',
    aid: '#f4359e',
    aza: '#9c5935',
    'aid/apobec': '#aaaa11',
    'pol-eta': '#16d620',
    mmr: '#d92b45',
    'mmr/msi': '#d92b45',
    'defective mmr/msi': '#d92b45',
    'defective dna mismatch repair': '#d92b45',
    tabacco: '#50136d',
    'tobacco chewing': '#50136d',
    unknown: '#e8e8e8',
    aflatoxin: '#e8e8e8',
    ighv: '#e8e8e8',
    'aristolochic acid': '#e8e8e8',
};

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
