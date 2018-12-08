import * as _ from 'lodash';
import request from "superagent";
import Response = request.Response;
import {
    default as CBioPortalAPI, MolecularProfile, Mutation, MutationFilter, DiscreteCopyNumberData,
    DiscreteCopyNumberFilter, ClinicalData, Sample, CancerStudy, CopyNumberCountIdentifier, CopyNumberSeg,
    ClinicalDataSingleStudyFilter, ClinicalDataMultiStudyFilter, NumericGeneMolecularData, SampleFilter, Gene
} from "shared/api/generated/CBioPortalAPI";
import { EnsemblFilter, EnsemblTranscript } from "shared/api/generated/GenomeNexusAPI";
import {getMyGeneUrl, getUniprotIdUrl} from "shared/api/urls";
import defaultClient from "shared/api/cbioportalClientInstance";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import g2sClient from "shared/api/g2sClientInstance";
import {Alignment, default as Genome2StructureAPI} from "shared/api/generated/Genome2StructureAPI";
import {
    CosmicMutation, default as CBioPortalAPIInternal,
    GisticToGene, Gistic, MutSig
} from "shared/api/generated/CBioPortalAPIInternal";
import oncokbClient from "shared/api/oncokbClientInstance";
import civicClient from "shared/api/civicClientInstance";
import genomeNexusClient from "shared/api/genomeNexusClientInstance";
import {
    generateIdToIndicatorMap, generateQueryVariant, generateEvidenceQuery
} from "shared/lib/OncoKbUtils";
import {
    getCivicVariants, getCivicGenes
} from "shared/lib/CivicUtils";
import {Query, default as OncoKbAPI, Gene as OncoKbGene} from "shared/api/generated/OncoKbAPI";
import {getAlterationString} from "shared/lib/CopyNumberUtils";
import {MobxPromise} from "mobxpromise";
import {keywordToCosmic, geneToMyCancerGenome} from "shared/lib/AnnotationUtils";
import {indexPdbAlignments} from "shared/lib/PdbUtils";
import {IOncoKbData} from "shared/model/OncoKB";
import {IGisticData} from "shared/model/Gistic";
import {IMutSigData} from "shared/model/MutSig";
import {IMyCancerGenomeData, IMyCancerGenome} from "shared/model/MyCancerGenome";
import {IMutationalSignature, IMutationalSignatureMeta} from "shared/model/MutationalSignature";
import {ICivicGeneData, ICivicVariant, ICivicGene} from "shared/model/Civic.ts";
import {MOLECULAR_PROFILE_MUTATIONS_SUFFIX, MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX} from "shared/constants";
import GenomeNexusAPI from "shared/api/generated/GenomeNexusAPI";
import {AlterationTypeConstants} from "../../pages/resultsView/ResultsViewPageStore";
import {stringListToIndexSet} from "./StringUtils";

export const ONCOKB_DEFAULT: IOncoKbData = {
    uniqueSampleKeyToTumorType : {},
    indicatorMap : {}
};

export type MutationIdGenerator = (mutation:Mutation) => string;

export interface IDataQueryFilter {
    sampleIds?: string[];
    sampleListId?: string;
}

export async function fetchMutationData(mutationFilter:MutationFilter,
                                        molecularProfileId?:string,
                                        client:CBioPortalAPI = defaultClient)
{
    if (molecularProfileId) {
        return await client.fetchMutationsInMolecularProfileUsingPOST({
            molecularProfileId,
            mutationFilter,
            projection: "DETAILED"
        });
    } else {
        return [];
    }
}


export async function fetchGenes(hugoGeneSymbols?: string[],
                                 client: CBioPortalAPI = defaultClient)
{
    if (hugoGeneSymbols && hugoGeneSymbols.length) {
        const order = stringListToIndexSet(hugoGeneSymbols);
        return _.sortBy(await client.fetchGenesUsingPOST({
            geneIdType: "HUGO_GENE_SYMBOL",
            geneIds: hugoGeneSymbols.slice(),
            projection: "SUMMARY"
        }), (gene: Gene) => order[gene.hugoGeneSymbol]);
    } else {
        return [];
    }
}

export async function fetchPdbAlignmentData(ensemblId: string,
                                            client:Genome2StructureAPI = g2sClient)
{
    if (ensemblId) {
        return await client.getAlignmentUsingGET({
            idType: "ensembl",
            id: ensemblId
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

export async function fetchPfamDomainData(pfamAccessions: string[],
                                          client:GenomeNexusAPI = genomeNexusClient)
{
    return await client.fetchPfamDomainsByPfamAccessionPOST({
        pfamAccessions: pfamAccessions
    });
}

/*
 * Gets the canonical transcript. If there is none pick the transcript with max
 * length.
 */
export async function fetchCanonicalTranscriptWithFallback(hugoSymbol:string,
                                                           isoformOverrideSource: string,
                                                           allTranscripts: EnsemblTranscript[] | undefined,
                                                           client:GenomeNexusAPI =  genomeNexusClient)
{
    return fetchCanonicalTranscript(hugoSymbol, isoformOverrideSource, client).catch(() => {
        // get transcript with max protein length in given list of all transcripts
        const transcript = _.maxBy(allTranscripts, (t:EnsemblTranscript) => t.proteinLength);
        return transcript? transcript : undefined;
    });
}

export async function fetchCanonicalTranscript(hugoSymbol: string,
                                               isoformOverrideSource: string,
                                               client:GenomeNexusAPI = genomeNexusClient)
{
    return await client.fetchCanonicalEnsemblTranscriptByHugoSymbolGET({
        hugoSymbol, isoformOverrideSource
    });
}

export async function fetchCanonicalTranscripts(hugoSymbols: string[],
                                                isoformOverrideSource: string,
                                                client:GenomeNexusAPI = genomeNexusClient)
{
    return await client.fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOST({
        hugoSymbols, isoformOverrideSource
    });
}

export async function getCanonicalTranscriptsByHugoSymbol(hugoSymbols: string[],
                                                          isoformOverrideSource: string,
                                                          client:GenomeNexusAPI = genomeNexusClient)
{
    const transcripts = await fetchCanonicalTranscripts(hugoSymbols, isoformOverrideSource, client);
    return transcripts? _.zipObject(hugoSymbols, transcripts) : undefined;
}

export async function fetchCanonicalEnsemblGeneIds(hugoSymbols: string[],
                                                   isoformOverrideSource: string,
                                                   client:GenomeNexusAPI = genomeNexusClient)
{
    // TODO: this endpoint should accept isoformOverrideSource
    return await client.fetchCanonicalEnsemblGeneIdByHugoSymbolsPOST({
        hugoSymbols});
}

export async function fetchEnsemblTranscriptsByEnsemblFilter(ensemblFilter: Partial<EnsemblFilter>,
                                                             client:GenomeNexusAPI = genomeNexusClient)
{

    return await client.fetchEnsemblTranscriptsByEnsemblFilterPOST({ensemblFilter: Object.assign(
        // set default to empty array
        {
            'geneIds': [],
            'hugoSymbols': [],
            'proteinIds': [],
            'transcriptIds': [],
        }, ensemblFilter)});
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

export function fetchCopyNumberSegmentsForSamples(samples: Sample[],
                                                  chromosome?: string,
                                                  client:CBioPortalAPI = defaultClient): Promise<CopyNumberSeg[]>
{
    if (samples.length > 0)
    {
        return client.fetchCopyNumberSegmentsUsingPOST({
            sampleIdentifiers: samples.map(sample => ({
                sampleId: sample.sampleId,
                studyId: sample.studyId
            })),
            chromosome,
            projection: 'DETAILED',
        });
    }
    else {
        return Promise.resolve([]);
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
            patientId,
            projection: 'DETAILED'
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
            sampleFilter: {
                sampleIdentifiers
            } as SampleFilter
        });
    }
    else {
        return [];
    }
}

export async function fetchGermlineConsentedSamples(studyIds: MobxPromise<string[]>,
                                                    studiesWithGermlineConsentedSamples?: string[],
                                                    client: CBioPortalAPI = defaultClient)
{
    // no valid config param => feature disabled
    if (!studiesWithGermlineConsentedSamples || !studyIds.result) {
        return [];
    }

    // query API only for the studies provided with the config param

    const studies: string[] = studyIds.result.filter(
        studyId => _.find(studiesWithGermlineConsentedSamples, (element) => element === studyId));

    if (studies.length > 0)
    {
        const ids: string[][] = await Promise.all(studies.map(studyId => {
            return client.getAllSampleIdsInSampleListUsingGET({
                sampleListId: getGermlineSampleListId(studyId)
            });
        }));

        return _.flatten(ids.map((sampleIds: string[], index: number) => {
            const studyId = studies[index];
            return sampleIds.map(sampleId => ({sampleId, studyId}));
        }));
    }
    else {
        return [];
    }
}

export function getGermlineSampleListId(studyId:string): string
{
    return `${studyId}_germline`;
}

export function findSampleIdsWithCancerTypeClinicalData(clinicalDataForSamples:MobxPromise<ClinicalData[]>): {[uniqueSampleKey: string]: boolean}
{
    const samplesWithClinicalData: {[sampleId: string]: boolean} = {};

    if (clinicalDataForSamples.result)
    {
        _.each(clinicalDataForSamples.result, (clinicalData: ClinicalData) => {
            if (clinicalData.clinicalAttributeId === "CANCER_TYPE_DETAILED" ||
                clinicalData.clinicalAttributeId === "CANCER_TYPE") {
                samplesWithClinicalData[clinicalData.uniqueSampleKey] = true;
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
            return samplesWithClinicalData[sample.uniqueSampleKey] !== true;
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
                sampleFilter: {
                    sampleIdentifiers: sampleIdentifierForSamplesWithoutClinicalData
                } as SampleFilter
            });
        }
    }

    return samples;
}

export async function fetchStudiesForSamplesWithoutCancerTypeClinicalData(samplesWithoutClinicalData: MobxPromise<Sample[]>,
                                                                          client:CBioPortalAPI = defaultClient)
{
    let studies: CancerStudy[] = [];

    if (samplesWithoutClinicalData.result && samplesWithoutClinicalData.result.length > 0) {
        const studyIdsForSamplesWithoutClinicalData = _.uniq(samplesWithoutClinicalData.result.map(
            (sample: Sample) => sample.studyId));

        studies = await client.fetchStudiesUsingPOST({studyIds:studyIdsForSamplesWithoutClinicalData, projection:"DETAILED"});
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
                                          molecularProfileIdDiscrete:MobxPromise<string>,
                                          client:CBioPortalAPI = defaultClient)
{
    const copyNumberCountIdentifiers: CopyNumberCountIdentifier[] = discreteCNAData.result ?
        discreteCNAData.result.map((cnData: DiscreteCopyNumberData) => {
            return {
                alteration: cnData.alteration,
                entrezGeneId: cnData.entrezGeneId
            };
        }) : [];

    if (molecularProfileIdDiscrete.result && copyNumberCountIdentifiers.length > 0) {
        return await client.fetchCopyNumberCountsUsingPOST({
            molecularProfileId: molecularProfileIdDiscrete.result,
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

export function fetchMutationalSignatureData(): IMutationalSignature[]
{
    return require('../../../resources/samplemutsigdata.json');
}

export function fetchMutationalSignatureMetaData(): IMutationalSignatureMeta[]{
    return require('../../../resources/mutsigmetadata.json');
}

export async function fetchOncoKbAnnotatedGenes(client: OncoKbAPI = oncokbClient): Promise<{[entrezGeneId:number]:boolean}>
{
    return _.reduce(await client.genesGetUsingGET({}), (map:{[entrezGeneId:number]:boolean}, next:OncoKbGene)=>{
            map[next.entrezGeneId] = true;
            return map;
        }, {});
}

export async function fetchOncoKbAnnotatedGenesSuppressErrors(client: OncoKbAPI = oncokbClient): Promise<{[entrezGeneId:number]:boolean}|Error>
{
    // we want to catch the error and fail silently with an empty result set,
    // because we don't want other MobXPromises depending on this data to fail in case of an error
    try {
        return await fetchOncoKbAnnotatedGenes(client);
    } catch (e) {
        return new Error();
    }
}

export async function fetchOncoKbData(uniqueSampleKeyToTumorType:{[uniqueSampleKey: string]: string},
                                      annotatedGenes:{[entrezGeneId:number]:boolean}|Error,
                                      mutationData:MobxPromise<Mutation[]>,
                                      evidenceTypes?: string,
                                      uncalledMutationData?:MobxPromise<Mutation[]>,
                                      client: OncoKbAPI = oncokbClient)
{
    const mutationDataResult = concatMutationData(mutationData, uncalledMutationData);

    if (annotatedGenes instanceof Error) {
        return new Error();
    }
    else if (mutationDataResult.length === 0) {
        return ONCOKB_DEFAULT;
    }

    const mutationsToQuery = _.filter(mutationDataResult, m=>!!annotatedGenes[m.entrezGeneId]);
    const queryVariants = _.uniqBy(_.map(mutationsToQuery, (mutation: Mutation) => {
        return generateQueryVariant(mutation.gene.entrezGeneId,
            cancerTypeForOncoKb(mutation.uniqueSampleKey, uniqueSampleKeyToTumorType),
            mutation.proteinChange,
            mutation.mutationType,
            mutation.proteinPosStart,
            mutation.proteinPosEnd);
    }), "id");
    return queryOncoKbData(queryVariants, uniqueSampleKeyToTumorType, client, evidenceTypes);
}

export async function fetchCnaOncoKbData(uniqueSampleKeyToTumorType:{[uniqueSampleKey: string]: string},
                                         annotatedGenes:{[entrezGeneId:number]:boolean},
                                         discreteCNAData:MobxPromise<DiscreteCopyNumberData[]>,
                                         client: OncoKbAPI = oncokbClient)
{
    if (!discreteCNAData.result || discreteCNAData.result.length === 0) {
        return ONCOKB_DEFAULT;
    }
    else
    {
        const alterationsToQuery = _.filter(discreteCNAData.result, d=>!!annotatedGenes[d.gene.entrezGeneId]);
        const queryVariants = _.uniqBy(_.map(alterationsToQuery, (copyNumberData: DiscreteCopyNumberData) => {
            return generateQueryVariant(copyNumberData.gene.entrezGeneId,
                cancerTypeForOncoKb(copyNumberData.uniqueSampleKey, uniqueSampleKeyToTumorType),
                getAlterationString(copyNumberData.alteration));
        }), "id");
        return queryOncoKbData(queryVariants, uniqueSampleKeyToTumorType, client, undefined);
    }
}

export async function fetchCnaOncoKbDataWithNumericGeneMolecularData(uniqueSampleKeyToTumorType:{[uniqueSampleKey: string]: string},
                                         annotatedGenes:{[entrezGeneId:number]:boolean},
                                         geneMolecularData:MobxPromise<NumericGeneMolecularData[]>,
                                          molecularProfileIdToMolecularProfile:{[molecularProfileId:string]:MolecularProfile},
                                         evidenceTypes?: string,
                                         client: OncoKbAPI = oncokbClient)
{
    if (!geneMolecularData.result || geneMolecularData.result.length === 0) {
        return ONCOKB_DEFAULT;
    }
    else
    {
        const alterationsToQuery = _.filter(geneMolecularData.result, molecularDatum=>{
            return molecularProfileIdToMolecularProfile[molecularDatum.molecularProfileId].molecularAlterationType === AlterationTypeConstants.COPY_NUMBER_ALTERATION &&
                !!annotatedGenes[molecularDatum.entrezGeneId];
        });
        const queryVariants = _.uniqBy(_.map(alterationsToQuery, (datum: NumericGeneMolecularData) => {
            return generateQueryVariant(datum.entrezGeneId,
                cancerTypeForOncoKb(datum.uniqueSampleKey, uniqueSampleKeyToTumorType),
                getAlterationString(datum.value));
        }), (query:Query)=>query.id);
        return queryOncoKbData(queryVariants, uniqueSampleKeyToTumorType, client, evidenceTypes);
    }
}

export function cancerTypeForOncoKb(uniqueSampleKey: string,
                             uniqueSampleKeyToTumorType:{[uniqueSampleKey: string]: string}): string | null
{
    // first priority is sampleIdToTumorType map (derived either from the clinical data or from the study cancer type).
    // if it is not valid, then we return an empty string and let OncoKB API figure out what to do
    return uniqueSampleKeyToTumorType[uniqueSampleKey] || null;
}

export async function queryOncoKbData(queryVariants: Query[],
                                      uniqueSampleKeyToTumorType: {[sampleId: string]: string},
                                      client: OncoKbAPI = oncokbClient,
                                      evidenceTypes?:string)
{
    const oncokbSearch = await client.searchPostUsingPOST(
        {body: generateEvidenceQuery(queryVariants, evidenceTypes)});

    const oncoKbData: IOncoKbData = {
        uniqueSampleKeyToTumorType: uniqueSampleKeyToTumorType,
        indicatorMap: generateIdToIndicatorMap(oncokbSearch)
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

    let entrezGeneSymbols: Set<number> = new Set([]);

    mutationDataResult.forEach(function(mutation: Mutation) {
        entrezGeneSymbols.add(mutation.gene.entrezGeneId);
    });

    let civicGenes: ICivicGene = await getCivicGenes(Array.from(entrezGeneSymbols));

    return civicGenes;
}

export async function fetchCnaCivicGenes(discreteCNAData:MobxPromise<DiscreteCopyNumberData[]>)
{
    if (discreteCNAData.result && discreteCNAData.result.length > 0) {
        let entrezGeneSymbols: Set<number> = new Set([]);
        
        discreteCNAData.result.forEach(function(cna: DiscreteCopyNumberData) {
            entrezGeneSymbols.add(cna.gene.entrezGeneId);
        });
        
        let querySymbols: Array<number> = Array.from(entrezGeneSymbols);
    
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
                                           molecularProfileIdDiscrete:MobxPromise<string>,
                                           client:CBioPortalAPI = defaultClient)
{
    if (molecularProfileIdDiscrete.isComplete && molecularProfileIdDiscrete.result) {
        return await client.fetchDiscreteCopyNumbersInMolecularProfileUsingPOST({
            projection: 'DETAILED',
            discreteCopyNumberFilter,
            molecularProfileId: molecularProfileIdDiscrete.result
        });
    } else {
        return [];
    }
}

export function findMolecularProfileIdDiscrete(molecularProfilesInStudy:MobxPromise<MolecularProfile[]>)
{
    if (!molecularProfilesInStudy.result) {
        return undefined;
    }

    const profile = molecularProfilesInStudy.result.find((p: MolecularProfile) => {
        return p.datatype === 'DISCRETE';
    });

    return profile ? profile.molecularProfileId : undefined;
}

export function isMutationProfile(profile:MolecularProfile):boolean {
    return profile.molecularAlterationType === "MUTATION_EXTENDED";
}

export function findMutationMolecularProfileId(molecularProfilesInStudy: MobxPromise<MolecularProfile[]>,
                                             studyId:string,
                                             suffix:string = MOLECULAR_PROFILE_MUTATIONS_SUFFIX)
{
    if (!molecularProfilesInStudy.result) {
        return undefined;
    }

    const profile = molecularProfilesInStudy.result.find((p: MolecularProfile) => {
        return p.molecularProfileId === `${studyId}${suffix}`;
    });

    return profile ? profile.molecularProfileId : undefined;
}

export function findUncalledMutationMolecularProfileId(molecularProfilesInStudy: MobxPromise<MolecularProfile[]>,
                                                     studyId:string,
                                                     suffix:string = MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX)
{
    return findMutationMolecularProfileId(molecularProfilesInStudy, studyId, suffix);
}

export function findMrnaRankMolecularProfileId(molecularProfilesInStudy: MobxPromise<MolecularProfile[]>)
{
    if (!molecularProfilesInStudy.result) {
        return null;
    }

    const regex1 = /^.+rna_seq.*_zscores$/; // We prefer profiles that look like this
    const regex2 = /^.*_zscores$/; // If none of the above are available, we'll look for ones like this
    const preferredProfile: (MolecularProfile | undefined) = molecularProfilesInStudy.result.find(
        (gp: MolecularProfile) => regex1.test(gp.molecularProfileId.toLowerCase()));

    if (preferredProfile) {
        return preferredProfile.molecularProfileId;
    } else {
        const fallbackProfile: (MolecularProfile | undefined) = molecularProfilesInStudy.result.find(
            (gp: MolecularProfile) => regex2.test(gp.molecularProfileId.toLowerCase()));

        return fallbackProfile ? fallbackProfile.molecularProfileId : null;
    }
}



export function generateUniqueSampleKeyToTumorTypeMap(clinicalDataForSamples: MobxPromise<ClinicalData[]>,
                                               studies?: MobxPromise<CancerStudy[]>,
                                               samples?: MobxPromise<Sample[]>): {[sampleId: string]: string}

{
    const map: {[sampleId: string]: string} = {};

    if (clinicalDataForSamples.result)
    {
        // first priority is CANCER_TYPE_DETAILED in clinical data
        _.each(clinicalDataForSamples.result, (clinicalData: ClinicalData) => {
            if (clinicalData.clinicalAttributeId === "CANCER_TYPE_DETAILED") {
                map[clinicalData.uniqueSampleKey] = clinicalData.value;
            }
        });

        // // second priority is CANCER_TYPE in clinical data
        // _.each(clinicalDataForSamples.result, (clinicalData: ClinicalData) => {
        //     // update map with CANCER_TYPE value only if it is not already updated
        //     if (clinicalData.clinicalAttributeId === "CANCER_TYPE" && map[clinicalData.uniqueSampleKey] === undefined) {
        //         map[clinicalData.uniqueSampleKey] = clinicalData.value;
        //     }
        // });
    }

    // last resort: fall back to the study cancer type
    if (studies && studies.result && samples && samples.result)
    {
        const studyIdToCancerType = makeStudyToCancerTypeMap(studies.result);

        _.each(samples.result, (sample: Sample) => {
            if (map[sample.uniqueSampleKey] === undefined) {
                map[sample.uniqueSampleKey] = studyIdToCancerType[sample.studyId];
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
                               generateMutationId:MutationIdGenerator = generateMutationIdByGeneAndProteinChangeAndEvent)
{
    const idToMutations: {[key: string]: Mutation[]} = {};

    updateIdToMutationsMap(idToMutations, mutationData, generateMutationId, false);

    return Object.keys(idToMutations).map((id:string) => idToMutations[id]);
}

export function indexPdbAlignmentData(alignmentData: MobxPromise<Alignment[]>)
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

export function groupBySampleId(sampleIds: Array<string>, clinicalDataArray: Array<ClinicalData>) {
    return _.map(
        sampleIds,
        (k: string) => ({
            id: k,
            clinicalData: clinicalDataArray.filter((cd: ClinicalData) => cd.sampleId === k)
        })
    );
}

export function groupBy<T>(data:T[], keyFn:(d:T)=>string, defaultKeys:string[]=[]):{[key:string]:T[]} {
    const ret:{[key:string]:T[]} = {};
    for (const key of defaultKeys) {
        ret[key] = [];
    }
    for (const datum of data) {
        const key = keyFn(datum);
        ret[key] = ret[key] || [];
        ret[key].push(datum);
    }
    return ret;
}

export async function getHierarchyData(
        geneticProfileId: string, percentile: number, scoreThreshold: number, pvalueThreshold: number,
        sampleListId: string|undefined,  client:CBioPortalAPIInternal = internalClient) {
    return await client.fetchGenesetHierarchyInfoUsingPOST({geneticProfileId, percentile, scoreThreshold,
        pvalueThreshold, sampleListId});
}
