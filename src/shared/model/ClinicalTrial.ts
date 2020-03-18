export type ITrial = {
    briefTitle: string;
    currentTrialStatus: string;
    drugs: IDrug[];
    nctId: string;
};

export type IDrug = {
    ncitCode: string;
    drugName: string;
};

export type IMatchedTrials = {
    treatment: string;
    trials: ITrial[];
};
