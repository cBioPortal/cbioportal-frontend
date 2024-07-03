import { ICopyDownloadInputsProps } from '../copyDownloadControls/ICopyDownloadControls';
import { ExternalToolConfig } from './ExternalToolConfig';

// may be referenced from url_format
export type IExternalToolUrlParameters = {
    studyName?: string;
    dataLength?: string;
    // TECH: to add an indexing operator, TypeScript likes it when all properties are the same type
    [key: string]: string | undefined; 
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
