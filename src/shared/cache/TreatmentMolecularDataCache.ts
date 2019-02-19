import LazyMobXCache, {AugmentedData} from "../lib/LazyMobXCache";
import {TreatmentMolecularData, TreatmentDataFilterCriteria} from "../api/generated/CBioPortalAPIInternal";
import client from "shared/api/cbioportalInternalClientInstance";
import _ from "lodash";
import {IDataQueryFilter} from "../lib/StoreUtils";

interface IQuery {
    treatmentId: string;
    molecularProfileId: string;
}

type SampleFilterByProfile = {
    [molecularProfileId: string]: IDataQueryFilter
};

function queryToKey(q: IQuery) {
    return `${q.molecularProfileId}~${q.treatmentId}`;
}

function dataToKey(d:TreatmentMolecularData[], q:IQuery) {
    return `${q.molecularProfileId}~${q.treatmentId}`;
}

/**
/* Pairs each IQuery with an (array-wrapped) array of any matching data.
*/
function augmentQueryResults(queries: IQuery[], results: TreatmentMolecularData[][]) {
    const keyedAugments: {[key: string]: AugmentedData<TreatmentMolecularData[], IQuery>} = {};
    for (const query of queries) {
        keyedAugments[queryToKey(query)] = {
            data: [[]],
            meta: query
        };
    }
    for (const queryResult of results) {
        for (let datum of queryResult) {
            datum = handleValueTruncation(datum);
            keyedAugments[
                queryToKey({
                    molecularProfileId: datum.geneticProfileId,
                    treatmentId: datum.treatmentId
                })
            ].data[0].push(datum);
        }
    }
    return _.values(keyedAugments);
}

// values are passed as strings from the REST facility
// check for value truncators ('>' or '<') to appear in front of values
// and convert to a numeric value and a separate truncation indicator
function handleValueTruncation(datum:TreatmentMolecularData) {
    let value = datum.value;
    var matches = /([><]*)(.+)/.exec(value as string);
    if (matches) {
        datum.value = Number(matches[2]);
        datum.truncation = (matches[1].length > 0) ? matches[1] : undefined;
    } else {
        datum.value = Number(value);
        datum.truncation = undefined;
    }
    return datum;
}

async function fetch(
    queries:IQuery[],
    sampleFilterByProfile: SampleFilterByProfile
): Promise<AugmentedData<TreatmentMolecularData[], IQuery>[]> {
    const treatmentIdsByProfile = _.mapValues(
        _.groupBy(queries, q => q.molecularProfileId),
        profileQueries => profileQueries.map(q => q.treatmentId)
    );
    const params = Object.keys(treatmentIdsByProfile)
        .map(profileId => ({
            geneticProfileId: profileId,
            // the Swagger-generated type expected by the client method below
            // incorrectly requires both samples and a sample list;
            // use 'as' to tell TypeScript that this object really does fit.
            // tslint:disable-next-line: no-object-literal-type-assertion
            treatmentDataFilterCriteria: {
                treatmentIds: treatmentIdsByProfile[profileId],
                ...sampleFilterByProfile[profileId]
            } as TreatmentDataFilterCriteria
        })
    );
    const dataPromises = params.map(param => client.fetchTreatmentDataItemsUsingPOST(param));
    const results: TreatmentMolecularData[][] = await Promise.all(dataPromises);
    return augmentQueryResults(queries, results);
}

export default class TreatmentMolecularDataCache extends LazyMobXCache<TreatmentMolecularData[], IQuery, IQuery>{
    constructor(molecularProfileIdToSampleFilter: SampleFilterByProfile) {
        super(queryToKey, dataToKey, fetch, molecularProfileIdToSampleFilter);
    }
}