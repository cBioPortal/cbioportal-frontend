import * as React from 'react';
import {getOncoKBCancerGeneListLinkout, getOncoKBReferenceInfo} from "./oncokb/OncoKBUtils";
import styles from "./table/tables.module.scss";
import classnames from 'classnames';
import DefaultTooltip from "public-lib/components/defaultTooltip/DefaultTooltip";
import {ICON_FILTER_OFF, ICON_FILTER_ON} from "shared/lib/Colors";
import {GenePanelList} from "pages/studyView/table/GenePanelModal";
import {getFrequencyStr} from "pages/studyView/StudyViewUtils";
import {CSSProperties} from "react";
import {
    GeneIdentifier,
    CopyNumberAlterationIdentifier
} from "pages/studyView/StudyViewPageStore";
import * as _ from "lodash";
import {GeneTableUserSelectionWithIndex} from "pages/studyView/table/GeneTable";

export type AlteredGenesTableUserSelectionWithIndex = {
    entrezGeneId: number;
    hugoGeneSymbol: string;
    rowIndex: number;
};

const UNIQUE_KEY_SEPARATOR = '*';

export function getMutationUniqueKey(entrezGeneId: number, hugoGeneSymbol: string) {
    return [entrezGeneId, hugoGeneSymbol].join(UNIQUE_KEY_SEPARATOR);
}

export function parseMutationUniqueKey(uniqueKey: string): GeneIdentifier {
    const parts = uniqueKey.split(UNIQUE_KEY_SEPARATOR);

    return {
        entrezGeneId: Number(parts[0]),
        hugoGeneSymbol: parts[1]
    }
}

export function getCnaUniqueKey(entrezGeneId: number, hugoGeneSymbol: string, alteration: number) {
    return [entrezGeneId, hugoGeneSymbol, alteration].join(UNIQUE_KEY_SEPARATOR);
}

export function parseCnaUniqueKey(uniqueKey: string): CopyNumberAlterationIdentifier {
    const parts = uniqueKey.split(UNIQUE_KEY_SEPARATOR);

    return {
        entrezGeneId: Number(parts[0]),
        hugoGeneSymbol: parts[1],
        alteration: Number(parts[2]),
    }
}

export function getGeneColumnHeaderRender(cellMargin: number, headerName: string, cancerGeneListFilterEnabled: boolean, isFilteredByCancerGeneList: boolean, cancerGeneIconToggle: (event: any) => void) {
    return <div style={{marginLeft: cellMargin}} className={styles.displayFlex} data-test='gene-column-header'>
        {cancerGeneListFilterEnabled && (
            <DefaultTooltip
                mouseEnterDelay={0}
                placement="top"
                overlay={getCancerGeneToggledOverlay(isFilteredByCancerGeneList)}
            >
                <div onClick={cancerGeneIconToggle} className={styles.displayFlex}>
                    {getCancerGeneFilterToggleIcon(isFilteredByCancerGeneList)}
                </div>
            </DefaultTooltip>
        )}
        {headerName}
    </div>
}

export function getGeneColumnCellOverlaySimple(hugoGeneSymbol: string, geneIsSelected: boolean, isCancerGene: boolean, oncokbAnnotated: boolean, isOncogene: boolean, isTumorSuppressorGene: boolean) {
    return <div style={{display: 'flex', flexDirection: 'column', maxWidth: 300, fontSize: 12}}>
        <span>
            {getOncoKBReferenceInfo(hugoGeneSymbol, isCancerGene, oncokbAnnotated, isOncogene, isTumorSuppressorGene)}
        </span>
    </div>;
}

export function getCancerGeneToggledOverlay(cancerGeneFilterEnabled: boolean) {
    if (cancerGeneFilterEnabled) {
        return <span>Filtered by {getOncoKBCancerGeneListLinkout()}. Click to show all genes.</span>
    } else {
        return <span>Showing all genes. Click to filter by {getOncoKBCancerGeneListLinkout()}.</span>
    }
}


export function getCancerGeneFilterToggleIcon(isFilteredByCancerGeneList: boolean) {
    return <span data-test='cancer-gene-filter' className={classnames(styles.cancerGeneIcon, styles.displayFlex)}
                 style={{color: isFilteredByCancerGeneList ? ICON_FILTER_ON : ICON_FILTER_OFF}}><i
        className='fa fa-filter'></i></span>;
}

type FreqColumnType = 'mutation' | 'fusion' | 'cna';

export function getFreqColumnRender(type: FreqColumnType, numberOfProfiledCases: number, numberOfAlteredCases: number, matchingGenePanelIds: string[], toggleModal?: (panelName: string) => void, style?: CSSProperties) {
    const detailedTypeInfo = type === 'mutation' ? 'mutations' : (type === 'cna' ? 'copy number alterations' : 'fusions')
    const addTotalProfiledOverlay = () => (
        <span style={{display: 'flex', flexDirection: 'column'}} data-test='freq-cell-tooltip'>
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
            <span data-test='freq-cell' style={style}>
                {getFrequencyStr(
                    (numberOfAlteredCases / numberOfProfiledCases) * 100
                )}
            </span>
        </DefaultTooltip>
    );
}

export function rowIsChecked(uniqueKey: string, preSelectedRows: GeneTableUserSelectionWithIndex[], selectedRows: GeneTableUserSelectionWithIndex[]) {
    return _.some(
        preSelectedRows.concat(selectedRows),
        (row: GeneTableUserSelectionWithIndex) => row.uniqueKey === uniqueKey
    );
};

export function rowIsDisabled(uniqueKey: string, selectedRows: GeneTableUserSelectionWithIndex[]) {
    return _.some(
        selectedRows,
        (row: GeneTableUserSelectionWithIndex) => row.uniqueKey === uniqueKey
    );
};
