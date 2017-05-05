import * as _ from 'lodash';
import {
    GeneticProfile, Mutation, MutationFilter, default as CBioPortalAPI, DiscreteCopyNumberData,
    DiscreteCopyNumberFilter, ClinicalData, Sample
} from "shared/api/generated/CBioPortalAPI";
import defaultClient from "shared/api/cbioportalClientInstance";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import hotspot3DClient from 'shared/api/3DhotspotClientInstance';
import hotspotClient from 'shared/api/hotspotClientInstance';
import {
    CosmicMutation, default as CBioPortalAPIInternal,
    GisticToGene, Gistic, CopyNumberCountIdentifier, MutSig
} from "shared/api/generated/CBioPortalAPIInternal";
import oncokbClient from "shared/api/oncokbClientInstance";
import {
    generateIdToIndicatorMap, generateQueryVariant, generateEvidenceQuery
} from "shared/lib/OncoKbUtils";
import {Query, default as OncoKbAPI} from "shared/api/generated/OncoKbAPI";
import {getAlterationString} from "shared/lib/CopyNumberUtils";
import {MobxPromise} from "mobxpromise";
import {keywordToCosmic, indexHotspots, geneToMyCancerGenome} from "shared/lib/AnnotationUtils";
import {IOncoKbData} from "shared/model/OncoKB";
import {IGisticData} from "shared/model/Gistic";
import {IMutSigData} from "shared/model/MutSig";
import {IMyCancerGenomeData, IMyCancerGenome} from "shared/model/MyCancerGenome";
import {IHotspotData, ICancerHotspotData} from "shared/model/CancerHotspots";
import CancerHotspotsAPI from "shared/api/generated/CancerHotspotsAPI";
import {GENETIC_PROFILE_MUTATIONS_SUFFIX, GENETIC_PROFILE_UNCALLED_MUTATIONS_SUFFIX} from "shared/constants";

export const ONCOKB_DEFAULT: IOncoKbData = {
    sampleToTumorMap : {},
    indicatorMap : {}
};

export const HOTSPOTS_DEFAULT = {
    single: [],
    clustered: []
};

export type MutationIdGenerator = (mutation:Mutation) => string;

export interface IDataQueryFilter {
    sampleIds?: string[];
    sampleListId?: string;
}

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

export async function fetchClinicalData(studyId:string,
                                        sampleIds:string[],
                                        client:CBioPortalAPI = defaultClient)
{
    if (studyId && sampleIds.length > 0)
    {
        return await client.fetchClinicalDataUsingPOST({
            clinicalDataType: 'SAMPLE',
            identifiers: sampleIds.map((sampleId: string) => ({
                entityId: sampleId,
                studyId
            })),
            projection: 'DETAILED',
        });
    }
    else {
        return [];
    }
}

export async function fetchClinicalDataForPatient(studyId:string,
                                                  patientId:string,
                                                  client:CBioPortalAPI = defaultClient)
{
    if (studyId && patientId)
    {
        return await client.getAllClinicalDataOfPatientInStudyUsingGET({
            projection: 'DETAILED',
            studyId,
            patientId
        });
    }
    else {
        return [];
    }
}

export async function fetchCopyNumberSegments(studyId:string,
                                              sampleIds:string[],
                                              client:CBioPortalAPI = defaultClient)
{
    if (studyId && sampleIds.length > 0)
    {
        return await client.fetchCopyNumberSegmentsUsingPOST({
            sampleIdentifiers: sampleIds.map((sampleId: string) => ({
                sampleId,
                studyId
            })),
            projection: 'DETAILED',
        });
    }
    else {
        return [];
    }
}

export async function fetchSamplesForPatient(studyId:string,
                                             patientId?:string,
                                             sampleId?:string,
                                             client:CBioPortalAPI = defaultClient)
{
    if (studyId && patientId)
    {
        return await client.getAllSamplesOfPatientInStudyUsingGET({
            studyId,
            patientId
        });
    }
    else if (studyId && sampleId)
    {
        return await client.getSampleInStudyUsingGET({
            studyId,
            sampleId
        }).then((data:Sample) => [data]);
    }
    else {
        return [];
    }
}

export async function fetchSamples(sampleIds:MobxPromise<string[]>,
                                   studyId:string,
                                   client:CBioPortalAPI = defaultClient)
{
    if (sampleIds.result &&
        sampleIds.result.length > 0 &&
        studyId)
    {
        const sampleIdentifiers = sampleIds.result.map(
            (sampleId: string) => ({sampleId, studyId})
        );

        return await client.fetchSamplesUsingPOST({
            sampleIdentifiers,
            projection: "DETAILED"
        });
    }
    else {
        return [];
    }
}

export async function fetchCosmicData(mutationData:MobxPromise<Mutation[]>,
                                      uncalledMutationData?:MobxPromise<Mutation[]>,
                                      client:CBioPortalAPIInternal = internalClient)
{
    const mutationDataResult = concatMutationData(mutationData, uncalledMutationData);

    if (mutationDataResult.length === 0) {
        return undefined;
    }

    // we have to check and see if keyword property is present
    // it is NOT present sometimes
    const queryKeywords: string[] =
        _.chain(mutationDataResult)
            .filter((mutation: Mutation) => mutation.hasOwnProperty('keyword'))
            .map((mutation: Mutation) => mutation.keyword)
            .uniq().value();

    if (queryKeywords.length > 0)
    {
        const cosmicData: CosmicMutation[] = await client.fetchCosmicCountsUsingPOST({
            keywords: _.filter(queryKeywords, (query: string) => query != null)
        });

        return keywordToCosmic(cosmicData);
    }
    else {
        return undefined;
    }
}

export async function fetchMutSigData(studyId: string, client:CBioPortalAPIInternal = internalClient)
{
    const mutSigdata = await client.getSignificantlyMutatedGenesUsingGET({studyId});

    const byEntrezGeneId: IMutSigData = mutSigdata.reduce((map:IMutSigData, next:MutSig) => {
        map[next.entrezGeneId] = { qValue: next.qValue };
        return map;
    }, {});

    return byEntrezGeneId;
}

export async function fetchGisticData(studyId: string, client:CBioPortalAPIInternal = internalClient)
{
    if (studyId) {
        const gisticData = await client.getSignificantCopyNumberRegionsUsingGET({studyId});

        // generate a map of <entrezGeneId, IGisticSummary[]> pairs
        return gisticData.reduce((map: IGisticData, gistic: Gistic) => {
            gistic.genes.forEach((gene: GisticToGene) => {
                if (map[gene.entrezGeneId] === undefined) {
                    map[gene.entrezGeneId] = [];
                }

                // we may have more than one entry for a gene, so using array
                map[gene.entrezGeneId].push({
                    amp: gistic.amp,
                    qValue: gistic.qValue,
                    peakGeneCount: gistic.genes.length
                });
            });

            return map;
        }, {});
    }
    else {
        return {};
    }
}

export async function fetchCopyNumberData(discreteCNAData:MobxPromise<DiscreteCopyNumberData[]>,
                                          geneticProfileIdDiscrete:MobxPromise<string>,
                                          client:CBioPortalAPIInternal = internalClient)
{
    const copyNumberCountIdentifiers: CopyNumberCountIdentifier[] = discreteCNAData.result ?
        discreteCNAData.result.map((cnData: DiscreteCopyNumberData) => {
            return {
                alteration: cnData.alteration,
                entrezGeneId: cnData.entrezGeneId
            };
        }) : [];

    if (geneticProfileIdDiscrete.result && copyNumberCountIdentifiers.length > 0) {
        return await client.fetchCopyNumberCountsUsingPOST({
            geneticProfileId: geneticProfileIdDiscrete.result,
            copyNumberCountIdentifiers
        });
    } else {
        return [];
    }
}

export function fetchMyCancerGenomeData(): IMyCancerGenomeData
{
    const data:IMyCancerGenome[] = require('../../../resources/mycancergenome.json');
    return geneToMyCancerGenome(data);
}

export async function fetchOncoKbData(sampleIdToTumorType:{[sampleId: string]: string},
                                      mutationData:MobxPromise<Mutation[]>,
                                      uncalledMutationData?:MobxPromise<Mutation[]>,
                                      client: OncoKbAPI = oncokbClient)
{
    const mutationDataResult = concatMutationData(mutationData, uncalledMutationData);

    if (mutationDataResult.length === 0 || _.isEmpty(sampleIdToTumorType)) {
        return ONCOKB_DEFAULT;
    }

    const queryVariants = _.uniqBy(_.map(mutationDataResult, (mutation: Mutation) => {
        return generateQueryVariant(mutation.gene.hugoGeneSymbol,
            sampleIdToTumorType[mutation.sampleId],
            mutation.proteinChange,
            mutation.mutationType,
            mutation.proteinPosStart,
            mutation.proteinPosEnd);
    }), "id");

    return queryOncoKbData(queryVariants, sampleIdToTumorType, client);
}

export async function fetchCnaOncoKbData(sampleIdToTumorType:{[sampleId: string]: string},
                                         discreteCNAData:MobxPromise<DiscreteCopyNumberData[]>,
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

    const profile = geneticProfilesInStudy.result.find((p: GeneticProfile) => {
        return p.datatype === 'DISCRETE';
    });

    return profile ? profile.geneticProfileId : undefined;
}

export function findMutationGeneticProfileId(geneticProfilesInStudy: MobxPromise<GeneticProfile[]>,
                                             studyId:string,
                                             suffix:string = GENETIC_PROFILE_MUTATIONS_SUFFIX)
{
    if (!geneticProfilesInStudy.result) {
        return undefined;
    }

    const profile = geneticProfilesInStudy.result.find((p: GeneticProfile) => {
        return p.geneticProfileId === `${studyId}${suffix}`;
    });

    return profile ? profile.geneticProfileId : undefined;
}

export function findUncalledMutationGeneticProfileId(geneticProfilesInStudy: MobxPromise<GeneticProfile[]>,
                                                     studyId:string,
                                                     suffix:string = GENETIC_PROFILE_UNCALLED_MUTATIONS_SUFFIX)
{
    return findMutationGeneticProfileId(geneticProfilesInStudy, studyId, suffix);
}

export function findMrnaRankGeneticProfileId(geneticProfilesInStudy: MobxPromise<GeneticProfile[]>)
{
    if (!geneticProfilesInStudy.result) {
        return null;
    }

    const regex1 = /^.+rna_seq.*_zscores$/; // We prefer profiles that look like this
    const regex2 = /^.*_zscores$/; // If none of the above are available, we'll look for ones like this
    const preferredProfile: (GeneticProfile | undefined) = geneticProfilesInStudy.result.find(
        (gp: GeneticProfile) => regex1.test(gp.geneticProfileId.toLowerCase()));

    if (preferredProfile) {
        return preferredProfile.geneticProfileId;
    } else {
        const fallbackProfile: (GeneticProfile | undefined) = geneticProfilesInStudy.result.find(
            (gp: GeneticProfile) => regex2.test(gp.geneticProfileId.toLowerCase()));

        return fallbackProfile ? fallbackProfile.geneticProfileId : null;
    }
}

export async function fetchHotspotsData(mutationData:MobxPromise<Mutation[]>,
                                        uncalledMutationData?:MobxPromise<Mutation[]>,
                                        clientSingle:CancerHotspotsAPI = hotspotClient,
                                        client3d:CancerHotspotsAPI = hotspot3DClient)
{
    const mutationDataResult = concatMutationData(mutationData, uncalledMutationData);

    if (mutationDataResult.length === 0) {
        return HOTSPOTS_DEFAULT;
    }

    const queryGenes:string[] = _.uniq(_.map(mutationDataResult, function(mutation:Mutation) {
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
        };
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

export function mergeDiscreteCNAData(discreteCNAData:MobxPromise<DiscreteCopyNumberData[]>)
{
    const idToCNAs: {[key: string]: DiscreteCopyNumberData[]} = {};

    if (discreteCNAData.result) {
        for (const d of discreteCNAData.result) {
            const cnaId: string = `${d.entrezGeneId}_${d.alteration}`;
            idToCNAs[cnaId] = idToCNAs[cnaId] || [];
            idToCNAs[cnaId].push(d);
        }
    }

    return Object.keys(idToCNAs).map((id:string) => idToCNAs[id]);
}

export function mergeMutations(mutationData:MobxPromise<Mutation[]>,
                               generateMutationId:MutationIdGenerator = generateMutationIdByEvent)
{
    const idToMutations: {[key: string]: Mutation[]} = {};

    updateIdToMutationsMap(idToMutations, mutationData, generateMutationId);

    return Object.keys(idToMutations).map((id:string) => idToMutations[id]);
}

export function mergeMutationsIncludingUncalled(mutationData:MobxPromise<Mutation[]>,
                                                uncalledMutationData:MobxPromise<Mutation[]>,
                                                generateMutationId:MutationIdGenerator = generateMutationIdByEvent)
{
    const idToMutations: {[key: string]: Mutation[]} = {};

    updateIdToMutationsMap(idToMutations, mutationData, generateMutationId);
    updateIdToMutationsMap(idToMutations, uncalledMutationData, generateMutationId);

    return Object.keys(idToMutations).map((id:string) => idToMutations[id]);
}

function updateIdToMutationsMap(idToMutations: {[key: string]: Mutation[]},
                                mutationData:MobxPromise<Mutation[]>,
                                generateMutationId:MutationIdGenerator = generateMutationIdByEvent)
{
    if (mutationData.result) {
        for (const mutation of mutationData.result) {
            const mutationId = generateMutationId(mutation);
            idToMutations[mutationId] = idToMutations[mutationId] || [];
            idToMutations[mutationId].push(mutation);
        }
    }
}

export function concatMutationData(mutationData?:MobxPromise<Mutation[]>,
                                   uncalledMutationData?:MobxPromise<Mutation[]>): Mutation[]
{
    const mutationDataResult:Mutation[] = mutationData && mutationData.result ?
        mutationData.result : [];

    const uncalledMutationDataResult:Mutation[] = uncalledMutationData && uncalledMutationData.result ?
        uncalledMutationData.result : [];

    return mutationDataResult.concat(uncalledMutationDataResult);
}

export function generateMutationIdByEvent(m: Mutation): string {
    return [m.gene.chromosome, m.startPosition, m.endPosition, m.referenceAllele, m.variantAllele].join("_");
}

export function generateDataQueryFilter(sampleListId: string|null, sampleIds?: string[]): IDataQueryFilter
{
    let filter: IDataQueryFilter = {};

    if (sampleListId) {
        filter = {
            sampleListId
        };
    }
    else if (sampleIds) {
        filter = {
            sampleIds
        };
    }

    return filter;
}
