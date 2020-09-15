import * as React from 'react';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import './errorScreen.scss';
import AppConfig from 'appConfig';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import { If, Then, Else } from 'react-if';
import { Modal } from 'react-bootstrap';
import { computed, observable } from 'mobx';
import {
    formatErrorLog,
    formatErrorMessages,
    formatErrorTitle,
} from 'shared/lib/errorFormatter';
import _ from 'lodash';
import { SiteError, SiteErrorMode } from 'cbioportal-utils';
const Clipboard = require('clipboard');

interface IErrorScreenProps {
    title?: string;
    body?: string | JSX.Element;
    errors?: SiteError[];
    mode?: SiteErrorMode;
    errorLog?: string;
}

const Screen: React.FunctionComponent<{}> = ({ children }) => {
    return (
        <div className={'errorScreen'}>
            <a className={'errorLogo'} href={buildCBioPortalPageUrl('/')}>
                <img
                    src={require('../../../globalStyles/images/cbioportal_logo.png')}
                    alt="cBioPortal Logo"
                />
            </a>

            <div style={{ padding: 20 }}>
                <a href={buildCBioPortalPageUrl('/')}>Return to homepage</a>
            </div>

            {children}
        </div>
    );
};

const ErrorDialog: React.FunctionComponent<any> = ({
    children,
    dismissDialog,
    title,
}) => {
    return (
        <Modal show={true} onHide={dismissDialog}>
            <Modal.Header closeButton>
                <h4 className={'modal-title'}>{title}</h4>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
        </Modal>
    );
};

@observer
export default class ErrorScreen extends React.Component<
    IErrorScreenProps,
    {}
> {
    copyToClip: HTMLButtonElement | null;

    componentDidMount(): void {
        new Clipboard(this.copyToClip, {
            text: function() {
                return typeof this.errorLog === 'string'
                    ? this.errorLog
                    : JSON.stringify(this.errorLog);
            }.bind(this),
            container: this.copyToClip,
        });
    }

    @computed get errorLog() {
        const errorLog: any = this.props.errorLog
            ? JSON.parse(this.props.errorLog)
            : undefined;

        // add the current url to error log
        if (errorLog) errorLog.url = window.location.href;

        return errorLog;
    }

    // multiple simultaneous errors may be passed to the screen
    // this allows us to keep a "focused" error (currentError)
    @observable currentErrorIndex = 0;

    @computed get currentError() {
        if (this.errors.length === 0) {
            return undefined;
        } else {
            if (this.currentErrorIndex >= this.errors.length) {
                return this.errors[this.currentErrorIndex];
            } else {
                return this.errors[0];
            }
        }
    }

    @computed get errors() {
        return this.props.errors || [];
    }

    @computed get errorMessage() {
        return this.currentError
            ? formatErrorMessages([this.currentError])
            : undefined;
    }

    @computed get errorUrl() {
        try {
            return this.currentError!.errorObj.response.req.url;
        } catch (e) {
            return undefined;
        }
    }

    @computed get errorTitle() {
        let title: string | undefined;

        if (this.props.title) {
            title = this.props.title;
        }

        if (this.currentError) {
            title = formatErrorTitle([this.currentError]);
        }

        return title || "Oops, there's been a system error!";
    }

    @computed get mode() {
        // if any of the errors are screen errors, we treat all as screen
        if (this.props.mode) {
            return this.props.mode;
        } else if (!this.errors) {
            return 'screen';
        } else if (
            _.some(this.errors, err => !err.mode || err.mode === 'screen')
        ) {
            return 'screen';
        } else {
            return this.currentError!.mode || 'screen';
        }
    }

    public render() {
        switch (this.mode) {
            case 'dialog':
                return (
                    <ErrorDialog
                        title={
                            this.errorTitle ||
                            'Oops. There was an error retrieving data.'
                        }
                        dismissDialog={() => {
                            if (this.currentError)
                                this.currentError.dismissed = true;
                        }}
                    >
                        {this.content()}
                    </ErrorDialog>
                );
                break;
            case 'alert':
                console.log('alert');
                return null;
                break;

            default:
                return <Screen>{this.content()}</Screen>;
        }
    }

    content() {
        const location = getBrowserWindow().location.href;
        const subject = 'cBioPortal user reported error';

        return (
            <>
                {this.errorTitle && this.mode === 'screen' && (
                    <h4>{this.errorTitle}</h4>
                )}

                {this.errorUrl && (
                    <div style={{ wordBreak: 'break-word' }}>
                        <strong>Endpoint:</strong> {this.errorUrl}
                    </div>
                )}

                {this.errorMessage && (
                    <div
                        style={{ marginTop: 20 }}
                        className={'alert alert-danger'}
                        role="alert"
                    >
                        {this.errorMessage}
                    </div>
                )}

                {this.props.body && <div>{this.props.body}</div>}

                {AppConfig.serverConfig.skin_email_contact && (
                    <div style={{ marginTop: 20 }}>
                        If this error persists, please contact us at{' '}
                        <a
                            href={`mailto:${
                                AppConfig.serverConfig.skin_email_contact
                            }?subject=${encodeURIComponent(
                                subject
                            )}&body=${encodeURIComponent(this.errorLog || '')}`}
                        >
                            {AppConfig.serverConfig.skin_email_contact}
                        </a>
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
                            ref={el => (this.copyToClip = el)}
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
            </>
        );
    }
}
