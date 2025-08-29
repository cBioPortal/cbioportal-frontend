import LazyMobXCache, { AugmentedData } from '../lib/LazyMobXCache';
import {
    NumericGeneMolecularData,
    MolecularDataFilter,
    MolecularProfile,
} from 'cbioportal-ts-api-client';
import client from 'shared/api/cbioportalClientInstance';
import _ from 'lodash';
import { IDataQueryFilter } from '../lib/StoreUtils';
import { isZScoreCalculatableProfile } from 'shared/model/MolecularProfileUtils';
import { calculateStats } from 'shared/lib/calculation/StatsUtils';

type Query = {
    entrezGeneId: number;
    molecularProfileId: string;
};

function queryToKey(q: Query) {
    return `${q.molecularProfileId}~${q.entrezGeneId}`;
}

function dataToKey(d: NumericGeneMolecularData[], q: Query) {
    return `${q.molecularProfileId}~${q.entrezGeneId}`;
}

async function fetch(
    queries: Query[],
    molecularProfileIdToSampleFilter: {
        [molecularProfileId: string]: IDataQueryFilter;
    },
    molecularProfileIdToMolecularProfile: {
        [molecularProfileId: string]: MolecularProfile;
    }
) {
    const molecularProfileIdToEntrezGeneIds = _.mapValues(
        _.groupBy(queries, q => q.molecularProfileId),
        profileQueries => profileQueries.map(q => q.entrezGeneId)
    );
    const params = Object.keys(molecularProfileIdToEntrezGeneIds).map(
        molecularProfileId => ({
            molecularProfileId,
            molecularDataFilter: {
                entrezGeneIds:
                    molecularProfileIdToEntrezGeneIds[molecularProfileId],
                ...molecularProfileIdToSampleFilter[molecularProfileId],
            } as MolecularDataFilter,
        })
    );
    const results: NumericGeneMolecularData[][] = await Promise.all(
        params.map(param =>
            client.fetchAllMolecularDataInMolecularProfileUsingPOST(param)
        )
    );
    const ret: {
        [key: string]: AugmentedData<NumericGeneMolecularData[], Query>;
    } = {};
    for (const query of queries) {
        ret[queryToKey(query)] = {
            data: [[]],
            meta: query,
        };
    }
    for (const queryResult of results) {
        const zScoreCalculateableData = queryResult.filter(molecularData =>
            isZScoreCalculatableProfile(
                molecularProfileIdToMolecularProfile[
                    molecularData.molecularProfileId
                ]
            )
        );
        //TODO if the population group is selected we have to pull NumericGeneMolecularData[] for all molecular profiles of that group and caluculate stats for them insead
        const stats = calculateStats(zScoreCalculateableData);
        const zscoresMolecularData = queryResult.map(molecularData => {
            if (
                isZScoreCalculatableProfile(
                    molecularProfileIdToMolecularProfile[
                        molecularData.molecularProfileId
                    ]
                )
            ) {
                const statForEntry =
                    stats[molecularData.molecularProfileId][
                        molecularData.entrezGeneId
                    ];
                let value =
                    (molecularData.value - statForEntry.mean) /
                    statForEntry.stdDev;
                value = parseFloat(value.toFixed(2)); //keep 2 digits in the fractional part
                return { ...molecularData, value };
            }
            return molecularData;
        });
        console.log('queryResult');
        console.log(queryResult);
        console.log('zscoresMolecularData');
        console.log(zscoresMolecularData);
        for (const datum of zscoresMolecularData) {
            ret[queryToKey(datum)].data[0].push(datum);
        }
    }
    return _.values(ret);
}

export default class GeneMolecularDataCache extends LazyMobXCache<
    NumericGeneMolecularData[],
    Query,
    Query
> {
    constructor(
        private molecularProfileIdToSampleFilter: {
            [molecularProfileId: string]: IDataQueryFilter;
        },
        private molecularProfileIdToMolecularProfile: {
            [molecularProfileId: string]: MolecularProfile;
        }
    ) {
        super(
            queryToKey,
            dataToKey,
            fetch,
            molecularProfileIdToSampleFilter,
            molecularProfileIdToMolecularProfile
        );
    }
}
