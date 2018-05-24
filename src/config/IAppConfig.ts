export interface IAppConfig {
    apiRoot?: string;
    baseUrl?:string;
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
    showTwitter?: boolean;
    oncoKBApiUrl?: string;
    showGenomeNexus?: boolean;
    genomeNexusApiUrl?: string;
    studiesWithGermlineConsentedSamples?:string[];
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
    // labels to be displayed in oncoprint "Mutation color" menu for custom annotation of driver and passenger mutations in the oncoprint.
    // Set any of these properties to enable the respective menu options in oncoprint:
    oncoprintCustomDriverAnnotationBinaryMenuLabel?:string;
    oncoprintCustomDriverAnnotationTiersMenuLabel?:string;
    // set this to false to disable the automatic selection of the custom driver/passenger mutations annotation (binary) in the oncoprint
    // when custom annotation data is present.
    oncoprintCustomDriverAnnotationDefault?:boolean;
    // set this to false to disable the automatic selection of the custom tiers in the oncoprint when custom annotation data is present. By default
    // this property is true.
    oncoprintCustomDriverTiersAnnotationDefault?:boolean;
    // OncoKB and Hotspots are automatically selected as annotation source. If you want to disable them, set the following property to "disable". If you
    // want them to be selected only if there are no custom annotation driver and passenger mutations, type "custom".
    oncoprintOncoKbHotspotsDefault?:"disable"|"custom";
    // Select hide VUS by default
    oncoprintHideVUSDefault?:boolean;
    sessionServiceIsEnabled?:boolean;
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
