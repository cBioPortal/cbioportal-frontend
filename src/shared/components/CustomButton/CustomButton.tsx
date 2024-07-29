import * as React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { CancerStudy } from 'cbioportal-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    ICustomButtonConfig,
    ICustomButtonProps,
    CustomButtonUrlParameters,
} from './ICustomButton';
import { CustomButtonConfig } from './CustomButtonConfig';
import './styles.scss';

export class CustomButton extends React.Component<ICustomButtonProps, {}> {
    constructor(props: ICustomButtonProps) {
        super(props);
    }

    get config(): ICustomButtonConfig {
        return this.props.toolConfig;
    }

    // OPTIMIZE: this is computed when needed. It could be lazy, so it's only computed once, but it's unlikely to be called more than once per instance
    get urlParametersDefault(): CustomButtonUrlParameters {
        return {
            studyName: this.getSingleStudyName() ?? 'cBioPortal Data',
        };
    }

    // RETURNS: the name of the study for the current context, if exactly one study; null otherwise
    getSingleStudyName(): string | null {
        // extract the study name from the current context
        // CODEP: GroupComparisonPag stores a reference in the window, so when we are embedded there we can get details about which studies
        const groupComparisonPage = (window as any).groupComparisonPage;
        if (!groupComparisonPage) {
            return null;
        }

        const studies: CancerStudy[] =
            groupComparisonPage.store.displayedStudies.result;

        if (studies.length === 1) {
            return studies[0].name;
        } else {
            return null;
        }
    }

    openCustomUrl(urlParametersLaunch: CustomButtonUrlParameters) {
        // assemble final available urlParameters
        const urlParameters: CustomButtonUrlParameters = {
            ...this.urlParametersDefault,
            ...this.props.urlFormatOverrides,
            ...urlParametersLaunch,
        };

        // e.g. url_format: 'avm://?-ProjectName=${studyName}'
        const urlFormat = this.props.toolConfig.url_format;

        // Replace all parameter references in urlFormat with the appropriate property in urlParameters
        var url = urlFormat;
        Object.keys(urlParameters).forEach(key => {
            const value = urlParameters[key] ?? '';
            // TECH: location.href.set will actually encode the value, but we do it here for deterministic results with unit tests
            url = url.replace(
                new RegExp(`\\$\{${key}\}`, 'g'),
                encodeURIComponent(value)
            );
        });

        try {
            window.open(url, '_blank');
        } catch (e) {
            // TECH: in practice, this never gets hit. If the URL protocol is not supported, then a blank window appears.
            alert('Launching ' + this.config.name + ' failed: ' + e);
        }
    }

    // pass data using Clipboard to the external tool
    handleLaunchStart() {
        console.log('CustomButton.handleLaunchStart:' + this.props.toolConfig.id );

        if (this.props.downloadData) {
            // data to clipboard
            // OPTIMIZE: compress or use a more efficient format
            const data = this.props.downloadData();

            var urlParametersLaunch: CustomButtonUrlParameters = {
                dataLength: data.length.toString(),
            };

            /* REF: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
             * Clipboard API supported in Chrome 66+, Firefox 63+, Safari 10.1+, Edge 79+, Opera 53+
             */
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard
                    .writeText(data)
                    .then(() => {
                        console.log(
                            'Data copied to clipboard - size:' + data.length
                        );
                        this.openCustomUrl(urlParametersLaunch);
                    })
                    .catch(err => {
                        console.error(
                            this.config.name + ' - Could not copy text: ',
                            err
                        );
                    });
            } else {
                // TODO: proper way to report a failure?
                alert(
                    this.config.name +
                        ' launch failed: clipboard API is not avaialble.'
                );
            }
        }
        else
        {
            console.error(this.config.name + ': downloadData is not defined');
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
                    onClick={this.handleLaunchStart.bind(this)}
                >
                    <img
                        className="customButtonImage"
                        src={tool.iconImageSrc}
                    />
                </Button>
            </DefaultTooltip>
        );
    }
}
