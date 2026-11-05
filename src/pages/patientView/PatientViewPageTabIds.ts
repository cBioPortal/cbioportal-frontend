export enum PatientViewPageTabs {
    Summary = 'summary',
    genomicEvolution = 'genomicEvolution',
    ClinicalData = 'clinicalData',
    FilesAndLinks = 'filesAndLinks',
    PathologyReport = 'pathologyReport',
    TissueImage = 'tissueImage',
    WSIHESlides = 'wsiHESlides',
    TrialMatchTab = 'trialMatchTab',
    MutationalSignatures = 'mutationalSignatures',
    PathwayMapper = 'pathways',
    MRNA = 'mrna',
    Plots = 'plots',
}

export const PatientViewResourceTabPrefix = 'openResource_';
export const PatientViewResourceTableTabPrefix = 'resourceTable_';

export function getPatientViewResourceTabId(resourceId: string) {
    return `${PatientViewResourceTabPrefix}${resourceId}`;
}

export function getPatientViewResourceTableTabId(resourceId: string) {
    return `${PatientViewResourceTableTabPrefix}${resourceId}`;
}

export function extractResourceIdFromTabId(tabId: string) {
    const match = new RegExp(`${PatientViewResourceTabPrefix}(.*)`).exec(tabId);
    if (match) {
        return match[1];
    } else {
        return undefined;
    }
}

export function extractResourceIdFromTableTabId(tabId: string) {
    const match = new RegExp(`${PatientViewResourceTableTabPrefix}(.*)`).exec(
        tabId
    );
    if (match) {
        return match[1];
    } else {
        return undefined;
    }
}
