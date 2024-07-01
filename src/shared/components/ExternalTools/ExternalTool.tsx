import * as React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { CancerStudy } from 'cbioportal-ts-api-client';
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
    }
    
    get config() : ExternalToolConfig {
        return this.props.toolConfig;
    }

    get urlParametersDefault() : IExternalToolUrlParameters {
        return  {
            studyName: this.getSingleStudyName() ?? 'cBioPortal Data',
        }
    };

    // RETURNS: the name of the study for the current context, if exactly one study
    // - null if no studies, or more than one
    getSingleStudyName() : string | null {

        // extract the study name from the current context
        // CODEP: GroupComparisonPag stores a reference in the window,
        //  so when we are embedded there we can get details about which studies
        const groupComparisonPage = (window as any).groupComparisonPage;
        if (!groupComparisonPage) {
            return null;

        }
        const studies : CancerStudy[]= groupComparisonPage.store.displayedStudies.result;

        // DEBUG
        //console.log('Studies:' + studies.map(study => study.studyId).join(', '));

        if (studies.length === 1) {
            return studies[0].name;
        } else {
            return null;
        }
    }

    /* TECH: looking for simplest ways to pass data to external tool.
     * 1) base64 encode to URL: will not work in Windows with 8196 char limit.
     * 2) clipboard: should work
     * 3) open a WebSocket and pass URL: may work
     */

    handleLaunchReady = (urlParametersLaunch : IExternalToolUrlParameters) => {
        // assemble final available urlParameters
        const urlParameters = Object.assign(this.urlParametersDefault, 
            this.props.urlFormatOverrides, 
            urlParametersLaunch);

        // e.g. url_format: 'avm://?${downloadedFilePath}&-AutoMode=true&-ProjectNameHint=${studyName}'
        const urlFormat = this.props.toolConfig.url_format;

        // Replace all parameter references in urlFormat with the appropriate property in urlParameters
        var url = urlFormat;
        Object.keys(urlParameters).forEach(key => {
            const value = urlParameters[key];
            url = url.replace(new RegExp(`\\$\{${key}\}`, 'g'), value);
        });            

        window.location.href = url;
    }

    // TECH: pass data using Clipboard
    handleLaunchStart = () => {
        console.log('ExternalTool.handleLaunchStart:' + this.props.toolConfig.id);

        if (this.props.downloadData) {

            // data to clipboard
            // OPTIMIZE: compress to base64, or use a more efficient format
            const data = this.props.downloadData();

            var urlParametersLaunch : IExternalToolUrlParameters = {
                dataLength: data.length,
            };

            /* REF: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
             * Clipboard API supported in Chrome 66+, Firefox 63+, Safari 10.1+, Edge 79+, Opera 53+
             */
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(data)
                    .then(() => {
                        console.log('Data copied to clipboard - size:' + data.length);
                        this.handleLaunchReady(urlParametersLaunch);
                    })
                    .catch(err => {
                        console.error(this.config.name + ' - Could not copy text: ', err);
                    });
            } else {
                // TODO: proper way to report a failure?
                alert(this.config.name + ' launch failed: clipboard API is not avaialble.');
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
