import * as React from 'react';
import {If} from 'react-if';
import {Button, ButtonGroup} from 'react-bootstrap';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import {ICopyDownloadInputsProps} from "./ICopyDownloadControls";

export interface ICopyDownloadButtonsProps extends ICopyDownloadInputsProps {
    copyButtonRef?: (el: HTMLButtonElement|null) => void;
}

export class CopyDownloadButtons extends React.Component<ICopyDownloadButtonsProps, {}>
{
    public static defaultProps = {
        className: "",
        copyLabel: "",
        downloadLabel: "",
        showCopy: true,
        showDownload: true,
        showCopyMessage: false
    };

    public render() {
        return (
            <span className={this.props.className}>
                <If condition={this.props.showCopyMessage}>
                    <span style={{marginLeft: 10}} className="alert-success">Copied!</span>
                </If>
                <ButtonGroup style={{ marginLeft:10 }} className={this.props.className}>
                    <If condition={this.props.showCopy}>
                        <DefaultTooltip
                            overlay={<span>Copy</span>}
                            placement="top"
                            mouseLeaveDelay={0}
                            mouseEnterDelay={0.5}
                        >
                            <button
                                ref={this.props.copyButtonRef}
                                className="btn btn-sm btn-default"
                                data-clipboard-text="NA"
                                id="copyButton"
                                onClick={this.props.handleCopy}
                            >
                                {this.props.copyLabel} <i className='fa fa-clipboard'/>
                            </button>
                        </DefaultTooltip>
                    </If>
                    <If condition={this.props.showDownload}>
                        <DefaultTooltip
                            overlay={<span>Download TSV</span>}
                            mouseLeaveDelay={0}
                            mouseEnterDelay={0.5}
                            placement="top"
                        >
                            <Button className="btn-sm" onClick={this.props.handleDownload}>
                                {this.props.downloadLabel} <i className='fa fa-cloud-download'/>
                            </Button>
                        </DefaultTooltip>
                    </If>
                </ButtonGroup>
            </span>
        );
    }
}