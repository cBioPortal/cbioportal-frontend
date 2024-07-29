import { CustomButtonConfig } from './CustomButtonConfig';

// these properties may be referenced from url_format like "${studyName}"
export type CustomButtonUrlParameters = {
    studyName?: string;
    dataLength?: string;
    // CODEP: when adding an indexing operator, easier for TypeScript when all properties are the same type (e.g. dataLength as string instead of integer)
    [key: string]: string | undefined;
};

// TECH: value of defining this interface is when you use urlParameters, TypeScript knows it can be indexed with a string.
//fnord review value
export interface ICustomButtonProps {
    toolConfig: ICustomButtonConfig;
    // this is an object that contains a property map
    baseTooltipProps: any;
    overlayClassName?: string;
    downloadData?: () => string;

    // optional
    urlFormatOverrides?: CustomButtonUrlParameters;
}

export interface ICustomButtonConfig {
    id: string;
    name: string;
    tooltip: string;
    iconImageSrc: string;
    required_user_agent?: string;
    required_installed_font_family?: string;
    url_format: string;    

    isAvailable?(): boolean;
}
