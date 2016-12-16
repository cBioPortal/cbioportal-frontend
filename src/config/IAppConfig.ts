export interface IAppConfig {
    genomespaceEnabled: boolean;
    cancerStudySearchPresets: string[];
    priorityStudies: PriorityStudies;
}

export type PriorityStudies = {
    [category:string]: string[]
};
