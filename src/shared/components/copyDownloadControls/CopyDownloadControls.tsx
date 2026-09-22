import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { ThreeBounce } from 'better-react-spinkit';
import { If } from 'react-if';
import fileDownload from 'react-file-download';
import { action, observable, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
const Clipboard = require('clipboard');

import copyDownloadStyles from './copyDownloadControls.module.scss';
import { CopyDownloadButtons } from './CopyDownloadButtons';
import {
    ICancelableCopyDownloadPromise,
    ICopyDownloadControlsProps,
    ICopyDownloadProgress,
    ICopyDownloadProgressCallback,
} from './ICopyDownloadControls';

export interface IAsyncCopyDownloadControlsProps
    extends ICopyDownloadControlsProps {
    downloadData?: (
        onProgress?: ICopyDownloadProgressCallback
    ) => Promise<ICopyDownloadData>;
}

export interface ICopyDownloadData {
    status: 'complete' | 'incomplete';
    text: string;
    blob?: Blob;
}

export function copyDownloadBlobToText(blob: Blob): Promise<string> {
    const text = (blob as Blob & { text?: () => Promise<string> }).text;
    if (text) {
        return text.call(blob);
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

/**
 * @author Selcuk Onur Sumer
 * @author Aaron Lisman
 */
@observer
export class CopyDownloadControls extends React.Component<
    IAsyncCopyDownloadControlsProps,
    {}
> {
    @observable downloadingData = false;
    @observable copyingData = false;
    @observable showErrorMessage = false;
    @observable showTooltipCopyMessage = false;
    @observable downloadProgress: ICopyDownloadProgress | undefined;

    private _copyButton: HTMLButtonElement | null = null;
    private _modalCopyButton: HTMLButtonElement | null = null;
    private _modalCopyButtonContainer: HTMLElement | null = null;

    private _copyText: string | null = null;
    private cancelDownloadRequest: (() => void) | undefined;
    private downloadRequestCounter = 0;
    private activeDownloadRequest = 0;

    public static defaultProps: IAsyncCopyDownloadControlsProps = {
        className: '',
        copyMessageDuration: 3000,
        showCopy: true,
        showDownload: true,
        downloadFilename: 'data.tsv',
    };

    constructor(props: IAsyncCopyDownloadControlsProps) {
        super(props);
        makeObservable(this);
        this.handleDownload = this.handleDownload.bind(this);
        this.handleCopy = this.handleCopy.bind(this);
        this.handleModalClose = this.handleModalClose.bind(this);
        this.cancelDownload = this.cancelDownload.bind(this);
    }

    componentWillUnmount() {
        this.cancelDownload();
    }

    componentDidMount() {
        // this is necessary because the clipboard wrapper library
        // doesn't work with tooltips :(
        if (this.props.showCopy) {
            this.bindCopyButton(this._copyButton);
        }
    }

    public bindCopyButton(
        button: HTMLButtonElement | null,
        container?: HTMLElement | null
    ) {
        if (button) {
            new Clipboard(button, {
                text: this.getText.bind(this),
                // we need to pass a container to the clipboard when we use it in a Modal element
                // see https://stackoverflow.com/questions/38398070/bootstrap-modal-does-not-work-with-clipboard-js-on-firefox
                container: container,
            });
        }
    }

    public render() {
        return (
            <span>
                <CopyDownloadButtons
                    className={this.props.className}
                    showCopy={this.props.showCopy}
                    showCopyMessage={this.showTooltipCopyMessage}
                    showDownload={this.props.showDownload}
                    copyLabel={this.props.copyLabel}
                    downloadLabel={this.props.downloadLabel}
                    handleDownload={this.handleDownload}
                    downloadDataAsync={this.downloadDataAsStringAsync}
                    handleCopy={this.handleCopy}
                    copyButtonRef={(el: HTMLButtonElement) => {
                        this._copyButton = el;
                    }}
                />
                {this.downloadIndicatorModal()}
                {this.copyIndicatorModal()}
                {this.downloadErrorModal()}
            </span>
        );
    }

    /**
     * Wrapper around downloadData() to return as a Promise<string> for ICopyDownloadButtonsProps
     * see TECH_DOWNLOADDATA
     */
    private downloadDataAsStringAsync = (): Promise<string | undefined> => {
        if (this.props.downloadData) {
            return this.props
                .downloadData()
                .then(data =>
                    data.blob ? copyDownloadBlobToText(data.blob) : data.text
                );
        } else {
            return Promise.resolve(undefined);
        }
    };

    public downloadIndicatorModal(): JSX.Element {
        return (
            <Modal
                show={this.downloadingData}
                onHide={() => undefined}
                bsSize="sm"
                className={`${copyDownloadStyles['centered-modal-dialog']}`}
            >
                <Modal.Body>
                    <ThreeBounce
                        style={{ display: 'inline-block', marginRight: 10 }}
                    />
                    <span>
                        {this.downloadProgress &&
                        this.downloadProgress.totalRows !== undefined
                            ? `Downloading ${this.downloadProgress.completedRows.toLocaleString()} of ${this.downloadProgress.totalRows.toLocaleString()} rows...`
                            : 'Downloading Table Data...'}
                    </span>
                    {this.cancelDownloadRequest && (
                        <Button
                            className="btn btn-default"
                            onClick={this.cancelDownload}
                        >
                            Cancel
                        </Button>
                    )}
                </Modal.Body>
            </Modal>
        );
    }

    public copyIndicatorModal(): JSX.Element {
        return (
            <Modal
                show={this.copyingData}
                onHide={() => undefined}
                onEntered={() => {
                    this.bindCopyButton(
                        this._modalCopyButton,
                        this._modalCopyButtonContainer
                    );
                }}
                bsSize="sm"
                className={`${copyDownloadStyles['centered-modal-dialog']}`}
            >
                <Modal.Header>
                    {this.showErrorMessage ? 'Copy Error!' : 'Copy Ready!'}
                </Modal.Header>
                <Modal.Body>
                    {this.showErrorMessage &&
                        'An error occurred while copying the data. Data may be incomplete.'}
                    Please click on Copy to copy the data to clipboard.
                </Modal.Body>
                <Modal.Footer>
                    <span
                        ref={(el: HTMLElement | null) => {
                            this._modalCopyButtonContainer = el;
                        }}
                    >
                        <button
                            ref={(el: HTMLButtonElement) => {
                                this._modalCopyButton = el;
                            }}
                            onClick={this.handleModalClose}
                            className="btn btn-primary"
                            data-clipboard-text="NA"
                            id="modalCopyButton"
                        >
                            Copy
                        </button>
                    </span>
                </Modal.Footer>
            </Modal>
        );
    }

    public downloadErrorModal(): JSX.Element {
        return (
            <Modal
                show={!this.copyingData && this.showErrorMessage}
                onHide={this.handleModalClose}
                bsSize="sm"
                className={`${copyDownloadStyles['centered-modal-dialog']}`}
            >
                <Modal.Header>Download Error!</Modal.Header>
                <Modal.Body>
                    An error occurred while downloading the data. Downloaded
                    file may contain incomplete data.
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        onClick={this.handleModalClose}
                        className="btn btn-primary"
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }

    public getText(): string {
        return this._copyText || '';
    }

    public handleCopy() {
        this.initCopyProcess();
    }

    public initCopyProcess() {
        // this makes sure that copy data and the download data are the same/consistent
        this.initDownloadProcess(data => {
            const handleText = (text: string) => {
                // do not update if the copy text is not updated since the last copy request
                // (also do not update the observable "copyingData" otherwise prompting unnecessary copy modal)
                if (this._copyText !== text) {
                    this._copyText = text;
                    this.copyingData = true;
                } else {
                    this.showSimpleCopyMessage();
                }
            };
            if (data.blob) {
                copyDownloadBlobToText(data.blob).then(handleText);
            } else {
                handleText(data.text);
            }
        });
    }

    public handleDownload() {
        this.initDownloadProcess(data => {
            // save the text so that we won't prompt it again for copy action
            if (!data.blob) {
                this._copyText = data.text;
            }

            // init file download
            this.download(data.blob || data.text);
        });
    }

    public initDownloadProcess(callback: (data: ICopyDownloadData) => void) {
        if (this.props.downloadData) {
            this.cancelDownload();
            const requestId = ++this.downloadRequestCounter;
            this.activeDownloadRequest = requestId;
            // mark downloading data true, so that we can show a loading message
            this.downloadingData = true;
            this.showErrorMessage = false;
            this.downloadProgress = undefined;

            let downloadPromise: ICancelableCopyDownloadPromise<ICopyDownloadData>;
            try {
                downloadPromise = this.props.downloadData(
                    this.updateDownloadProgress(requestId)
                ) as ICancelableCopyDownloadPromise<ICopyDownloadData>;
            } catch (error) {
                this.triggerDownloadError(requestId);
                return;
            }
            this.cancelDownloadRequest = downloadPromise.cancel;

            downloadPromise
                .then(copyDownloadData => {
                    if (!this.isActiveDownload(requestId)) {
                        return;
                    }
                    if (copyDownloadData.status === 'complete') {
                        // promise is resolved, we need to hide the download indicator
                        this.downloadingData = false;
                        this.cancelDownloadRequest = undefined;
                        this.activeDownloadRequest = 0;
                    } else {
                        this.triggerDownloadError(requestId);
                    }

                    callback(copyDownloadData);
                })
                .catch(() => {
                    if (this.isActiveDownload(requestId)) {
                        this.triggerDownloadError(requestId);
                    }
                });
        }
    }

    @action
    private updateDownloadProgress = (requestId: number) => (
        progress: ICopyDownloadProgress
    ) => {
        if (this.isActiveDownload(requestId)) {
            this.downloadProgress = progress;
        }
    };

    @action
    public cancelDownload() {
        this.activeDownloadRequest = 0;
        this.cancelDownloadRequest?.();
        this.cancelDownloadRequest = undefined;
        this.downloadProgress = undefined;
        this.downloadingData = false;
    }

    private isActiveDownload(requestId: number): boolean {
        return this.activeDownloadRequest === requestId;
    }

    public download(text: string | Blob) {
        if (typeof text !== 'string') {
            fileDownload(text, this.props.downloadFilename);
            return;
        }
        try {
            const jsonData = JSON.parse(text);
            if (Array.isArray(jsonData)) {
                const headers = Object.keys(jsonData[0]);

                const tsvContent = [
                    headers.join('\t'),
                    ...jsonData.map(row =>
                        headers.map(header => row[header] || '').join('\t')
                    ),
                ].join('\n');

                fileDownload(tsvContent, this.props.downloadFilename);
                return;
            }
        } catch (error) {
            // Fallback to downloading raw text if JSON parsing fails
            fileDownload(text, this.props.downloadFilename);
        }
    }

    @action
    private handleModalClose() {
        // need to set both flags to false,
        // in order to not show multiple modals in case of a download error during copy action
        this.copyingData = false;
        this.showErrorMessage = false;
    }

    @action
    private triggerDownloadError(requestId: number) {
        if (!this.isActiveDownload(requestId)) {
            return;
        }
        // promise is rejected: we need to hide the download indicator and show an error message
        this.downloadingData = false;
        this.cancelDownloadRequest = undefined;
        this.activeDownloadRequest = 0;
        this.showErrorMessage = true;
    }

    @action
    private showSimpleCopyMessage() {
        this.showTooltipCopyMessage = true;

        // we only want to show the notification for a limited time
        setTimeout(() => {
            this.showTooltipCopyMessage = false;
        }, this.props.copyMessageDuration);
    }
}
