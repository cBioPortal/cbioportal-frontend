import PatientViewUrlWrapper from './PatientViewUrlWrapper';
export enum PatientViewPageTabs {
    Summary = 'summary',
    genomicEvolution = 'genomicEvolution',
    ClinicalData = 'clinicalData',
    FilesAndLinks = 'filesAndLinks',
    PathologyReport = 'pathologyReport',
    TissueImage = 'tissueImage',
    MSKTissueImage = 'MSKTissueImage',
    TrialMatchTab = 'trialMatchTab',
    MutationalSignatures = 'mutationalSignatures',
    PATHWAY_MAPPER = 'pathways',
}

export const PatientViewResourceTabPrefix = 'openResource_';

export function getPatientViewResourceTabId(resourceId: string) {
    return `${PatientViewResourceTabPrefix}${resourceId}`;
}

export function extractResourceIdFromTabId(tabId: string) {
    const match = new RegExp(`${PatientViewResourceTabPrefix}(.*)`).exec(tabId);
    if (match) {
        return match[1];
    } else {
        return undefined;
    }
}

/* REWRITE
export function addGenesToQuery(
    urlWrapper: PatientViewUrlWrapper,
    selectedGenes: string[],
    tab: PatientViewPageTabs = PatientViewPageTabs.Summary
) {
    // add selected genes and go to the target tab
    const geneList = urlWrapper.query[ResultsViewURLQueryEnum.gene_list];

    urlWrapper.updateURL(
        {
            [ResultsViewURLQueryEnum.gene_list]: `${geneList}\n${selectedGenes.join(
                ' '
            )}`,
        },
        `results/${tab}`
    );
}
*/
