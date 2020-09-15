import { observer } from 'mobx-react';
import * as React from 'react';
import { observable } from 'mobx';
import { Modal } from 'react-bootstrap';
import { useEffect, useRef } from 'react';
import autobind from 'autobind-decorator';
import { SiteError } from 'cbioportal-utils';
var Clipboard = require('clipboard');

interface IErrAlertProps {
    err: SiteError;
    onDismiss: () => void;
    errorLog: string;
}

@observer
export class ErrorAlert extends React.Component<IErrAlertProps, {}> {
    @observable showDetailDialog = false;

    render() {
        return (
            <div className="errorAlert" onClick={() => this.props.onDismiss}>
                {this.props.err.customMessage || this.props.err.title}
                <button
                    style={{ marginLeft: 10 }}
                    className={'btn btn-default btn-xs'}
                    onClick={() => (this.showDetailDialog = true)}
                >
                    More info
                </button>
                <i className={'fa fa-times dismissAlert'}></i>

                {this.showDetailDialog && (
                    <ErrorModal
                        errorLog={this.props.errorLog}
                        onClose={() => (this.showDetailDialog = false)}
                    />
                )}
            </div>
        );
    }
}

interface IErrorModalProps {
    errorLog: string;
    onClose: () => void;
}

class ErrorModal extends React.Component<IErrorModalProps> {
    copyToClip: HTMLButtonElement | null;

    componentDidMount(): void {}

    @autobind
    handleMouseDown() {
        new Clipboard(this.copyToClip, {
            text: function() {
                return typeof this.props.errorLog === 'string'
                    ? this.props.errorLog
                    : JSON.stringify(this.props.errorLog);
            }.bind(this),
            container: this.copyToClip,
        });
    }

    render() {
        return (
            <Modal show={true} onHide={this.props.onClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Error Log</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="form-group">
                        <button
                            style={{ marginBottom: 5 }}
                            ref={el => {
                                this.copyToClip = el;
                            }}
                            className={'btn btn-xs'}
                            onMouseDown={this.handleMouseDown}
                        >
                            Copy Error Log to Clipboard
                        </button>
                        <textarea
                            style={{ minHeight: 300 }}
                            value={this.props.errorLog}
                            className={'form-control'}
                        ></textarea>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}
