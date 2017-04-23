export interface IAppConfig {
    host: string;
    cancerStudySearchPresets: string[];
    priorityStudies: PriorityStudies;
}

export type PriorityStudies = {
    [category:string]: string[]
};
