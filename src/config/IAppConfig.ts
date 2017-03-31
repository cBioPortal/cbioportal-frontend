export interface IAppConfig {
    cancerStudySearchPresets: string[];
    priorityStudies: PriorityStudies;
}

export type PriorityStudies = {
    [category:string]: string[]
};
