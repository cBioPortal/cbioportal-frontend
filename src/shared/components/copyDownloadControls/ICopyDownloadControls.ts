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
    // allow implementation to handle the data on it's own. 
    // TECH_DOWNLOADDATA: CopyDownloadButtons.downloadData needs to be async so it can work with either async context (IAsyncCopyDownloadControlsProps) or synchronous context (SimpleCopyDownloadControls)
    // TODO: we should return Promise<ICopyDownloadData> here, but would need to pull that interface out of CopyDownloadControls.tsx (circular dependency).
    downloadData?: Promise<string>;

}
