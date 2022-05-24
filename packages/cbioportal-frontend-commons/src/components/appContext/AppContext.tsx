import React, { Context } from 'react';

export interface IAppContext {
    showDownloadControls: boolean;
}

export const AppContext: Context<IAppContext> = React.createContext<
    IAppContext
>({
    showDownloadControls: true,
});
