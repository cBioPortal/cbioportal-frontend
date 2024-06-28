
// define an ExternalTool to display in CopyDownloadButtons
// clicking on the button will launch it using the url_format
export type ExternalToolConfig = {
    id: string;
    name: string;
    tooltip: string;
    // fnord confirm HTML works?
    // USAGE: relative to shared/components/copyDownloadControls.
    // ASNEEDED: smarter support for relative paths
    iconImageSrc: string;
    required_installed_font_family: string;
    // fnord this may be tricky. eval equivalent?
    // "foo://?${downloadedFilePath}&-AutoMode=true&-ProjectNameHint=${studyName}"
    url_format: string;
};

// RFC87
export const ExternalToolConfigDefaults : ExternalToolConfig[] = [
    {
        id: 'avm',
        name: 'AVM for cBioPortal',
        tooltip: 'Launch AVM for cBioPortal with Data',
        //iconImageSrc: '../ExternalTools/images/avm_icon.png',   
        //fnordregress, then change to relative
        iconImageSrc: 'https://aquminmedical.com/images/content/favicon.png',
        required_installed_font_family: 'AVMInstalled',
        url_format: 'avm://?${downloadedFilePath}&-AutoMode=true&-ProjectNameHint=${studyName}'
    }
];