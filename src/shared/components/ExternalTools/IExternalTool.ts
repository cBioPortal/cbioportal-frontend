import { ICopyDownloadInputsProps } from "../copyDownloadControls/ICopyDownloadControls";
import { ExternalToolConfig } from "./ExternalToolConfig";

export interface IExternalToolProps {
    toolConfig : ExternalToolConfig,
    // this is an object that contains a property map
    baseTooltipProps : any,
    overlayClassName? : string,
    downloadData?: () => string,

    //hostControls : ICopyDownloadInputsProps
    // fnord need?
}