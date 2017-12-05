import * as React from 'react';
import {Modal, Button, ButtonGroup} from 'react-bootstrap';
import {ThreeBounce} from 'better-react-spinkit';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import {If} from 'react-if';
import fileDownload from 'react-file-download';
import {observable} from "mobx";
import {observer} from "mobx-react";
const Clipboard = require('clipboard');

import copyDownloadStyles from "./copyDownloadControls.module.scss";

export interface ICopyDownloadControlsProps {
    className?: string;
    showCopy?: boolean;
    showDownload?: boolean;
    downloadData?: () => Promise<string>;
    downloadFilename?: string;
}

/**
 * @author Selcuk Onur Sumer
 * @author Aaron Lisman
 */
@observer
export class CopyDownloadControls extends React.Component<ICopyDownloadControlsProps, {}>
{
    @observable downloadingData:boolean = false;

    private _copyButton: HTMLElement;

    public static defaultProps:ICopyDownloadControlsProps = {
        className: "",
        showCopy: true,
        showDownload: true,
        downloadFilename: "data.tsv"
    };

    constructor()
    {
        super();
        this.getText = this.getText.bind(this);
        this.handleDownload = this.handleDownload.bind(this);
    }

    componentDidMount() {
        // this is necessary because the clipboard wrapper library
        // doesn't work with tooltips :(
        if (this.props.showCopy  && this._copyButton) {
            this.bindCopyButton();
        }
    }

    public bindCopyButton()
    {
        new Clipboard(this._copyButton, {
            text: function() {
                return this.getText();
            }.bind(this)
        });
    }

    public render()
    {
        const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

        return (
            <span>
                <ButtonGroup className={this.props.className} style={{ marginLeft:10 }}>
                    <If condition={this.props.showCopy}>
                        <DefaultTooltip
                            overlay={<span>Copy</span>}
                            placement="top"
                            mouseLeaveDelay={0}
                            mouseEnterDelay={0.5}
                            arrowContent={arrowContent}
                        >
                            <button
                                ref={(el:HTMLButtonElement) => {this._copyButton = el;}}
                                className="btn btn-sm btn-default"
                                data-clipboard-text="NA"
                                id="copyButton"
                                option-text={this.getText}
                            >
                                <i className='fa fa-clipboard'/>
                            </button>
                        </DefaultTooltip>
                    </If>

                    <If condition={this.props.showDownload}>
                        <DefaultTooltip
                            overlay={<span>Download CSV</span>}
                            mouseLeaveDelay={0}
                            mouseEnterDelay={0.5}
                            placement="top"
                            arrowContent={arrowContent}
                        >
                            <Button className="btn-sm" onClick={this.handleDownload}>
                                <i className='fa fa-cloud-download'/>
                            </Button>
                        </DefaultTooltip>
                    </If>
                </ButtonGroup>
                <Modal
                    show={this.downloadingData}
                    onHide={() => undefined}
                    bsSize="sm"
                    className={`${copyDownloadStyles["centered-modal-dialog"]}`}
                >
                    <Modal.Body>
                        <ThreeBounce style={{ display:'inline-block', marginRight:10 }} />
                        <span>Downloading Table Data...</span>
                    </Modal.Body>
                </Modal>
            </span>
        );
    }

    public getText()
    {
        return (this.props.downloadData && this.props.downloadData()) || "";
    }

    public handleDownload()
    {
        if (this.props.downloadData) {
            this.downloadingData = true;
            this.props.downloadData().then(text => {
                fileDownload(text, this.props.downloadFilename);
                this.downloadingData = false;
            }).catch(() => {
                this.downloadingData = false;
            });
        }
    };
}
