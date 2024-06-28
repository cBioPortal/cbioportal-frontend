import { ExternalToolConfig } from './externalToolConfig';

//fnordwip
import fileDownload from 'react-file-download';
import downloadUri from 'react-file-download';

// WIP
function myDownloadUri(url : string, filename : string) {
    var blobURL = url;
        var tempLink = document.createElement('a');
        tempLink.style.display = 'none';
        tempLink.href = blobURL;
        tempLink.setAttribute('download', filename); 
        
        // Safari thinks _blank anchor are pop ups. We only want to set _blank
        // target if the browser does not support the HTML5 download attribute.
        // This allows you to download files in desktop safari if pop up blocking 
        // is enabled.
        if (typeof tempLink.download === 'undefined') {
            tempLink.setAttribute('target', '_blank');
        }
        
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(blobURL);
    
}

// run handleDownload, then launch the tool using the defined url_format
export function handleDownloadExternalTool(handleDownload : () => void, tool : ExternalToolConfig) {
    //fnorddebug
    console.log('handleDownload.Uri2');
    //myDownloadUri('https://testfile.org/files-5GB-zip', 'test5gb.dat');
    handleDownload();
    console.log('handleDownloadDone');
    //fnordwip
    // url_format: 'avm://?${downloadedFilePath}&-AutoMode=true&-ProjectNameHint=${studyName}'
    console.log(tool.url_format);
    window.location.href = 'avm://-AutoMode=true';
}