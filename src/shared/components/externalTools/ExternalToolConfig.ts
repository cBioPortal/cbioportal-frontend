
// for launching an ExternalTool by URL via the CopyDownloadButtons
export type ExternalToolConfig = {
    id: string;
    // fnord full string title or just name?
    name: string;
    // fnord relative
    imagePath: string;
    //fnordim
    required_installed_font_family: string;
    // fnord this may be tricky. eval equivalent?
    // "avm://?${downloadedFilePath}&-AutoMode=true&-ProjectNameHint=${studyName}"
    url_format: string;
};

export const ExternalToolConfigDefaults : ExternalToolConfig[] = [
    {
        id: 'avm',
        name: 'AVM for cBioPortal',
        //fnordim
        imagePath: 'avm.png',   
        required_installed_font_family: 'AVMInstalled',
        url_format: 'avm://?${downloadedFilePath}&-AutoMode=true&-ProjectNameHint=${studyName}'
    }

];