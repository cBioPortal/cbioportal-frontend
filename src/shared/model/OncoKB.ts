import {IndicatorQueryResp} from "shared/api/generated/OncoKbAPI";

export interface IEvidence {
    id: string;
    gene: any;
    alteration: any[];
    prevalence: any[];
    progImp: any[];
    treatments: {
        sensitivity: any[];
        resistance: any[];
    }; //separated by level type
    trials: any[];
    oncogenic: string;
    oncogenicRefs: string[];
    mutationEffect: any;
    summary: string;
    drugs: {
        sensitivity: {
            current: any[];
            inOtherTumor: any[];
        },
        resistance: any[];
    };
}

export interface IOncoKbData {
    indicatorMap: {[id:string]: IndicatorQueryResp} | null;
    uniqueSampleKeyToTumorType: {[sampleId:string]: string} | null;
}

export interface IOncoKbDataWrapper {
    status: "pending" | "error" | "complete";
    result?: IOncoKbData|Error;
}
