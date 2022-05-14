export function shouldShowDownloadAndCopyControls() {
    // for now, we are always hiding copy controls, but in the future we will use the
    //    app config to determine whether we show them:
    // return !getServerConfig().skin_hide_download_controls
    return false;
}
