import {IAppConfig} from "./IAppConfig";

const config = {
    apiRoot: 'cbioportal-rc.herokuapp.com/api',
    hotspotsApiRoot: 'cancerhotspots.org',
    hotspots3DApiRoot: '3dhotspots.org/3d',
    tissueImageCheckUrl: '//cancer.digitalslidearchive.net/local_php/get_slide_list_from_db_groupid_not_needed.php?slide_name_filter='

} as IAppConfig;

export default config;