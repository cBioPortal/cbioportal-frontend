import { getServerConfig } from 'config/config';

export function shouldShowDownloadAndCopyControls() {
    return !getServerConfig().skin_hide_download_controls;
}
