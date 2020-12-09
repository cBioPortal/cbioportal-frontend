import * as React from 'react';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import './errorScreen.scss';
import AppConfig from 'appConfig';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import { computed } from 'mobx';
import autobind from 'autobind-decorator';
var Clipboard = require('clipboard');

interface IErrorScreenProps {
    errorLog?: string;
    title?: string;
    body?: string | JSX.Element;
    errorMessages?: string[];
}

@observer
export default class ErrorScreen extends React.Component<
    IErrorScreenProps,
    {}
> {
    @autobind
    copyToClipRef(copyToClipButton: HTMLButtonElement) {
        this.copyToClipButton = copyToClipButton;
    }

    copyToClipButton: HTMLButtonElement | undefined = undefined;

    componentDidMount() {
        console.log('copytoclip', this.copyToClipButton);
        if (this.copyToClipButton !== undefined) {
            new Clipboard(this.copyToClipButton, {
                text: function() {
                    return JSON.stringify(this.errorLog);
                }.bind(this),
                container: this.copyToClipButton,
            });
        }
    }

    @computed get errorLog() {
        const errorLog: any = this.props.errorLog
            ? JSON.parse(this.props.errorLog)
            : undefined;

        // add the current url to error log
        if (errorLog) errorLog.url = window.location.href;

        return errorLog;
    }

    public render() {
        const location = getBrowserWindow().location.href;
        const subject = 'cBioPortal user reported error';

        return (
            <div className={'errorScreen'}>
                <a className={'errorLogo'} href={buildCBioPortalPageUrl('/')}>
                    <img
                        src={require('../../../globalStyles/images/cbioportal_logo.png')}
                        alt="cBioPortal Logo"
                    />
                </a>

                {this.props.title && <h4>{this.props.title}</h4>}

                {this.props.errorMessages && (
                    <div
                        style={{ marginTop: 20 }}
                        className={'alert alert-danger'}
                        role="alert"
                    >
                        <ul style={{ listStyleType: 'none' }}>
                            {this.props.errorMessages.map(
                                (errorMessage: string, index) => (
                                    <li>{`${index + 1}: ${errorMessage}`}</li>
                                )
                            )}
                        </ul>
                    </div>
                )}

                {this.props.body && <div>{this.props.body}</div>}

                {this.errorLog && AppConfig.serverConfig.skin_email_contact && (
                    <div style={{ marginTop: 20 }}>
                        <p style={{ marginBottom: 20 }}>
                            Please contact us at{' '}
                            <a
                                href={`mailto:${
                                    AppConfig.serverConfig.skin_email_contact
                                }?subject=${encodeURIComponent(
                                    subject
                                )}&body=${encodeURIComponent(
                                    window.location.href
                                )};${encodeURIComponent(
                                    this.props.errorLog || ''
                                )}`}
                            >
                                {AppConfig.serverConfig.skin_email_contact}
                            </a>
                            .
                        </p>
                        <p>
                            Copy-paste the error log below and provide a
                            click-by-click description of how you arrived at the
                            error.
                        </p>
                    </div>
                )}

                {this.errorLog && (
                    <div style={{ marginTop: 20 }} className="form-group">
                        <button
                            style={{ marginBottom: 5 }}
                            ref={this.copyToClipRef}
                            className={'btn btn-xs'}
                        >
                            Copy Error Log to Clipboard
                        </button>
                        <textarea
                            value={JSON.stringify(this.errorLog)}
                            className={'form-control'}
                        ></textarea>
                    </div>
                )}
            </div>
        );
    }
}
