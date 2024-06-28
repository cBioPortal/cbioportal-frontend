export type CopyDownloadControlsStyle = 'BUTTON' | 'LINK' | 'QUERY';

export interface ICopyDownloadControlsProps {
    className?: string;
    downloadFilename?: string;
    showCopy?: boolean;
    copyLabel?: string;
    downloadLabel?: string;
    copyMessageDuration?: number;
    showDownload?: boolean;
    controlsStyle?: CopyDownloadControlsStyle;
}

export interface ICopyDownloadInputsProps {
    className?: string;
    showCopy?: boolean;
    showCopyMessage?: boolean;
    showDownload?: boolean;
    copyLabel?: string;
    downloadLabel?: string;
    handleDownload?: () => void;
    handleCopy?: () => void;
    // allow implementation to handle the data on it's own. The input here is from getDownloadData
    // ASNEEDED: it may be simpler to just pass the downloadData delegate here instead
    // handleCustom?: (handler: (text: string) => void);
    //fnord simpler
    downloadData?: () => string;
}
