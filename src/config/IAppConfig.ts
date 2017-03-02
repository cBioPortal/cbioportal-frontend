export interface IAppConfig {
    apiRoot: string;
    hotspotsApiRoot: string;
    hotspots3DApiRoot: string;
    tissueImageCheckUrl: string;
    cancerStudySearchPresets: string[];
    priorityStudies: PriorityStudies;
}

export type PriorityStudies = {
	[category:string]: string[]
};
