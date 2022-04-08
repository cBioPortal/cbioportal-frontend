type tumorType = {
    code?: string;
    color?: string;
    name?: string;
    mainType?: string;
    externalReferences?: {
        UMLS?: Array<string>;
        NCI?: Array<string>;
    };
    tissue?: string;
    children?: object;
    parent?: string;
    history?: Array<any>;
    level?: number;
    revocations?: Array<any>;
    precursors?: Array<any>;
};

let getRequest = new XMLHttpRequest();
getRequest.open('Get', 'http://oncotree.mskcc.org/api/tumorTypes', false);
getRequest.send(null);
const oncoTreeTumorTypes: Array<tumorType> = JSON.parse(
    getRequest.responseText
);

export default oncoTreeTumorTypes;
