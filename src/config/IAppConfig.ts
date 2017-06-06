export interface IAppConfig {
    genomespaceEnabled: boolean;
    cancerStudySearchPresets: string[];
    priorityStudies: PriorityStudies;
    showCivic?: boolean;
    showHotspot?: boolean;
    showMyCancerGenome?: boolean;
    showOncoKB?: boolean;
    oncoKBApiUrl?: string;
}

export type PriorityStudies = {
    [category:string]: string[]
};
