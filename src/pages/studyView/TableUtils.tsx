import * as React from 'react';
import { CSSProperties } from 'react';
import {
    getOncoKBCancerGeneListLinkout,
    getOncoKBReferenceInfo,
} from './oncokb/OncoKBUtils';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    getCNAByAlteration,
    getFrequencyStr,
} from 'pages/studyView/StudyViewUtils';
import { GenePanelList } from 'pages/studyView/table/StudyViewGenePanelModal';

export function getGeneCNAOQL(hugoGeneSymbol: string, alteration: number) {
    return [hugoGeneSymbol, getCNAByAlteration(alteration)].join(':');
}

export function getGeneFromUniqueKey(key: string) {
    return key.split(':')[0];
}

export function getGeneColumnCellOverlaySimple(
    hugoGeneSymbol: string,
    geneIsSelected: boolean,
    isCancerGene: boolean,
    oncokbAnnotated: boolean,
    isOncogene: boolean,
    isTumorSuppressorGene: boolean
) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: 300,
                fontSize: 12,
            }}
        >
            <span>
                {getOncoKBReferenceInfo(
                    hugoGeneSymbol,
                    isCancerGene,
                    oncokbAnnotated,
                    isOncogene,
                    isTumorSuppressorGene
                )}
            </span>
        </div>
    );
}

export function getCancerGeneToggledOverlay(cancerGeneFilterEnabled: boolean) {
    if (cancerGeneFilterEnabled) {
        return (
            <span>
                Filtered by {getOncoKBCancerGeneListLinkout()}. Click to show
                all genes.
            </span>
        );
    } else {
        return (
            <span>
                Showing all genes. Click to filter by{' '}
                {getOncoKBCancerGeneListLinkout()}.
            </span>
        );
    }
}

export enum FreqColumnTypeEnum {
    MUTATION = 'mutations',
    FUSION = 'fusions',
    CNA = 'copy number alterations',
    DATA = 'data',
}

export enum SelectionOperatorEnum {
    INTERSECTION = 'Intersection',
    UNION = 'Union',
}

export function getFreqColumnRender(
    type: FreqColumnTypeEnum,
    numberOfProfiledCases: number,
    numberOfAlteredCases: number,
    matchingGenePanelIds: string[],
    toggleModal?: (panelName: string) => void,
    style?: CSSProperties
) {
    let tooltipContent = '# of samples profiled';
    if (type !== 'data') {
        tooltipContent += ` for ${type} in this gene: ${numberOfProfiledCases.toLocaleString()}`;
    }
    const addTotalProfiledOverlay = () => (
        <span
            style={{ display: 'flex', flexDirection: 'column' }}
            data-test="freq-cell-tooltip"
        >
            <span>{tooltipContent}</span>
            <GenePanelList
                genePanelIds={matchingGenePanelIds}
                toggleModal={toggleModal!}
            />
        </span>
    );

    return (
        <DefaultTooltip
            placement="right"
            overlay={addTotalProfiledOverlay}
            destroyTooltipOnHide={true}
        >
            <span data-test="freq-cell" style={style}>
                {getFrequencyStr(
                    (numberOfAlteredCases / numberOfProfiledCases) * 100
                )}
            </span>
        </DefaultTooltip>
    );
}

export function getTooltip(type: FreqColumnTypeEnum, isPergentage: boolean) {
    let tooltipContent = `${isPergentage ? 'Percentage' : 'Number'} of samples`;
    if (type !== 'data') {
        tooltipContent += ` with one or more ${type}`;
    }
    return tooltipContent;
}
