import {IAppConfig} from "./IAppConfig";

const config:IAppConfig = {
    //host: 'cbioportal-rc.herokuapp.com',
    genomespaceEnabled: false,
    skinExampleStudyQueries: [
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
        'Shared institutional Data Sets': ['mskimpact', 'cellline_mskcc'],
        'Priority Studies': ['blca_tcga_pub', 'coadread_tcga_pub', 'brca_tcga_pub2015'], // for demo
    },
    maxTreeDepth: 3
};

export default config;
