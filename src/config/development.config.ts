import {IAppConfig} from "./IAppConfig";

const config:IAppConfig = {
    //host: 'cbioportal-rc.herokuapp.com',
    genomespaceEnabled: false,
    cancerStudySearchPresets: (window as any).skinExampleStudyQueries,
    priorityStudies: (window as any).priorityStudies,
    showCivic: (window as any).showCivic,
    showHotspot: (window as any).showHotspot,
    showMyCancerGenome: (window as any).showMyCancerGenome,
    showOncoKB: (window as any).showOncoKB,
    oncoKBApiUrl: (window as any).oncoKBApiUrl,
    showGenomeNexus: (window as any).showGenomeNexus,
    genomeNexusApiUrl: (window as any).genomeNexusApiUrl,
    enableDarwin: (window as any).enableDarwin,
    appVersion: (window as any).appVersion,
    historyType: (window as any).historyType,
    skinBlurb: (window as any).skinBlurb,
    skinDatasetHeader: (window as any).skinDatasetHeader,
    skinDatasetFooter: (window as any).skinDatasetFooter,
    skinRightNavShowDatasets: (window as any).skinRightNavShowDatasets,
    skinRightNavShowExamples: (window as any).skinRightNavShowExamples, 
    skinRightNavShowTestimonials: (window as any).skinRightNavShowTestimonials,
    skinRightNavExamplesHTML: (window as any).skinRightNavExamplesHTML,
    skinRightNavWhatsNewBlurb: (window as any).skinRightNavWhatsNewBlurb,
    querySetsOfGenes: (window as any).querySetsOfGenes
};

export default config;
