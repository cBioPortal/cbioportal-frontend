export type SiteErrorMode = 'dialog' | 'screen' | 'alert';

export type SiteError = {
    errorObj: any;
    dismissed: boolean;
    title?: string;
    mode?: SiteErrorMode;
    customMessage?: string;
};
