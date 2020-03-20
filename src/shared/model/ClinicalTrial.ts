export type ITrial = {
    briefTitle: string;
    currentTrialStatus: string;
    arms: IArm[];
    nctId: string;
};

export type IArm = {
    armDescription: string;
    drugs: IDrug[];
};

export type IDrug = {
    ncitCode: string;
    drugName: string;
};

export type IMatchedTrials = {
    treatment: string;
    trials: ITrial[];
};
