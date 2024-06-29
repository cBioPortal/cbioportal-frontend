import * as React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { IExternalToolProps, IExternalToolUrlParameters } from './IExternalTool';
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

}
    */

//fnordfolder rename again
export class ExternalTool extends React.Component<
    IExternalToolProps,
    { urlParameters : IExternalToolUrlParameters }
> {

    constructor(props: IExternalToolProps) {
        super(props);

        const urlParameterDefaults : IExternalToolUrlParameters = 
        {
            // TODO: pull from DOM or somewhere in state
            studyName: "cBioPortal Data"
        };

        this.state = {
            urlParameters: Object.assign(urlParameterDefaults, props.urlFormatOverrides)
        };

    }

    handleLaunch = () => {
        console.log('ExternalTool.handleLaunch');
        if (this.props.downloadData) {
            // pass the data directly to the app via the URL
            // TECH: we do this instead of as a downloaded file, since we don't know exactly where the browser would download the file or how it would name it.
            // OPTIMIZE: the data is TSV. Could compress first, or possibly send the data in a tighter pre-TSV format.
            var data = this.props.downloadData();
            var base64data = btoa(data);

            // e.g. url_format: 'avm://?${downloadedFilePath}&-AutoMode=true&-ProjectNameHint=${studyName}'
            var urlFormat = this.props.toolConfig.url_format;

            console.log('StudyName:' + this.state.urlParameters.studyName);

            //fnord or location.href?
            //window.location.href = 'avm://-AutoMode=true';
        }
        //fnordim
    }

    public render() {
        const tool = this.props.toolConfig;

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
                        src={tool.iconImageSrc}/>
            </Button>
        </DefaultTooltip>
        );
    }    
}
