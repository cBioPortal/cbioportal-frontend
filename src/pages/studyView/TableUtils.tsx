import * as React from 'react';
import {getOncoKBCancerGeneListLinkout, getOncoKBReferenceInfo} from "./oncokb/OncoKBUtils";
import styles from "./table/tables.module.scss";
import classnames from 'classnames';
import DefaultTooltip from "public-lib/components/defaultTooltip/DefaultTooltip";
import {ICON_FILTER_OFF, ICON_FILTER_ON} from "shared/lib/Colors";
import {GenePanelList} from "pages/studyView/table/GenePanelModal";
import {getFrequencyStr} from "pages/studyView/StudyViewUtils";
import {GenePanel, GenePanelToGene} from "shared/api/generated/CBioPortalAPIInternal";

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


export function getCancerGeneFilterToggleIcon(isFilteredByCancerGeneList:boolean) {
    return <span data-test='cancer-gene-filter' className={classnames(styles.cancerGeneIcon, styles.displayFlex)} style={{color: isFilteredByCancerGeneList ? ICON_FILTER_ON : ICON_FILTER_OFF}}><i className='fa fa-filter'></i></span>;
}

export function getFreqColumnRender(type: 'mutation' | 'cna', numberOfSamplesProfiled: number, numberOfAlteredCases: number, matchingGenePanels: GenePanel[], toggleModal: (panelName: string, genes: GenePanelToGene[]) => void) {
    const addTotalProfiledOverlay = () => (
        <span style={{display: 'flex', flexDirection: 'column'}}>
            <span>{`# of samples profiled for ${type === 'mutation' ? 'mutations' : 'copy number alterations'} in this gene: ${numberOfSamplesProfiled.toLocaleString()}`}</span>
            <GenePanelList
                genePanels={matchingGenePanels}
                toggleModal={toggleModal}
            />
        </span>
    );
    return (
        <DefaultTooltip
            placement="right"
            overlay={addTotalProfiledOverlay}
            destroyTooltipOnHide={true}
        >
            <span>
                {getFrequencyStr(
                    (numberOfAlteredCases / numberOfSamplesProfiled) * 100
                )}
            </span>
        </DefaultTooltip>
    );
}