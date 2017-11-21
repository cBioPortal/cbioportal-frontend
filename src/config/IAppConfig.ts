export interface IAppConfig {
    apiRoot?: string;
    frontendUrl?: string;
    genomespaceEnabled: boolean;
    skinExampleStudyQueries: string[]; // in query the example searches
    priorityStudies: PriorityStudies;
    maxTreeDepth: number;
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
    isoformOverrideSource?: string;
    enableDarwin?: boolean;
    appVersion?: string;
    historyType?: string;
    skinBlurb?: string; // text on main page
    skinDatasetHeader?: string; // header on dataset page
    skinDatasetFooter?: string;
    skinRightNavShowDatasets?: boolean;
    skinRightNavShowExamples?: boolean;
    skinRightNavShowTestimonials?: boolean;
    skinRightNavExamplesHTML?: string;
    skinRightNavWhatsNewBlurb?: string;
    userEmailAddress?: string;
    querySetsOfGenes?: {"id": string, "genes":string[]}[];
}

export type PriorityStudies = {
    [category:string]: string[]
};

export type VirtualCohort = {
    id:string,
    name:string,
    description:string,
    samples:{sampleId:string, studyId:string}[],
    constituentStudyIds:string[]
};
