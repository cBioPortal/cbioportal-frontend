import React, { Context } from 'react';

export enum DownloadControlOption {
    SHOW_ALL = 'show',
    HIDE_DATA = 'data',
    HIDE_ALL = 'hide',
}

export interface IAppContext {
    showDownloadControls: DownloadControlOption;
}

export const AppContext: Context<IAppContext> = React.createContext<
    IAppContext
>({
    showDownloadControls: DownloadControlOption.SHOW_ALL,
});
