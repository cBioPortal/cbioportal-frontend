import { getServerConfig } from 'config/config';

export function canLinkToStudyView(readPermission: boolean | undefined) {
    return getServerConfig().skin_home_page_show_unauthorized_studies
        ? readPermission === true
        : readPermission === true || readPermission === undefined;
}
