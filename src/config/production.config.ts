import {IAppConfig} from "./IAppConfig";

const config:IAppConfig = {
    //host: 'cbioportal-rc.herokuapp.com',
    cancerStudySearchPresets: [
        'tcga',
        'tcga -provisional',
        'tcga -moratorium',
        'tcga OR icgc',
        '-"cell line"',
        'prostate mskcc',
        'esophageal OR stomach',
        'serous',
        'breast',
    ],
    priorityStudies: {
    },
    showCivic: (window as any).showCivic,
    showHotspot: (window as any).showHotspot,
    showMyCancerGenome: (window as any).showMyCancerGenome,
    showOncoKB: (window as any).showOncoKB,
    oncoKBApiUrl: (window as any).oncoKBApiUrl
};

export default config;
