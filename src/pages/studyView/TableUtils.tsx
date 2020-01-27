import * as React from 'react';
import {
    getOncoKBCancerGeneListLinkout,
    getOncoKBReferenceInfo,
} from './oncokb/OncoKBUtils';
import styles from './table/tables.module.scss';
import classnames from 'classnames';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { ICON_FILTER_OFF, ICON_FILTER_ON } from 'shared/lib/Colors';
import {
    getFrequencyStr,
    getCNAByAlteration,
} from 'pages/studyView/StudyViewUtils';
import { GenePanelList } from 'pages/studyView/table/StudyViewGenePanelModal';
import { CSSProperties } from 'react';
import * as _ from 'lodash';

export type AlteredGenesTableUserSelectionWithIndex = {
    entrezGeneId: number;
    hugoGeneSymbol: string;
    rowIndex: number;
};

export function getGeneCNAOQL(hugoGeneSymbol: string, alteration: number) {
    return [hugoGeneSymbol, getCNAByAlteration(alteration)].join(':');
}

export function getGeneColumnHeaderRender(
    cellMargin: number,
    headerName: string,
    cancerGeneListFilterEnabled: boolean,
    isFilteredByCancerGeneList: boolean,
    cancerGeneIconToggle: (event: any) => void
) {
    return (
        <div
            style={{ marginLeft: cellMargin }}
            className={styles.displayFlex}
            data-test="gene-column-header"
        >
            {cancerGeneListFilterEnabled && (
                <DefaultTooltip
                    mouseEnterDelay={0}
                    placement="top"
                    overlay={getCancerGeneToggledOverlay(
                        isFilteredByCancerGeneList
                    )}
                >
                    <div
                        onClick={cancerGeneIconToggle}
                        className={styles.displayFlex}
                    >
                        {getCancerGeneFilterToggleIcon(
                            isFilteredByCancerGeneList
                        )}
                    </div>
                </DefaultTooltip>
            )}
            {headerName}
        </div>
    );
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

export function getCancerGeneFilterToggleIcon(
    isFilteredByCancerGeneList: boolean
) {
    return (
        <span
            data-test="cancer-gene-filter"
            className={classnames(styles.cancerGeneIcon, styles.displayFlex)}
            style={{
                color: isFilteredByCancerGeneList
                    ? ICON_FILTER_ON
                    : ICON_FILTER_OFF,
            }}
        >
            <i className="fa fa-filter"></i>
        </span>
    );
}

type FreqColumnType = 'mutation' | 'fusion' | 'cna';

export function getFreqColumnRender(
    type: FreqColumnType,
    numberOfProfiledCases: number,
    numberOfAlteredCases: number,
    matchingGenePanelIds: string[],
    toggleModal?: (panelName: string) => void,
    style?: CSSProperties
) {
    const detailedTypeInfo =
        type === 'mutation'
            ? 'mutations'
            : type === 'cna'
            ? 'copy number alterations'
            : 'fusions';
    const addTotalProfiledOverlay = () => (
        <span
            style={{ display: 'flex', flexDirection: 'column' }}
            data-test="freq-cell-tooltip"
        >
            <span>{`# of samples profiled for ${detailedTypeInfo} in this gene: ${numberOfProfiledCases.toLocaleString()}`}</span>
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
