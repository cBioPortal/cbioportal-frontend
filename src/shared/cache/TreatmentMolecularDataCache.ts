import LazyMobXCache, {AugmentedData} from "../lib/LazyMobXCache";
import {TreatmentMolecularData, TreatmentDataFilterCriteria} from "../api/generated/CBioPortalAPIInternal";
import client from "shared/api/cbioportalInternalClientInstance";
import _ from "lodash";
import {IDataQueryFilter} from "../lib/StoreUtils";

export type TreatmentMolecularDataEnhanced = TreatmentMolecularData & {
    thresholdType?: ">"|"<";
};

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
    const keyedAugments: {[key: string]: AugmentedData<TreatmentMolecularDataEnhanced[], IQuery>} = {};
    for (const query of queries) {
        keyedAugments[queryToKey(query)] = {
            data: [[]],
            meta: query
        };
    }
    for (const queryResult of results) {
        for (let datum of queryResult) {
            datum = handleValueThreshold(datum);
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

// Values are passed as strings from the REST facility
// check for value threshold indicators ('>' or '<') to appear in front of values
// and convert to a numeric value and a separate value threshold indicator
function handleValueThreshold(datum:TreatmentMolecularDataEnhanced):TreatmentMolecularDataEnhanced {

    if (! datum.thresholdType) { // this is to prevent repeated extraction of '>' and '<' symbols
        const matches = /([><]?)(.+)/.exec(datum.value);
        datum.thresholdType = undefined;
        if (matches) {
            datum.value = matches[2];
            if (matches[1].length > 0) {
                if (matches[1] === '>') {
                    datum.thresholdType = matches[1] as '>';
                } else if (matches[1] === '<') {
                    datum.thresholdType = matches[1] as '<';
                }
            }
        }
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
    const dataPromises = params.map(param => client.fetchTreatmentGeneticDataItemsUsingPOST(param));
    const results: TreatmentMolecularData[][] = await Promise.all(dataPromises);
    return augmentQueryResults(queries, results);
}

export default class TreatmentMolecularDataCache extends LazyMobXCache<TreatmentMolecularData[], IQuery, IQuery>{
    constructor(molecularProfileIdToSampleFilter: SampleFilterByProfile) {
        super(queryToKey, dataToKey, fetch, molecularProfileIdToSampleFilter);
    }
}