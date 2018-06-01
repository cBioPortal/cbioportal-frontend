import * as React from 'react';
import fileDownload from 'react-file-download';
import {observer} from "mobx-react";
import {observable} from "mobx";
import {CopyDownloadLinks} from "./CopyDownloadLinks";
import {CopyDownloadButtons} from "./CopyDownloadButtons";
import {ICopyDownloadControlsProps} from "./ICopyDownloadControls";
const Clipboard = require('clipboard');

export interface ISimpleCopyDownloadControlsProps extends ICopyDownloadControlsProps {
    downloadData?: () => string;
}

@observer
export class SimpleCopyDownloadControls extends React.Component<ISimpleCopyDownloadControlsProps, {}>
{
    public static defaultProps: ISimpleCopyDownloadControlsProps = {
        className: "",
        showCopy: true,
        copyMessageDuration: 3000,
        showDownload: true,
        copyLabel: "Copy",
        downloadLabel: "Download",
        downloadFilename: "data.tsv",
        controlsStyle: 'LINK'
    };

    @observable
    private showCopyMessage = false;

    constructor(props: ISimpleCopyDownloadControlsProps)
    {
        super(props);

        this.handleDownload = this.handleDownload.bind(this);
        this.copyLinkRef = this.copyLinkRef.bind(this);
        this.copyButtonRef = this.copyButtonRef.bind(this);
        this.handleAfterCopy = this.handleAfterCopy.bind(this);
    }

    public render()
    {
        if (this.props.controlsStyle === 'LINK') {
            return (
                <CopyDownloadLinks
                    className={this.props.className}
                    handleDownload={this.handleDownload}
                    copyLinkRef={this.copyLinkRef}
                    handleCopy={this.handleAfterCopy}
                    copyLabel={this.props.copyLabel}
                    downloadLabel={this.props.downloadLabel}
                    showCopyMessage={this.showCopyMessage}
                />
            );
        }
        else {
            return (
                <CopyDownloadButtons
                    className={this.props.className}
                    handleDownload={this.handleDownload}
                    copyButtonRef={this.copyButtonRef}
                    handleCopy={this.handleAfterCopy}
                    showCopyMessage={this.showCopyMessage}
                    showCopy={this.props.showCopy}
                    showDownload={this.props.showDownload}
                />
            );
        }
    }

    private handleDownload()
    {
        if (this.props.downloadData) {
            fileDownload(this.props.downloadData(), this.props.downloadFilename);
        }
    }

    private copyLinkRef(el: HTMLAnchorElement|null)
    {
        this.handleCopyRef(el);
    }

    private copyButtonRef(el: HTMLButtonElement|null)
    {
        this.handleCopyRef(el);
    }

    private handleCopyRef(el: HTMLElement|null)
    {
        if (el) {
            new Clipboard(el, {
                text: this.props.downloadData
            });
        }
    }

    private handleAfterCopy()
    {
        this.showCopyMessage = true;

        setTimeout(() => {
            this.showCopyMessage = false;
        }, this.props.copyMessageDuration);
    }
}