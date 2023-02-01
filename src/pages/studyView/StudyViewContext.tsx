import React, { Context } from 'react';
export interface IStudyViewContext {
    hesitateUpdate: boolean;
}
export const StudyViewContext: Context<IStudyViewContext> = React.createContext<
    IStudyViewContext
>({
    hesitateUpdate: false,
});
