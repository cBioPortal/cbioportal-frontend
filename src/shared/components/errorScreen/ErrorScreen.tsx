import * as React from 'react';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import './errorScreen.scss';
import AppConfig from 'appConfig';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import { If, Then, Else } from 'react-if';
import { Modal } from 'react-bootstrap';
import { SiteError } from 'AppStore';
import { computed, observable } from 'mobx';
import {
    formatErrorLog,
    formatErrorMessages,
    formatErrorTitle,
} from 'shared/lib/errorFormatter';
import _ from 'lodash';
import bind from 'bind-decorator';
import autobind from 'autobind-decorator';

interface IErrorScreenProps {
    errorLog?: string;
    title?: string;
    body?: string | JSX.Element;
    errors?: SiteError[];
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
    @observable currentErrorIndex = 0;

    @computed get currentError() {
        if (!this.props.errors || this.props.errors.length === 0) {
            return undefined;
        } else {
            if (this.currentErrorIndex >= this.props.errors.length) {
                return this.props.errors[this.currentErrorIndex];
            } else {
                return this.props.errors[0];
            }
        }
    }

    @computed get errorMessage() {
        return this.currentError
            ? formatErrorMessages([this.currentError])
            : undefined;
    }

    @computed get errorLog() {
        return this.currentError
            ? formatErrorLog([this.currentError])
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
        return this.currentError
            ? formatErrorTitle([this.currentError])
            : undefined;
    }

    @computed get mode() {
        // if any of the errors are screen errors, we treat all as screen
        return _.every(this.props.errors, err => err.mode === 'dialog')
            ? 'dialog'
            : 'screen';
    }

    public render() {
        if (this.mode === 'dialog') {
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
        } else {
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
                    <div>
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
                    </div>
                )}

                {this.props.errorLog && (
                    <div style={{ marginTop: 20 }} className="form-group">
                        <label>Error log:</label>
                        <textarea
                            value={this.errorLog}
                            className={'form-control'}
                        ></textarea>
                    </div>
                )}
            </>
        );
    }
}
