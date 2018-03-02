import * as React from 'react';
import {If} from 'react-if';
import {ICopyDownloadInputsProps} from "./ICopyDownloadControls";

export interface ICopyDownloadLinksProps extends ICopyDownloadInputsProps {
    copyLinkRef?: (el: HTMLAnchorElement|null) => void;
}

export class CopyDownloadLinks extends React.Component<ICopyDownloadLinksProps, {}>
{
    public static defaultProps = {
        className: "",
        copyButtonLabel: "Copy",
        downloadButtonLabel: "Download",
        showCopy: true,
        showDownload: true,
    };

    public render() {
        return (
            <span className={this.props.className}>
                {
                    this.props.showCopy &&
                    <a onClick={this.props.handleCopy} ref={this.props.copyLinkRef}>
                        <i className='fa fa-clipboard' style={{marginRight: 5}}/>{this.props.copyLabel}
                    </a>
                }
                {
                    this.props.showCopy && this.props.showDownload &&
                    <span style={{margin: '0px 10px'}}>|</span>
                }
                {
                    this.props.showDownload &&
                    <a onClick={this.props.handleDownload} style={{marginRight: 10}}>
                        <i className='fa fa-cloud-download' style={{marginRight: 5}}/>{this.props.downloadLabel}
                    </a>
                }
                {
                    this.props.showCopyMessage &&
                    <span className="alert-success">Copied!</span>
                }
            </span>
        );
    }
}