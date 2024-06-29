import * as React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { IExternalToolProps, IExternalToolUrlParameters } from './IExternalTool';
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

    get urlParametersDefault() : IExternalToolUrlParameters {
        return  {
            // TODO: pull from DOM or somewhere in state
            studyName: "cBioPortal Data"
        }
    };

    handleLaunch = () => {
        console.log('ExternalTool.handleLaunch:' + this.props.toolConfig.id);
        if (this.props.downloadData) {
            // assemble final urlParameters
            var urlParameters = Object.assign(this.urlParametersDefault, this.props.urlFormatOverrides);

            if (!urlParameters.data) {
                urlParameters.data = this.props.downloadData();
            }

            // to pass the data directly the the app via URL, we need to encode it
            // TECH: we do this instead of as a downloaded file, since we don't know exactly where the browser would download the file or how it would name it.
            // OPTIMIZE: the data is TSV. Could compress first, or possibly send the data in a tighter pre-TSV format.
            if (urlParameters.data) {
                var base64data = btoa(urlParameters.data);
                urlParameters.data = base64data;
            }

            // e.g. url_format: 'avm://?${downloadedFilePath}&-AutoMode=true&-ProjectNameHint=${studyName}'
            var urlFormat = this.props.toolConfig.url_format;

            // Replace all parameter references in urlFormat with the appropriate property in urlParameters
            var url = urlFormat;
            Object.keys(urlParameters).forEach(key => {
                const value = urlParameters[key];
                //fnord url encode?
                url = url.replace(new RegExp(`\\$\{${key}\}`, 'g'), value);
            });            

            //fnorddebug
            console.log('Url.Len:' + url.length);
            console.log('Url:' + url.substring(0, 100) + '...');

            //fnord or location.href?
            //window.open(url, '_blank');
            window.location.href = url.substring(0, 100);
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
                onClick={this.handleLaunch}>
                    <img className="downloadButtonImageExternalTool" 
                        src={tool.iconImageSrc}/>
            </Button>
        </DefaultTooltip>
        );
    }    
}
