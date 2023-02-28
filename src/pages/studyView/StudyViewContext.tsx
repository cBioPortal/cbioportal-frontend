import React, { Context } from 'react';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
export interface IStudyViewContext {
    store: StudyViewPageStore;
}
export const StudyViewContext: Context<IStudyViewContext> = React.createContext<
    IStudyViewContext
>({
    store: {} as StudyViewPageStore,
});
