import { ICopyDownloadInputsProps } from '../copyDownloadControls/ICopyDownloadControls';
import { ExternalToolConfig } from './ExternalToolConfig';

// may be referenced from url_format
export interface IExternalToolUrlParameters {
    [key: string]: any; // Adding an index signature
    studyName?: string;
    dataLength?: number;
}

// Now, when you use urlParameters, TypeScript knows it can be indexed with a string.

export interface IExternalToolProps {
    toolConfig: ExternalToolConfig;
    // this is an object that contains a property map
    baseTooltipProps: any;
    overlayClassName?: string;
    downloadData?: () => string;

    // optional
    urlFormatOverrides?: IExternalToolUrlParameters;
}
