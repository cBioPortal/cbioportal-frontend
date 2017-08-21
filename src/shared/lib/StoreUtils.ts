import * as _ from 'lodash';
import request from "superagent";
import Response = request.Response;
import {
    default as CBioPortalAPI, GeneticProfile, Mutation, MutationFilter, DiscreteCopyNumberData,
    DiscreteCopyNumberFilter, ClinicalData, Sample, CancerStudy, CopyNumberCountIdentifier,
    ClinicalDataSingleStudyFilter, ClinicalDataMultiStudyFilter
} from "shared/api/generated/CBioPortalAPI";
import {getMyGeneUrl, getPfamGeneDataUrl, getUniprotIdUrl} from "shared/api/urls";
import defaultClient from "shared/api/cbioportalClientInstance";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import hotspot3DClient from 'shared/api/3DhotspotClientInstance';
import hotspotClient from 'shared/api/hotspotClientInstance';
import pdbAnnotationClient from "shared/api/pdbAnnotationClientInstance";
import {PdbUniprotAlignment, default as PdbAnnotationAPI} from "shared/api/generated/PdbAnnotationAPI";
import {
    CosmicMutation, default as CBioPortalAPIInternal,
    GisticToGene, Gistic, MutSig
} from "shared/api/generated/CBioPortalAPIInternal";
import oncokbClient from "shared/api/oncokbClientInstance";
import civicClient from "shared/api/civicClientInstance";
import {
    generateIdToIndicatorMap, generateQueryVariant, generateEvidenceQuery
} from "shared/lib/OncoKbUtils";
import {
    getCivicVariants, getCivicGenes
} from "shared/lib/CivicUtils";
import {Query, default as OncoKbAPI} from "shared/api/generated/OncoKbAPI";
import {getAlterationString} from "shared/lib/CopyNumberUtils";
import {MobxPromise} from "mobxpromise";
import {keywordToCosmic, indexHotspots, geneToMyCancerGenome} from "shared/lib/AnnotationUtils";
import {indexPdbAlignments} from "shared/lib/PdbUtils";
import {IOncoKbData} from "shared/model/OncoKB";
import {IGisticData} from "shared/model/Gistic";
import {IMutSigData} from "shared/model/MutSig";
import {IMyCancerGenomeData, IMyCancerGenome} from "shared/model/MyCancerGenome";
import {IHotspotData, ICancerHotspotData} from "shared/model/CancerHotspots";
import {ICivicGeneData, ICivicVariant, ICivicGene} from "shared/model/Civic.ts";
import CancerHotspotsAPI from "shared/api/generated/CancerHotspotsAPI";
import {GENETIC_PROFILE_MUTATIONS_SUFFIX, GENETIC_PROFILE_UNCALLED_MUTATIONS_SUFFIX} from "shared/constants";

export const ONCOKB_DEFAULT: IOncoKbData = {
    studyToSampleToTumorType : {},
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

export async function fetchPdbAlignmentData(uniprotId: string,
                                            client:PdbAnnotationAPI = pdbAnnotationClient)
{
    if (uniprotId) {
        return await client.postPdbAlignmentByUniprot({
            uniprotIds: [uniprotId]
        });
    } else {
        return [];
    }
}

export async function fetchSwissProtAccession(entrezGeneId: number)
{
    const myGeneData:Response = await request.get(getMyGeneUrl(entrezGeneId));
    return JSON.parse(myGeneData.text).uniprot["Swiss-Prot"];
}

export async function fetchUniprotId(swissProtAccession: string)
{
    const uniprotData:Response = await request.get(getUniprotIdUrl(swissProtAccession));
    return uniprotData.text.split("\n")[1];
}

export async function fetchPfamGeneData(swissProtAccession: string)
{
    const pfamData:Response = await request.get(getPfamGeneDataUrl(swissProtAccession));
    return JSON.parse(pfamData.text)[0];
}

export async function fetchClinicalData(clinicalDataMultiStudyFilter:ClinicalDataMultiStudyFilter,
                                        client:CBioPortalAPI = defaultClient)
{
    if (clinicalDataMultiStudyFilter)
    {
        return await client.fetchClinicalDataUsingPOST({
            clinicalDataType: 'SAMPLE',
            clinicalDataMultiStudyFilter: clinicalDataMultiStudyFilter,
            projection: 'DETAILED',
        });
    }
    else {
        return [];
    }
}

export async function fetchClinicalDataInStudy(studyId:string,
                                               clinicalDataSingleStudyFilter:ClinicalDataSingleStudyFilter,
                                               clinicalDataType: 'SAMPLE' | 'PATIENT',
                                               client:CBioPortalAPI = defaultClient)
{
    if (clinicalDataSingleStudyFilter) {
        return await client.fetchAllClinicalDataInStudyUsingPOST({
            studyId: studyId,
            clinicalDataType: clinicalDataType,
            clinicalDataSingleStudyFilter: clinicalDataSingleStudyFilter,
            projection: 'SUMMARY',
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

export async function fetchSamples(sampleIds:MobxPromise<string[]>|string[],
                                   studyId:string,
                                   client:CBioPortalAPI = defaultClient)
{
    let sampleIdsArray:string[];
    if (!(sampleIds instanceof Array)) {
        sampleIdsArray = sampleIds.result || [];
    } else {
        sampleIdsArray = sampleIds;
    }
    if (sampleIdsArray.length > 0 &&
        studyId)
    {
        const sampleIdentifiers = sampleIdsArray.map(
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

export function findSampleIdsWithCancerTypeClinicalData(clinicalDataForSamples:MobxPromise<ClinicalData[]>): {[sampleId: string]: boolean}
{
    const samplesWithClinicalData: {[sampleId: string]: boolean} = {};

    if (clinicalDataForSamples.result)
    {
        _.each(clinicalDataForSamples.result, (clinicalData: ClinicalData) => {
            if (clinicalData.clinicalAttributeId === "CANCER_TYPE_DETAILED" ||
                clinicalData.clinicalAttributeId === "CANCER_TYPE") {
                samplesWithClinicalData[clinicalData.entityId] = true;
            }
        });
    }

    return samplesWithClinicalData;
}

export function findSamplesWithoutCancerTypeClinicalData(samples:MobxPromise<Sample[]>,
                                                         clinicalDataForSamples:MobxPromise<ClinicalData[]>): Sample[]
{
    if (samples.result &&
        samples.result.length > 0 &&
        clinicalDataForSamples.result)
    {
        const samplesWithClinicalData = findSampleIdsWithCancerTypeClinicalData(clinicalDataForSamples);

        return _.filter(samples.result, (sample: Sample) => {
            return samplesWithClinicalData[sample.sampleId] !== true;
        });
    }
    else {
        return [];
    }
}

export async function fetchSamplesWithoutCancerTypeClinicalData(sampleIds:MobxPromise<string[]>,
                                                                studyId:string,
                                                                clinicalDataForSamples:MobxPromise<ClinicalData[]>,
                                                                client:CBioPortalAPI = defaultClient)
{
    let samples: Sample[] = [];

    if (sampleIds.result &&
        sampleIds.result.length > 0 &&
        clinicalDataForSamples.result)
    {
        const samplesWithClinicalData = findSampleIdsWithCancerTypeClinicalData(clinicalDataForSamples);

        const sampleIdsWithoutClinicalData = _.filter(sampleIds.result, (sampleId: string) => {
            return samplesWithClinicalData[sampleId] !== true;
        });

        const sampleIdentifierForSamplesWithoutClinicalData = sampleIdsWithoutClinicalData.map(
            sampleId => ({sampleId, studyId}));

        if (sampleIdentifierForSamplesWithoutClinicalData.length > 0) {
            samples = await client.fetchSamplesUsingPOST({
                sampleIdentifiers: sampleIdentifierForSamplesWithoutClinicalData,
                projection: "DETAILED"
            });
        }
    }

    return samples;
}

export async function fetchStudiesForSamplesWithoutCancerTypeClinicalData(samplesWithoutClinicalData: MobxPromise<Sample[]>,
                                                                          client:CBioPortalAPI = defaultClient)
{
    let studies: CancerStudy[] = [];

    if (samplesWithoutClinicalData.result) {
        const studyIdsForSamplesWithoutClinicalData = _.uniq(samplesWithoutClinicalData.result.map(
            (sample: Sample) => sample.studyId));

        const promises = studyIdsForSamplesWithoutClinicalData.map(studyId => client.getStudyUsingGET({studyId}));
        studies = await Promise.all(promises);
    }

    return studies;
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
                                          client:CBioPortalAPI = defaultClient)
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

export async function fetchOncoKbData(studyToSampleToTumorType:{[studyId:string]:{[sampleId: string]: string}},
                                      studyToMutationData:MobxPromise<{[studyId:string]:Mutation[]}>,
                                      studyToUncalledMutationData?:MobxPromise<{[studyId:string]:Mutation[]}>,
                                      client: OncoKbAPI = oncokbClient)
{
    const mutationData = studyToMutationData.result || {};
    const uncalledMutationData = (studyToUncalledMutationData && studyToUncalledMutationData.result) || {};
    let allQueryVariants:Query[] = [];
    _.each([mutationData, uncalledMutationData], (dataMap:{[studyId:string]:Mutation[]})=>{
        _.each(dataMap, (data:Mutation[], studyId:string)=>{
            _.each(data, (mutation:Mutation)=>{
                allQueryVariants.push(generateQueryVariant(mutation.gene.entrezGeneId,
                    cancerTypeForOncoKb(mutation.sampleId, studyId, studyToSampleToTumorType),
                    mutation.proteinChange,
                    mutation.mutationType,
                    mutation.proteinPosStart,
                    mutation.proteinPosEnd)
                );
            });
        });
    });

    if (allQueryVariants.length === 0) {
        return ONCOKB_DEFAULT;
    } else {
        const queryVariants = _.uniqBy(allQueryVariants, "id");
        return queryOncoKbData(queryVariants, studyToSampleToTumorType, client);
    }
}

export async function fetchCnaOncoKbData(studyToSampleToTumorType:{[studyId:string]:{[sampleId: string]: string}},
                                         studyToDiscreteCNAData:MobxPromise<{[studyId:string]:DiscreteCopyNumberData[]}>,
                                         client: OncoKbAPI = oncokbClient)
{
    const cnaData = studyToDiscreteCNAData.result || {};
    let allQueryVariants:Query[] = [];
    _.each(cnaData, (data:DiscreteCopyNumberData[], studyId:string)=>{
        _.each(data, (datum:DiscreteCopyNumberData)=>{
            allQueryVariants.push(generateQueryVariant(datum.gene.entrezGeneId,
                cancerTypeForOncoKb(datum.sampleId, studyId, studyToSampleToTumorType),
                getAlterationString(datum.alteration)));
        });
    });
    if (allQueryVariants.length === 0) {
        return ONCOKB_DEFAULT;
    } else {
        const queryVariants = _.uniqBy(allQueryVariants, "id");
        return queryOncoKbData(queryVariants, studyToSampleToTumorType, client);
    }
}

function cancerTypeForOncoKb(sampleId: string,
                             studyId:string,
                             studyToSampleToTumorType:{[studyId:string]:{[sampleId: string]: string}}): string
{
    // first priority is sampleIdToTumorType map (derived either from the clinical data or from the study cancer type).
    // if it is not valid, then we return an empty string and let OncoKB API figure out what to do
    return (studyToSampleToTumorType[studyId] && studyToSampleToTumorType[studyId][sampleId]) || "";
}

export async function queryOncoKbData(queryVariants: Query[],
                                      studyToSampleToTumorType:{[studyId:string]:{[sampleId: string]: string}},
                                      client: OncoKbAPI = oncokbClient)
{
    const onkokbSearch = await client.searchPostUsingPOST(
        {body: generateEvidenceQuery(queryVariants)});

    const oncoKbData: IOncoKbData = {
        studyToSampleToTumorType,
        indicatorMap: generateIdToIndicatorMap(onkokbSearch)
    };

    return oncoKbData;
}

export async function fetchCivicGenes(mutationData?:MobxPromise<Mutation[]>,
                                      uncalledMutationData?:MobxPromise<Mutation[]>)
{
    const mutationDataResult = concatMutationData(mutationData, uncalledMutationData);

    if (mutationDataResult.length === 0) {
        return {};
    }

    let queryHugoSymbols: Set<string> = new Set([]);

    mutationDataResult.forEach(function(mutation: Mutation) {
        queryHugoSymbols.add(mutation.gene.hugoGeneSymbol);
    });
    
    let querySymbols: Array<string> = Array.from(queryHugoSymbols);

    let civicGenes: ICivicGene = await getCivicGenes(querySymbols);

    return civicGenes;
}

export async function fetchCnaCivicGenes(discreteCNAData:MobxPromise<DiscreteCopyNumberData[]>)
{
    if (discreteCNAData.result && discreteCNAData.result.length > 0) {
        let queryHugoSymbols: Set<string> = new Set([]);
        
        discreteCNAData.result.forEach(function(cna: DiscreteCopyNumberData) {
            queryHugoSymbols.add(cna.gene.hugoGeneSymbol);
        });
        
        let querySymbols: Array<string> = Array.from(queryHugoSymbols);
    
        let civicGenes: ICivicGene = (await getCivicGenes(querySymbols));
    
        return civicGenes;
    } else {
        return {};
    }
}

export async function fetchCivicVariants(civicGenes: ICivicGene,
                                         mutationData?:MobxPromise<Mutation[]>,
                                         uncalledMutationData?:MobxPromise<Mutation[]>)
{
    let civicVariants: ICivicVariant = {};
    const mutationDataResult = concatMutationData(mutationData, uncalledMutationData);

    if (mutationDataResult.length > 0) {
        civicVariants = (await getCivicVariants(civicGenes, mutationDataResult));
    }
    else if (!_.isEmpty(civicGenes)) {
        civicVariants = (await getCivicVariants(civicGenes));
    }

    return civicVariants;
}

export async function fetchDiscreteCNAData(discreteCopyNumberFilter:DiscreteCopyNumberFilter,
                                           geneticProfileIdDiscrete:MobxPromise<string>|string|undefined,
                                           client:CBioPortalAPI = defaultClient)
{
    if (!geneticProfileIdDiscrete) {
        return [];
    }
    let geneticProfileId:string;
    if (geneticProfileIdDiscrete instanceof String) {
        geneticProfileId = geneticProfileIdDiscrete;
    } else {
        geneticProfileId = geneticProfileIdDiscrete.result || "";
    }
    if (geneticProfileId.length > 0) {
        return await client.fetchDiscreteCopyNumbersInGeneticProfileUsingPOST({
            projection: 'DETAILED',
            discreteCopyNumberFilter,
            geneticProfileId
        });
    } else {
        return [];
    }
}

export function findGeneticProfileIdDiscrete(geneticProfilesInStudy:MobxPromise<GeneticProfile[]>|GeneticProfile[])
{
    let geneticProfiles:GeneticProfile[]|undefined;
    if (geneticProfilesInStudy instanceof Array) {
        geneticProfiles = geneticProfilesInStudy;
    } else {
        geneticProfiles = geneticProfilesInStudy.result;
    }
    if (!geneticProfiles) {
        return undefined;
    }

    const profile = geneticProfiles.find((p: GeneticProfile) => {
        return p.datatype === 'DISCRETE';
    });

    return profile ? profile.geneticProfileId : undefined;
}

export function findMutationGeneticProfileIdSynch(geneticProfilesInStudy: GeneticProfile[],
                                             studyId:string,
                                             suffix:string = GENETIC_PROFILE_MUTATIONS_SUFFIX)
{
    const profile = geneticProfilesInStudy.find((p: GeneticProfile) => {
        return p.geneticProfileId === `${studyId}${suffix}`;
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

    return findMutationGeneticProfileIdSynch(geneticProfilesInStudy.result, studyId, suffix);
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

export function generateStudyToSampleToTumorTypeMap(studyToClinicalDataForSamples: MobxPromise<{[studyId:string]:ClinicalData[]}>,
                                                    studies?: MobxPromise<CancerStudy[]>,
                                                    studyToSamplesWithoutCancerTypeClinicalData?: MobxPromise<{[studyId:string]:Sample[]}>)
        : {[studyId:string]:{[sampleId: string]: string}}

{
    const map: {[studyId:string]:{[sampleId: string]: string}} = {};

    if (studyToClinicalDataForSamples.result)
    {
        _.each(studyToClinicalDataForSamples.result, (value:ClinicalData[], studyId:string)=>{
            map[studyId] = {};
        });

        // first priority is CANCER_TYPE_DETAILED in clinical data
        _.each(studyToClinicalDataForSamples.result, (clinicalData: ClinicalData[], studyId:string) => {
            const studyMap = map[studyId];
            _.each(clinicalData, (datum:ClinicalData)=>{
                if (datum.clinicalAttributeId === "CANCER_TYPE_DETAILED") {
                    studyMap[datum.entityId] = datum.value;
                }
            });
        });

        // second priority is CANCER_TYPE in clinical data
        _.each(studyToClinicalDataForSamples.result, (clinicalData: ClinicalData[], studyId:string) => {
            const studyMap = map[studyId];
            _.each(clinicalData, (datum:ClinicalData)=>{
                // update map with CANCER_TYPE value only if it is not already updated
                if (datum.clinicalAttributeId === "CANCER_TYPE" && studyMap[datum.entityId] === undefined) {
                    studyMap[datum.entityId] = datum.value;
                }
            });
        });
    }

    // last resort: fall back to the study cancer type
    if (studies && studies.result && studyToSamplesWithoutCancerTypeClinicalData && studyToSamplesWithoutCancerTypeClinicalData.result)
    {
        const studyIdToCancerType = makeStudyToCancerTypeMap(studies.result);

        _.each(studyToSamplesWithoutCancerTypeClinicalData.result, (samples:Sample[], studyId:string)=>{
            const studyMap = map[studyId];
            _.each(samples, (sample:Sample)=>{
                if (studyMap[sample.sampleId] === undefined) {
                    studyMap[sample.sampleId] = studyIdToCancerType[sample.studyId];
                }
            });
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
                               generateMutationId:MutationIdGenerator = generateMutationIdByGeneAndProteinChangeAndEvent)
{
    const idToMutations: {[key: string]: Mutation[]} = {};

    updateIdToMutationsMap(idToMutations, mutationData, generateMutationId, false);

    return Object.keys(idToMutations).map((id:string) => idToMutations[id]);
}

export function indexPdbAlignmentData(alignmentData: MobxPromise<PdbUniprotAlignment[]>)
{
    return indexPdbAlignments(alignmentData.result || []);
}

export function mergeMutationsIncludingUncalled(mutationData:MobxPromise<Mutation[]>,
                                                uncalledMutationData:MobxPromise<Mutation[]>,
                                                generateMutationId:MutationIdGenerator = generateMutationIdByGeneAndProteinChangeAndEvent)
{
    const idToMutations: {[key: string]: Mutation[]} = {};

    updateIdToMutationsMap(idToMutations, mutationData, generateMutationId, false);
    updateIdToMutationsMap(idToMutations, uncalledMutationData, generateMutationId, true);

    return Object.keys(idToMutations).map((id:string) => idToMutations[id]);
}

function updateIdToMutationsMap(idToMutations: {[key: string]: Mutation[]},
                                mutationData:MobxPromise<Mutation[]>,
                                generateMutationId:MutationIdGenerator = generateMutationIdByGeneAndProteinChangeAndEvent,
                                onlyUpdateExistingIds: boolean)
{
    if (mutationData.result) {
        for (const mutation of mutationData.result) {
            const mutationId = generateMutationId(mutation);
            if (!onlyUpdateExistingIds || (mutationId in idToMutations)) {
                idToMutations[mutationId] = idToMutations[mutationId] || [];
                idToMutations[mutationId].push(mutation);
            }
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

function mutationEventFields(m: Mutation) {
    return [m.gene.chromosome, m.startPosition, m.endPosition, m.referenceAllele, m.variantAllele];
}

export function generateMutationIdByEvent(m: Mutation): string {
    return mutationEventFields(m).join("_");
}

export function generateMutationIdByGeneAndProteinChangeAndEvent(m: Mutation): string {
    return [m.gene.hugoGeneSymbol, m.proteinChange, ...mutationEventFields(m)].join("_");
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

export function makeStudyToCancerTypeMap(studies:CancerStudy[]): {[studyId: string]: string} {
    return studies.reduce((map:{[studyId:string]:string}, next:CancerStudy) => {
        map[next.studyId] = next.cancerType.name;
        return map;
    }, {});
}

export function groupByEntityId(sampleIds: Array<string>, clinicalDataArray: Array<ClinicalData>) {
    return _.map(
        sampleIds,
        (k: string) => ({
            id: k,
            clinicalData: clinicalDataArray.filter((cd: ClinicalData) => cd.entityId === k)
        })
    );
}
