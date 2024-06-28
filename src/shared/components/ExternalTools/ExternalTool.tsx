import * as React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { IExternalToolProps } from './IExternalTool';
import './styles.scss';


/*fnordwip
export interface ICopyDownloadButtonsProps extends ICopyDownloadInputsProps {
    copyButtonRef?: (el: HTMLButtonElement | null) => void;
}
    */

/*fnordwip
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
//fnord rename
export function handleLaunchExternalTool(data : string, tool : ExternalToolConfig) {
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
    */

//fnordfolder rename again
export class ExternalTool extends React.Component<
    IExternalToolProps,
    {}
> {

    /*fnordwip
    get className() {
        return this.props.hostControls.className;
    }    


    get downloadLabel() {
        return this.props.hostControls.className;
    }       
        */

    handleLaunch = () => {
        console.log('ExternalTool.handleLaunch');
        if (this.props.downloadData) {
        }
        //fnordim
    }

    public render() {
        //fnord title wrong
        const tool = this.props.toolConfig;
        // fnord require vs literal?
        var iconImgSrc = require(tool.iconImageSrc);

/*fnordremoved
                    {this.props.downloadLabel}{' '}
*/

        return (
            <DefaultTooltip
            overlay={<span>{tool.tooltip}</span>}
            {...this.props.baseTooltipProps}
            overlayClassName={this.props.overlayClassName}
        >
            <Button 
                id={tool.id} 
                className="btn-sm" 
                onClick={this.handleLaunch}>
                    <img className="downloadButtonImageExternalTool" 
                        src={iconImgSrc}/>
            </Button>
        </DefaultTooltip>
        );
    }    
}
