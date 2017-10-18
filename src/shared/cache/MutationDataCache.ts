import client from "../api/cbioportalClientInstance";
import LazyMobXCache, {AugmentedData} from "../lib/LazyMobXCache";
import {MolecularProfile, Mutation, MutationFilter} from "../api/generated/CBioPortalAPI";
import {IDataQueryFilter} from "../lib/StoreUtils";
import _ from "lodash";

type Query = {
    entrezGeneId:number
};

function dataToKey(d:Mutation[]) {
    return `${d[0].entrezGeneId}`;
}

function queryToKey(q:Query) {
    return `${q.entrezGeneId}`;
}

async function fetch(queries:Query[],
               studyToMolecularProfile:{[studyId:string]:MolecularProfile},
                studyToDataQueryFilter:{[studyId:string]:IDataQueryFilter}):Promise<Mutation[][]> {
    const studies = Object.keys(studyToMolecularProfile);
    const results:Mutation[][] = await Promise.all(studies.map(studyId=>{
        const filter = studyToDataQueryFilter[studyId];
        const molecularProfile = studyToMolecularProfile[studyId];
        const entrezGeneIds = queries.map(x=>x.entrezGeneId);
        if (filter && molecularProfile && entrezGeneIds.length > 0) {
            return client.fetchMutationsInMolecularProfileUsingPOST({
                molecularProfileId: molecularProfile.molecularProfileId,
                mutationFilter: {
                    ...filter,
                    entrezGeneIds
                } as MutationFilter,
                projection: "DETAILED"
            });
        } else {
            return Promise.resolve([]);
        }
    }));
    return _.values(_.groupBy(_.flatten(results), 'entrezGeneId'));
}

export default class MutationDataCache extends LazyMobXCache<Mutation[], Query, string> {
    constructor(studyToMolecularProfile:{[studyId:string]:MolecularProfile},
                studyToDataQueryFilter:{[studyId:string]:IDataQueryFilter}) {
        super(queryToKey, dataToKey, fetch, studyToMolecularProfile, studyToDataQueryFilter);
    }
}