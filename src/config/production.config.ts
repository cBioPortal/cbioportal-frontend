import {IAppConfig} from "./IAppConfig";

const config:IAppConfig = {
    apiRoot: 'cbioportal-rc.herokuapp.com/api',
    hotspotsApiRoot: 'cbioportal-rc.herokuapp.com/proxy/cancerhotspots.org',
    hotspots3DApiRoot: 'cbioportal-rc.herokuapp.com/proxy/3dhotspots.org/3d',
    oncoKbApiRoot: 'cbioportal-rc.herokuapp.com/proxy/oncokb.org/api/v1',
    tissueImageCheckUrl: 'cbioportal-rc.herokuapp.com/proxy/cancer.digitalslidearchive.net/local_php/get_slide_list_from_db_groupid_not_needed.php?slide_name_filter=',
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
