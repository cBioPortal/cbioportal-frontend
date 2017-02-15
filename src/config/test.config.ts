import {IAppConfig} from "./IAppConfig";

const config:IAppConfig = {
    apiRoot: 'cbioportal-rc.herokuapp.com/api',
    hotspotsApiRoot: 'cancerhotspots.org',
    hotspots3DApiRoot: '3dhotspots.org/3d',
    oncoKbApiRoot: 'oncokb.org/api/v1',
    tissueImageCheckUrl: '//cancer.digitalslidearchive.net/local_php/get_slide_list_from_db_groupid_not_needed.php?slide_name_filter=',
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
        'Shared institutional Data Sets': ['mskimpact', 'cellline_mskcc'],
        'Priority Studies': ['blca_tcga_pub', 'coadread_tcga_pub', 'brca_tcga_pub2015'], // for demo
    },
};

export default config;
