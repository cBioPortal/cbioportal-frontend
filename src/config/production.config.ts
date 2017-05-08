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
};

export default config;
