export type QuerySession = {
    getCancerStudyIds:()=>string[];
    getGeneticProfileIds:()=>string[];
    getZScoreThreshold:()=>number;
    getRppaScoreThreshold:()=>number;
    getCaseSetId:()=>string;
    getSampleIds:()=>string[];
    getOQLQuery:()=>string;
    getStudySampleMap:()=>Object;
};
