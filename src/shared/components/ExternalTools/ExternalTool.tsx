import * as React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { IExternalToolProps, IExternalToolUrlParameters } from './IExternalTool';
import { ExternalToolConfig } from './ExternalToolConfig';
import './styles.scss';

export class ExternalTool extends React.Component<
    IExternalToolProps,
    {  }
> {

    constructor(props: IExternalToolProps) {
        super(props);

        const urlParameterDefaults : IExternalToolUrlParameters = 
        {

        };
    }
    
    get config() : ExternalToolConfig {
        return this.props.toolConfig;
    }

    get urlParametersDefault() : IExternalToolUrlParameters {
        return  {
            // TODO: pull from DOM or somewhere in state
            studyName: "cBioPortal Data"
        }
    };

    /* TECH: looking for simplest ways to pass data to external tool.
     * 1) base64 encode to URL: will not work in Windows with 8196 char limit.
     * 2) clipboard: should work
     * 3) open a WebSocket and pass URL: may work
     */

    handleLaunchReady = () => {
        // assemble final available urlParameters
        var urlParameters = Object.assign(this.urlParametersDefault, this.props.urlFormatOverrides);

        // e.g. url_format: 'avm://?${downloadedFilePath}&-AutoMode=true&-ProjectNameHint=${studyName}'
        var urlFormat = this.props.toolConfig.url_format;

        // Replace all parameter references in urlFormat with the appropriate property in urlParameters
        var url = urlFormat;
        Object.keys(urlParameters).forEach(key => {
            const value = urlParameters[key];
            url = url.replace(new RegExp(`\\$\{${key}\}`, 'g'), value);
        });            

        window.location.href = url.substring(0, 100);
    }

    // TECH: pass data using Clipboard
    handleLaunchStart = () => {
        console.log('ExternalTool.handleLaunchStart:' + this.props.toolConfig.id);
        if (this.props.downloadData) {

            // data to clipboard
            // OPTIMIZE: compress to base64, or use a more efficient format
            var data = this.props.downloadData();

            /* REF: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
             * Clipboard API supported in Chrome 66+, Firefox 63+, Safari 10.1+, Edge 79+, Opera 53+
             */
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(data)
                    .then(() => {
                        console.log('Data copied to clipboard - size:' + data.length);
                        this.handleLaunchReady();
                    })
                    .catch(err => {
                        console.error(this.config.name + ' - Could not copy text: ', err);
                    });
            } else {
                // ASNEEDED: we could leverage the clipboard package like CopyDownloadButtons (which requires a UI element ref)
                // TODO: is there a proper way to report a failure?
                alert(this.config.name + ' launch failed: a modern browser is required.');
            }
        }
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
                onClick={this.handleLaunchStart}>
                    <img className="downloadButtonImageExternalTool" 
                        src={tool.iconImageSrc}/>
            </Button>
        </DefaultTooltip>
        );
    }    
}
