import * as _ from 'lodash';
import {
    GeneticProfile, Mutation, MutationFilter, default as CBioPortalAPI, DiscreteCopyNumberData,
    DiscreteCopyNumberFilter, ClinicalData
} from "shared/api/generated/CBioPortalAPI";
import defaultClient from "shared/api/cbioportalClientInstance";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import hotspot3DClient from 'shared/api/3DhotspotClientInstance';
import hotspotClient from 'shared/api/hotspotClientInstance';
import {CosmicMutation, default as CBioPortalAPIInternal} from "shared/api/generated/CBioPortalAPIInternal";
import oncokbClient from "shared/api/oncokbClientInstance";
import {
    generateIdToIndicatorMap, generateQueryVariant, generateEvidenceQuery
} from "shared/lib/OncoKbUtils";
import {Query, default as OncoKbAPI} from "shared/api/generated/OncoKbAPI";
import {getAlterationString} from "shared/lib/CopyNumberUtils";
import {MobxPromise} from "mobxpromise";
import {keywordToCosmic, indexHotspots, geneToMyCancerGenome} from "shared/lib/AnnotationUtils";
import {IOncoKbData} from "shared/model/OncoKB";
import {IMyCancerGenomeData, IMyCancerGenome} from "shared/model/MyCancerGenome";
import {IHotspotData, ICancerHotspotData} from "shared/model/CancerHotspots";
import CancerHotspotsAPI from "../api/generated/CancerHotspotsAPI";

export const ONCOKB_DEFAULT: IOncoKbData = {
    sampleToTumorMap : {},
    indicatorMap : {}
};

export const HOTSPOTS_DEFAULT = {
    single: [],
    clustered: []
};

export async function fetchMutationData(mutationFilter:MutationFilter,
                                        geneticProfileId?:string,
                                        client:CBioPortalAPI = defaultClient)
{
    if (geneticProfileId) {
        return await client.fetchMutationsInGeneticProfileUsingPOST({
            geneticProfileId,
            mutationFilter,
            projection: "DETAILED"
        });
    } else {
        return [];
    }
}

export async function fetchCosmicData(mutationData:MobxPromise<Mutation[]>,
                                      client:CBioPortalAPIInternal = internalClient)
{
    if (!mutationData.result || mutationData.result.length === 0) {
        return undefined;
    }

    const queryKeywords: string[] = _.uniq(_.map(mutationData.result, (mutation: Mutation) => mutation.keyword));

    const cosmicData: CosmicMutation[] = await client.fetchCosmicCountsUsingPOST({
        keywords: _.filter(queryKeywords, (query) => {
            return query != null;
        })
    });

    return keywordToCosmic(cosmicData);
}

export function fetchMyCancerGenomeData(): IMyCancerGenomeData
{
    const data:IMyCancerGenome[] = require('../../../resources/mycancergenome.json');
    return geneToMyCancerGenome(data);
}

export async function fetchOncoKbData(mutationData:MobxPromise<Mutation[]>,
                                      sampleIdToTumorType:{[sampleId: string]: string})
{
    if (!mutationData.result || mutationData.result.length === 0) {
        return ONCOKB_DEFAULT;
    }

    const queryVariants = _.uniqBy(_.map(mutationData.result, (mutation: Mutation) => {
        return generateQueryVariant(mutation.gene.hugoGeneSymbol,
            sampleIdToTumorType[mutation.sampleId],
            mutation.proteinChange,
            mutation.mutationType,
            mutation.proteinPosStart,
            mutation.proteinPosEnd);
    }), "id");

    return queryOncoKbData(queryVariants, sampleIdToTumorType);
}

export async function fetchCnaOncoKbData(discreteCNAData:MobxPromise<DiscreteCopyNumberData[]>,
                                         sampleIdToTumorType:{[sampleId: string]: string},
                                         client: OncoKbAPI = oncokbClient)
{
    if (discreteCNAData.result && discreteCNAData.result.length > 0) {
        const queryVariants = _.uniqBy(_.map(discreteCNAData.result, (copyNumberData: DiscreteCopyNumberData) => {
            return generateQueryVariant(copyNumberData.gene.hugoGeneSymbol,
                sampleIdToTumorType[copyNumberData.sampleId],
                getAlterationString(copyNumberData.alteration));
        }), "id");
        return queryOncoKbData(queryVariants, sampleIdToTumorType, client);
    } else {
        return ONCOKB_DEFAULT;
    }
}

export async function queryOncoKbData(queryVariants: Query[],
                                      sampleIdToTumorType: {[sampleId: string]: string},
                                      client: OncoKbAPI = oncokbClient)
{
    const onkokbSearch = await client.searchPostUsingPOST(
        {body: generateEvidenceQuery(queryVariants)});

    const oncoKbData: IOncoKbData = {
        sampleToTumorMap: sampleIdToTumorType,
        indicatorMap: generateIdToIndicatorMap(onkokbSearch)
    };

    return oncoKbData;
}

export async function fetchDiscreteCNAData(discreteCopyNumberFilter:DiscreteCopyNumberFilter,
                                           geneticProfileIdDiscrete:MobxPromise<string>,
                                           client:CBioPortalAPI = defaultClient)
{
    if (geneticProfileIdDiscrete.isComplete && geneticProfileIdDiscrete.result) {
        return await client.fetchDiscreteCopyNumbersInGeneticProfileUsingPOST({
            projection: 'DETAILED',
            discreteCopyNumberFilter,
            geneticProfileId: geneticProfileIdDiscrete.result
        });
    } else {
        return [];
    }
}

export function findGeneticProfileIdDiscrete(geneticProfilesInStudy:MobxPromise<GeneticProfile[]>)
{
    if (!geneticProfilesInStudy.result) {
        return undefined;
    }

    const profile = geneticProfilesInStudy.result.find((profile: GeneticProfile) => {
        return profile.datatype === 'DISCRETE';
    });

    return profile ? profile.geneticProfileId : undefined;
}

export async function fetchHotspotsData(mutationData:MobxPromise<Mutation[]>,
                                        clientSingle:CancerHotspotsAPI = hotspotClient,
                                        client3d:CancerHotspotsAPI = hotspot3DClient)
{
    if (!mutationData.result) {
        return HOTSPOTS_DEFAULT;
    }

    const queryGenes:string[] = _.uniq(_.map(mutationData.result, function(mutation:Mutation) {
        if (mutation && mutation.gene) {
            return mutation.gene.hugoGeneSymbol;
        }
        else {
            return "";
        }
    }));

    const [dataSingle, data3d] = await Promise.all([
        clientSingle.fetchSingleResidueHotspotMutationsByGenePOST({
            hugoSymbols: queryGenes
        }),
        client3d.fetch3dHotspotMutationsByGenePOST({
            hugoSymbols: queryGenes
        })
    ]);

    return {
        single: dataSingle,
        clustered: data3d
    };
}

export function indexHotspotData(hotspotData:MobxPromise<ICancerHotspotData>): IHotspotData|undefined
{
    if (hotspotData.result) {
        return {
            single: indexHotspots(hotspotData.result.single),
            clustered: indexHotspots(hotspotData.result.clustered)
        }
    }
    else {
        return undefined;
    }
}

export function generateSampleIdToTumorTypeMap(clinicalDataForSamples: MobxPromise<ClinicalData[]>): {[sampleId: string]: string}
{
    const map: {[sampleId: string]: string} = {};

    if (clinicalDataForSamples.result) {
        _.each(clinicalDataForSamples.result, (clinicalData:ClinicalData) => {
            if (clinicalData.clinicalAttributeId === "CANCER_TYPE") {
                map[clinicalData.entityId] = clinicalData.value;
            }
        });
    }

    return map;
}

export function mergeMutations(mutationData:MobxPromise<Mutation[]>)
{
    let idToMutations: {[key: string]: Array<Mutation>} = {};

    if (mutationData.result)
    {
        let mutationId: string;

        let MutationId: (m: Mutation) => string = (m: Mutation) => {
            return [m.gene.chromosome, m.startPosition, m.endPosition, m.referenceAllele, m.variantAllele].join("_");
        };

        for (const mutation of mutationData.result) {
            mutationId = MutationId(mutation);
            idToMutations[mutationId] = idToMutations[mutationId] || [];
            idToMutations[mutationId].push(mutation);
        }
    }

    return Object.keys(idToMutations).map(id => idToMutations[id]);
}
