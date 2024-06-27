
// for launching an ExternalTool by URL via the CopyDownloadButtons
export type ExternalToolConfig = {
    id: string;
    name: string;
    // USAGE: goes as is into image.src attribute
    iconImageSrc: string;
    required_installed_font_family: string;
    // fnord this may be tricky. eval equivalent?
    // "foo://?${downloadedFilePath}&-AutoMode=true&-ProjectNameHint=${studyName}"
    url_format: string;
};

export const ExternalToolConfigDefaults : ExternalToolConfig[] = [
    {
        id: 'avm',
        name: 'AVM for cBioPortal',
        iconImageSrc: 'https://aquminmedical.com/images/content/favicon.png',   
        required_installed_font_family: 'AVMInstalled',
        url_format: 'avm://?${downloadedFilePath}&-AutoMode=true&-ProjectNameHint=${studyName}'
    }
];