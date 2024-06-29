import { ICopyDownloadInputsProps } from "../copyDownloadControls/ICopyDownloadControls";
import { ExternalToolConfig } from "./ExternalToolConfig";

// may be referenced from url_format
export interface IExternalToolUrlParameters {
    studyName?: string,
}

export interface IExternalToolProps {
    toolConfig : ExternalToolConfig,
    // this is an object that contains a property map
    baseTooltipProps : any,
    overlayClassName? : string,
    downloadData?: () => string,

    // optional 
    urlFormatOverrides?: IExternalToolUrlParameters, 
}

