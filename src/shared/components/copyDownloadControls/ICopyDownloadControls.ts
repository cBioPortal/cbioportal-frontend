export type CopyDownloadControlsStyle = 'BUTTON' | 'LINK';

export interface ICopyDownloadControlsProps
{
    className?: string;
    downloadFilename?: string;
    showCopy?: boolean;
    copyLabel?: string;
    downloadLabel?: string;
    copyMessageDuration?: number;
    showDownload?: boolean;
    controlsStyle?: CopyDownloadControlsStyle;
}

export interface ICopyDownloadInputsProps
{
    className?: string;
    showCopy?: boolean;
    showCopyMessage?: boolean;
    showDownload?: boolean;
    copyLabel?: string;
    downloadLabel?: string;
    handleDownload?: () => void;
    handleCopy?: () => void;
}

