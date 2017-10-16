export interface IAppConfig {
    genomespaceEnabled: boolean;
    cancerStudySearchPresets: string[]; // in query the example searches
    priorityStudies: PriorityStudies;
    //priorityStudies: {
    //    'Shared institutional Data Sets': ['mskimpact', 'cellline_mskcc'],
    //    'Priority Studies': ['blca_tcga_pub', 'coadread_tcga_pub', 'brca_tcga_pub2015'], // for demo
    //},
    showCivic?: boolean;
    showHotspot?: boolean;
    showMyCancerGenome?: boolean;
    showOncoKB?: boolean;
    oncoKBApiUrl?: string;
    showGenomeNexus?: boolean;
    genomeNexusApiUrl?: string;
    enableDarwin?: boolean;
    appVersion?: string;
    historyType?: string;
    skinBlurb?: string, // text on main page
    skinDatasetHeader?: string, // header on dataset page
    skinDatasetFooter?: string,
    skinRightNavShowDatasets?: boolean,
    skinRightNavShowExamples?: boolean, 
    skinRightNavShowTestimonials?: boolean,
    skinRightNavExamplesHTML?: string,
    skinRightNavWhatsNewBlurb?: string,
    querySetsOfGenes?: {"id": string, "genes":string[]}[]
}

export type PriorityStudies = {
    [category:string]: string[]
};
