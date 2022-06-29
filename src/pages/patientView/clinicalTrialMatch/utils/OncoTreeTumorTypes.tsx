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
let url = '/tumorTypes.json';
if (window.location.hostname === 'localhost') {
    url = 'http://oncotree.mskcc.org/api/tumorTypes';
}
getRequest.open('Get', url, false);
getRequest.send(null);
const oncoTreeTumorTypes: Array<tumorType> = JSON.parse(
    getRequest.responseText
);

export default oncoTreeTumorTypes;
