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
