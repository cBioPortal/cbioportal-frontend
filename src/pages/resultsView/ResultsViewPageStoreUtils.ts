import {
    Gene,
    NumericGeneMolecularData,
    GenePanel,
    GenePanelData,
    MolecularProfile,
    Mutation,
    Patient,
    Sample,
    CancerStudy,
    ClinicalAttribute,
    PatientIdentifier,
    PatientFilter,
    ReferenceGenomeGene,
} from 'cbioportal-ts-api-client';
import { action, computed } from 'mobx';
import AccessorsForOqlFilter, {
    getSimplifiedMutationType,
} from '../../shared/lib/oql/AccessorsForOqlFilter';
import {
    OQLLineFilterOutput,
    UnflattenedOQLLineFilterOutput,
    filterCBioPortalWebServiceDataByUnflattenedOQLLine,
    isMergedTrackFilter,
    MergedTrackLineFilterOutput,
} from '../../shared/lib/oql/oqlfilter';
import oql_parser from '../../shared/lib/oql/oql-parser';
import { groupBy } from '../../shared/lib/StoreUtils';
import {
    AnnotatedExtendedAlteration,
    AnnotatedNumericGeneMolecularData,
    AnnotatedMutation,
    CaseAggregatedData,
    IQueriedCaseData,
    IQueriedMergedTrackCaseData,
    ResultsViewPageStore,
    AlterationTypeConstants,
} from './ResultsViewPageStore';
import { remoteData } from 'cbioportal-frontend-commons';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import _ from 'lodash';
import client from 'shared/api/cbioportalClientInstance';
import { VirtualStudy } from 'shared/model/VirtualStudy';
import MobxPromise, { MobxPromise_await } from 'mobxpromise';
import { calculateQValues } from '../../shared/lib/calculation/BenjaminiHochbergFDRCalculator';
import { SpecialAttribute } from '../../shared/cache/ClinicalDataCache';
import { isSampleProfiled } from 'shared/lib/isSampleProfiled';
import { AlteredStatus } from './mutualExclusivity/MutualExclusivityUtil';
import { Group } from '../../shared/api/ComparisonGroupClient';
import { isNotGermlineMutation } from '../../shared/lib/MutationUtils';

type CustomDriverAnnotationReport = {
    hasBinary: boolean;
    tiers: string[];
};

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type ExtendedClinicalAttribute = Pick<
    ClinicalAttribute,
    'datatype' | 'description' | 'displayName' | 'patientAttribute'
> & {
    clinicalAttributeId: string | SpecialAttribute;
    molecularProfileIds?: string[];
    comparisonGroup?: Group;
};

export type CoverageInformationForCase = {
    byGene: { [hugoGeneSymbol: string]: GenePanelData[] };
    allGenes: Omit<GenePanelData, 'genePanelId'>[];
    notProfiledByGene: { [hugoGeneSymbol: string]: GenePanelData[] };
    notProfiledAllGenes: Omit<GenePanelData, 'genePanelId'>[];
};

export type CoverageInformation = {
    samples: { [uniqueSampleKey: string]: CoverageInformationForCase };
    patients: { [uniquePatientKey: string]: CoverageInformationForCase };
};

export type SampleAlteredMap = { [trackOqlKey: string]: AlteredStatus[] };

export function computeCustomDriverAnnotationReport(
    mutations: Mutation[]
): CustomDriverAnnotationReport {
    let hasBinary = false;
    let tiersMap: { [tier: string]: boolean } = {};
    for (const mutation of mutations) {
        hasBinary = hasBinary || !!mutation.driverFilter;
        if (mutation.driverTiersFilter) {
            tiersMap[mutation.driverTiersFilter] = true;
        }
    }
    return {
        hasBinary,
        tiers: Object.keys(tiersMap),
    };
}

export enum OncoprintAnalysisCaseType {
    SAMPLE = 'sample',
    PATIENT = 'patient',
}

export const DEFAULT_GENOME = 'hg19';

export const initializeCustomDriverAnnotationSettings = action(
    (
        report: CustomDriverAnnotationReport,
        mutationAnnotationSettings: any,
        enableCustomTiers: boolean,
        enableOncoKb: boolean,
        enableHotspots: boolean
    ) => {
        // initialize keys with all available tiers
        for (const tier of report.tiers) {
            mutationAnnotationSettings.driverTiers.set(tier, enableCustomTiers);
        }

        if (enableOncoKb) {
            mutationAnnotationSettings.oncoKb = true;
        }

        if (enableHotspots) {
            mutationAnnotationSettings.hotspots = true;
        }
    }
);

export function annotateMutationPutativeDriver(
    mutation: Mutation,
    putativeDriverInfo: {
        oncoKb: string;
        hotspots: boolean;
        cbioportalCount: boolean;
        cosmicCount: boolean;
        customDriverBinary: boolean;
        customDriverTier?: string;
    }
): AnnotatedMutation {
    const putativeDriver = !!(
        putativeDriverInfo.oncoKb ||
        putativeDriverInfo.hotspots ||
        putativeDriverInfo.cbioportalCount ||
        putativeDriverInfo.cosmicCount ||
        putativeDriverInfo.customDriverBinary ||
        putativeDriverInfo.customDriverTier
    );
    return Object.assign(
        {
            putativeDriver,
            isHotspot: putativeDriverInfo.hotspots,
            oncoKbOncogenic: putativeDriverInfo.oncoKb,
            simplifiedMutationType: getSimplifiedMutationType(
                mutation.mutationType
            ),
        },
        mutation
    ) as AnnotatedMutation;
}

export type FilteredAndAnnotatedMutationsReport<
    T extends AnnotatedMutation = AnnotatedMutation
> = {
    data: T[];
    vus: T[];
    germline: T[];
    vusAndGermline: T[];
};

export function filterAndAnnotateMutations(
    mutations: Mutation[],
    getPutativeDriverInfo: (
        mutation: Mutation
    ) => {
        oncoKb: string;
        hotspots: boolean;
        cbioportalCount: boolean;
        cosmicCount: boolean;
        customDriverBinary: boolean;
        customDriverTier?: string;
    },
    entrezGeneIdToGene: { [entrezGeneId: number]: Gene }
): FilteredAndAnnotatedMutationsReport<AnnotatedMutation> {
    const vus: AnnotatedMutation[] = [];
    const germline: AnnotatedMutation[] = [];
    const vusAndGermline: AnnotatedMutation[] = [];
    const filteredAnnotatedMutations = [];
    for (const mutation of mutations) {
        const annotatedMutation = annotateMutationPutativeDriver(
            mutation,
            getPutativeDriverInfo(mutation)
        ); // annotate
        annotatedMutation.hugoGeneSymbol =
            entrezGeneIdToGene[mutation.entrezGeneId].hugoGeneSymbol;
        const isGermline = !isNotGermlineMutation(mutation);
        const isVus = !annotatedMutation.putativeDriver;
        if (isGermline && isVus) {
            vusAndGermline.push(annotatedMutation);
        } else if (isGermline) {
            germline.push(annotatedMutation);
        } else if (isVus) {
            vus.push(annotatedMutation);
        } else {
            filteredAnnotatedMutations.push(annotatedMutation);
        }
    }
    return {
        data: filteredAnnotatedMutations,
        vus,
        germline,
        vusAndGermline,
    };
}

export function compileMutations<
    T extends AnnotatedMutation = AnnotatedMutation
>(
    report: FilteredAndAnnotatedMutationsReport<T>,
    excludeVus: boolean,
    excludeGermline: boolean
) {
    let mutations = report.data;
    if (!excludeVus) {
        mutations = mutations.concat(report.vus);
    }
    if (!excludeGermline) {
        mutations = mutations.concat(report.germline);
    }
    if (!excludeVus && !excludeGermline) {
        mutations = mutations.concat(report.vusAndGermline);
    }
    return mutations;
}

export const ONCOKB_ONCOGENIC_LOWERCASE = [
    'likely oncogenic',
    'predicted oncogenic',
    'oncogenic',
];

export function getOncoKbOncogenic(response: IndicatorQueryResp): string {
    if (
        ONCOKB_ONCOGENIC_LOWERCASE.indexOf(
            (response.oncogenic || '').toLowerCase()
        ) > -1
    ) {
        return response.oncogenic;
    } else {
        return '';
    }
}

export function computeGenePanelInformation(
    genePanelData: GenePanelData[],
    genePanels: GenePanel[],
    samples: Pick<Sample, 'uniqueSampleKey' | 'uniquePatientKey'>[],
    patients: Pick<Patient, 'uniquePatientKey'>[],
    genes: Pick<Gene, 'entrezGeneId' | 'hugoGeneSymbol'>[]
): CoverageInformation {
    const entrezToGene = _.keyBy(genes, gene => gene.entrezGeneId);
    const genePanelToGenes = _.mapValues(
        _.keyBy(genePanels, panel => panel.genePanelId),
        (panel: GenePanel) => {
            return panel.genes.filter(
                gene => !!entrezToGene[gene.entrezGeneId]
            ); // only list genes that we're curious in
        }
    );
    const sampleInfo: CoverageInformation['samples'] = _.reduce(
        samples,
        (map: CoverageInformation['samples'], sample) => {
            map[sample.uniqueSampleKey] = {
                byGene: {},
                allGenes: [],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            };
            return map;
        },
        {}
    );

    const patientInfo: CoverageInformation['patients'] = _.reduce(
        patients,
        (map: CoverageInformation['patients'], patient) => {
            map[patient.uniquePatientKey] = {
                byGene: {},
                allGenes: [],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            };
            return map;
        },
        {}
    );

    const genePanelDataWithGenePanelId: GenePanelData[] = [];
    for (const gpData of genePanelData) {
        const sampleSequencingInfo = sampleInfo[gpData.uniqueSampleKey];
        const patientSequencingInfo = patientInfo[gpData.uniquePatientKey];
        const genePanelId = gpData.genePanelId;

        if (gpData.profiled) {
            if (genePanelId) {
                if (genePanelToGenes[genePanelId]) {
                    // add gene panel data to record particular genes sequenced
                    for (const gene of genePanelToGenes[genePanelId]) {
                        sampleSequencingInfo.byGene[gene.hugoGeneSymbol] =
                            sampleSequencingInfo.byGene[gene.hugoGeneSymbol] ||
                            [];
                        sampleSequencingInfo.byGene[gene.hugoGeneSymbol].push(
                            gpData
                        );

                        patientSequencingInfo.byGene[gene.hugoGeneSymbol] =
                            patientSequencingInfo.byGene[gene.hugoGeneSymbol] ||
                            [];
                        patientSequencingInfo.byGene[gene.hugoGeneSymbol].push(
                            gpData
                        );
                    }
                    // Add to list for more processing later
                    genePanelDataWithGenePanelId.push(gpData);
                }
            } else {
                // otherwise, all genes are profiled
                sampleSequencingInfo.allGenes.push(gpData);
                patientSequencingInfo.allGenes.push(gpData);
            }
        } else {
            sampleSequencingInfo.notProfiledAllGenes.push(gpData);
            patientSequencingInfo.notProfiledAllGenes.push(gpData);
        }
    }
    // Record which of the queried genes are not profiled by gene panels
    for (const gpData of genePanelDataWithGenePanelId) {
        const sampleSequencingInfo = sampleInfo[gpData.uniqueSampleKey];
        const patientSequencingInfo = patientInfo[gpData.uniquePatientKey];

        for (const queryGene of genes) {
            if (!sampleSequencingInfo.byGene[queryGene.hugoGeneSymbol]) {
                sampleSequencingInfo.notProfiledByGene[
                    queryGene.hugoGeneSymbol
                ] =
                    sampleSequencingInfo.notProfiledByGene[
                        queryGene.hugoGeneSymbol
                    ] || [];
                sampleSequencingInfo.notProfiledByGene[
                    queryGene.hugoGeneSymbol
                ].push(gpData);
            }
            if (!patientSequencingInfo.byGene[queryGene.hugoGeneSymbol]) {
                patientSequencingInfo.notProfiledByGene[
                    queryGene.hugoGeneSymbol
                ] =
                    patientSequencingInfo.notProfiledByGene[
                        queryGene.hugoGeneSymbol
                    ] || [];
                patientSequencingInfo.notProfiledByGene[
                    queryGene.hugoGeneSymbol
                ].push(gpData);
            }
        }
    }
    return {
        samples: sampleInfo,
        patients: patientInfo,
    };
}

export function annotateMolecularDatum(
    molecularDatum: NumericGeneMolecularData,
    getOncoKbCnaAnnotationForOncoprint: (
        datum: NumericGeneMolecularData
    ) => IndicatorQueryResp | undefined,
    molecularProfileIdToMolecularProfile: {
        [molecularProfileId: string]: MolecularProfile;
    },
    entrezGeneIdToGene: { [entrezGeneId: number]: Gene }
): AnnotatedNumericGeneMolecularData {
    const hugoGeneSymbol =
        entrezGeneIdToGene[molecularDatum.entrezGeneId].hugoGeneSymbol;
    let oncogenic = '';
    if (
        molecularProfileIdToMolecularProfile[molecularDatum.molecularProfileId]
            .molecularAlterationType === 'COPY_NUMBER_ALTERATION'
    ) {
        const oncoKbDatum = getOncoKbCnaAnnotationForOncoprint(molecularDatum);
        if (oncoKbDatum) {
            oncogenic = getOncoKbOncogenic(oncoKbDatum);
        }
    }
    return Object.assign(
        { oncoKbOncogenic: oncogenic, hugoGeneSymbol },
        molecularDatum
    );
}

export async function fetchQueriedStudies(
    allPhysicalStudies: { [id: string]: CancerStudy },
    queriedIds: string[],
    queriedVirtualStudies: VirtualStudy[]
): Promise<CancerStudy[]> {
    const queriedStudies: CancerStudy[] = [];
    let unknownIds: { [id: string]: boolean } = {};
    for (const id of queriedIds) {
        if (allPhysicalStudies[id]) {
            queriedStudies.push(allPhysicalStudies[id]);
        } else {
            unknownIds[id] = true;
        }
    }

    if (!_.isEmpty(unknownIds)) {
        queriedVirtualStudies
            .filter((vs: VirtualStudy) => unknownIds[vs.id])
            .forEach(virtualStudy => {
                // tslint:disable-next-line:no-object-literal-type-assertion
                const cancerStudy = {
                    allSampleCount: _.sumBy(
                        virtualStudy.data.studies,
                        study => study.samples.length
                    ),
                    studyId: virtualStudy.id,
                    name: virtualStudy.data.name,
                    description: virtualStudy.data.description,
                    cancerTypeId: 'My Virtual Studies',
                } as CancerStudy;
                queriedStudies.push(cancerStudy);
            });
    }

    return queriedStudies;
}

export function groupDataByCase(
    oqlFilter: UnflattenedOQLLineFilterOutput<AnnotatedExtendedAlteration>,
    samples: { uniqueSampleKey: string }[],
    patients: { uniquePatientKey: string }[]
): CaseAggregatedData<AnnotatedExtendedAlteration> {
    const data: AnnotatedExtendedAlteration[] = isMergedTrackFilter(oqlFilter)
        ? _.flatMap(oqlFilter.list, geneLine => geneLine.data)
        : oqlFilter.data;
    return {
        samples: groupBy(
            data,
            datum => datum.uniqueSampleKey,
            samples.map(sample => sample.uniqueSampleKey)
        ),
        patients: groupBy(
            data,
            datum => datum.uniquePatientKey,
            patients.map(sample => sample.uniquePatientKey)
        ),
    };
}

export function filterSubQueryData(
    queryStructure: UnflattenedOQLLineFilterOutput<object>,
    defaultOQLQuery: string,
    data: (AnnotatedMutation | NumericGeneMolecularData)[],
    accessorsInstance: AccessorsForOqlFilter,
    samples: { uniqueSampleKey: string }[],
    patients: { uniquePatientKey: string }[]
): IQueriedCaseData<object>[] | undefined {
    function filterDataForLine(oqlLine: string) {
        // assuming that merged track syntax will never allow
        // nesting, each inner OQL line will be one single-gene
        // query
        const alterationsForLine = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            oqlLine,
            data,
            accessorsInstance,
            defaultOQLQuery
        )[0] as OQLLineFilterOutput<AnnotatedExtendedAlteration>;
        return {
            cases: groupDataByCase(alterationsForLine, samples, patients),
            oql: alterationsForLine,
        };
    }

    if (!isMergedTrackFilter(queryStructure)) {
        return undefined;
    } else {
        return queryStructure.list.map(innerLine =>
            filterDataForLine(innerLine.oql_line)
        );
    }
}

export function isRNASeqProfile(profileId: string): boolean {
    return RegExp(
        `rna_seq_mrna$|rna_seq_v2_mrna$|pan_can_atlas_2018_rna_seq_mrna_median$|pan_can_atlas_2018_rna_seq_v2_mrna_median$`
    ).test(profileId);
}

export function isTCGAPubStudy(studyId: string) {
    return /tcga_pub$/.test(studyId);
}

export function isTCGAProvStudy(studyId: string) {
    return /tcga$/.test(studyId);
}

export function isPanCanStudy(studyId: string) {
    return /tcga_pan_can_atlas/.test(studyId);
}

export function buildResultsViewPageTitle(
    genes: string[],
    studies: CancerStudy[]
) {
    const arr = ['cBioPortal for Cancer Genomics: '];

    if (genes.length) {
        arr.push(genes[0]);
        if (genes.length > 1) {
            arr.push(', ');
            arr.push(genes[1]);
        }
        if (genes.length > 2) {
            arr.push(' and ');
            arr.push((genes.length - 2).toString());
            arr.push(' other ');
            arr.push(genes.length - 2 > 1 ? 'genes' : 'gene');
        }
        if (studies.length) {
            arr.push(' in ');
            arr.push(studies[0].shortName);
            if (studies.length > 1) {
                arr.push(' and ');
                arr.push((studies.length - 1).toString());
                arr.push(' other ');
                arr.push(studies.length - 1 > 1 ? 'studies' : 'study');
            }
        }
    }
    return arr.join('');
}

export function getMolecularProfiles(query: any) {
    //if there's only one study, we read profiles from query params and filter out undefined
    let molecularProfiles = [
        query.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
        query.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
        query.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
        query.genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION,
        query.genetic_profile_ids_PROFILE_GENESET_SCORE,
        query.genetic_profile_ids_GENERIC_ASSAY,
    ].filter((profile: string | undefined) => !!profile);

    // append 'genetic_profile_ids' which is sometimes in use
    molecularProfiles = molecularProfiles.concat(
        query.genetic_profile_ids || []
    );

    // filter out duplicates
    molecularProfiles = _.uniq(molecularProfiles);

    return molecularProfiles;
}

export function doesQueryHaveCNSegmentData(detailedSamples: Sample[]) {
    if (detailedSamples.length === 0) {
        return false;
    } else if (!('copyNumberSegmentPresent' in detailedSamples[0])) {
        throw 'Passed non-detailed sample projection when detailed expected.';
    } else {
        return _.some(detailedSamples, s => !!s.copyNumberSegmentPresent);
    }
}

export function getSampleAlteredMap(
    filteredAlterationData: IQueriedMergedTrackCaseData[],
    samples: Sample[],
    oqlQuery: string,
    coverageInformation: CoverageInformation,
    selectedMolecularProfileIds: string[],
    studyToMolecularProfiles: _.Dictionary<MolecularProfile[]>
) {
    const result: SampleAlteredMap = {};
    filteredAlterationData.forEach((element, key) => {
        //1: is not group
        if (element.mergedTrackOqlList === undefined) {
            const notGroupedOql = element.oql as OQLLineFilterOutput<
                AnnotatedExtendedAlteration
            >;
            const sampleKeysMap = _.keyBy(
                _.map(notGroupedOql.data, data => data.uniqueSampleKey)
            );
            const unProfiledSampleKeysMap = _.keyBy(
                samples
                    .filter(sample => {
                        const molecularProfileIds = studyToMolecularProfiles[
                            sample.studyId
                        ]
                            ? _.intersection(
                                  studyToMolecularProfiles[sample.studyId].map(
                                      profile => profile.molecularProfileId
                                  ),
                                  selectedMolecularProfileIds
                              )
                            : selectedMolecularProfileIds;
                        // if not profiled in some genes molecular profile, then we think it is not profiled and will exclude this sample
                        return _.some(
                            _.map(molecularProfileIds, molecularProfileId => {
                                return isSampleProfiled(
                                    sample.uniqueSampleKey,
                                    molecularProfileId,
                                    notGroupedOql.gene,
                                    coverageInformation
                                );
                            }),
                            profiled => profiled === false
                        );
                    })
                    .map(sample => sample.uniqueSampleKey)
            );
            result[
                getSingleGeneResultKey(key, oqlQuery, notGroupedOql)
            ] = samples.map((sample: Sample) => {
                if (sample.uniqueSampleKey in unProfiledSampleKeysMap) {
                    return AlteredStatus.UNPROFILED;
                } else if (sample.uniqueSampleKey in sampleKeysMap) {
                    return AlteredStatus.ALTERED;
                } else {
                    return AlteredStatus.UNALTERED;
                }
            });
        }
        //2: is group
        else {
            const groupedOql = element.oql as MergedTrackLineFilterOutput<
                AnnotatedExtendedAlteration
            >;
            const sampleKeysMap = _.keyBy(
                _.map(
                    _.flatten(_.map(groupedOql.list, list => list.data)),
                    data => data.uniqueSampleKey
                )
            );
            const groupGenes = _.map(groupedOql.list, oql => oql.gene);
            const unProfiledSampleKeysMap = _.keyBy(
                samples
                    .filter(sample => {
                        const molecularProfileIds = studyToMolecularProfiles[
                            sample.studyId
                        ]
                            ? _.intersection(
                                  studyToMolecularProfiles[sample.studyId].map(
                                      profile => profile.molecularProfileId
                                  ),
                                  selectedMolecularProfileIds
                              )
                            : selectedMolecularProfileIds;
                        // if not profiled in some genes molecular profile, then we think it is not profiled and will exclude this sample
                        return _.some(
                            _.map(molecularProfileIds, molecularProfileId => {
                                // if not profiled in every genes, then the sample is not profiled, or we think it is profiled
                                return _.every(
                                    _.map(groupGenes, gene => {
                                        return isSampleProfiled(
                                            sample.uniqueSampleKey,
                                            molecularProfileId,
                                            gene,
                                            coverageInformation
                                        );
                                    }),
                                    profiled => profiled === false
                                );
                            }),
                            notProfiled => notProfiled === true
                        );
                    })
                    .map(sample => sample.uniqueSampleKey)
            );
            result[getMultipleGeneResultKey(groupedOql)] = samples.map(
                (sample: Sample) => {
                    if (sample.uniqueSampleKey in unProfiledSampleKeysMap) {
                        return AlteredStatus.UNPROFILED;
                    } else if (sample.uniqueSampleKey in sampleKeysMap) {
                        return AlteredStatus.ALTERED;
                    } else {
                        return AlteredStatus.UNALTERED;
                    }
                }
            );
        }
    });
    return result;
}

export function getSingleGeneResultKey(
    key: number,
    oqlQuery: string,
    notGroupedOql: OQLLineFilterOutput<AnnotatedExtendedAlteration>
) {
    //only gene
    if (
        (oql_parser.parse(oqlQuery)![key] as oql_parser.SingleGeneQuery)
            .alterations === false
    ) {
        return notGroupedOql.gene;
    }
    //gene with alteration type
    else {
        return notGroupedOql.oql_line.slice(0, -1);
    }
}

export function getMultipleGeneResultKey(
    groupedOql: MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>
) {
    return groupedOql.label
        ? groupedOql.label
        : _.map(groupedOql.list, data => data.gene).join(' / ');
}

export function makeEnrichmentDataPromise<
    T extends {
        cytoband?: string;
        hugoGeneSymbol: string;
        pValue: number;
        qValue?: number;
    }
>(params: {
    storeForExcludingQueryGenes?: ResultsViewPageStore;
    await: MobxPromise_await;
    referenceGenesPromise: MobxPromise<{
        [hugoGeneSymbol: string]: ReferenceGenomeGene;
    }>;
    getSelectedProfileMap: () => { [studyId: string]: MolecularProfile };
    fetchData: () => Promise<T[]>;
}): MobxPromise<(T & { qValue: number })[]> {
    return remoteData({
        await: () => {
            const ret = params.await();
            if (params.storeForExcludingQueryGenes) {
                ret.push(
                    params.storeForExcludingQueryGenes.selectedMolecularProfiles
                );
            }
            ret.push(params.referenceGenesPromise);
            return ret;
        },
        invoke: async () => {
            const profileMap = params.getSelectedProfileMap();
            if (profileMap) {
                let data = await params.fetchData();
                // filter out query genes, if looking at a queried profile
                // its important that we filter out *before* calculating Q values
                if (
                    params.storeForExcludingQueryGenes &&
                    params.storeForExcludingQueryGenes.selectedMolecularProfiles.result!.findIndex(
                        molecularProfile =>
                            profileMap[molecularProfile.studyId] !== undefined
                    ) > -1
                ) {
                    const queryGenes = _.keyBy(
                        params.storeForExcludingQueryGenes.hugoGeneSymbols,
                        x => x.toUpperCase()
                    );
                    data = data.filter(
                        d => !(d.hugoGeneSymbol.toUpperCase() in queryGenes)
                    );
                }

                let referenceGenes = params.referenceGenesPromise.result!;
                // add cytoband from reference gene
                for (const d of data) {
                    const refGene = referenceGenes[d.hugoGeneSymbol];

                    if (refGene) d.cytoband = refGene.cytoband;
                }

                const dataWithpValue: T[] = [];
                const dataWithoutpValue: T[] = [];
                data.forEach(datum => {
                    datum.pValue === undefined
                        ? dataWithoutpValue.push(datum)
                        : dataWithpValue.push(datum);
                });

                const sortedByPValue = _.sortBy(dataWithpValue, c => c.pValue);
                const qValues = calculateQValues(
                    sortedByPValue.map(c => c.pValue)
                );

                qValues.forEach((qValue, index) => {
                    sortedByPValue[index].qValue = qValue;
                });

                return sortEnrichmentData([
                    ...sortedByPValue,
                    ...dataWithoutpValue,
                ]);
            } else {
                return [];
            }
        },
    });
}

function sortEnrichmentData(data: any[]): any[] {
    return _.sortBy(data, ['pValue', 'hugoGeneSymbol']);
}

export function fetchPatients(samples: Sample[]) {
    let patientKeyToPatientIdentifier: {
        [uniquePatientKey: string]: PatientIdentifier;
    } = {};
    for (const sample of samples) {
        patientKeyToPatientIdentifier[sample.uniquePatientKey] = {
            patientId: sample.patientId,
            studyId: sample.studyId,
        };
    }
    const patientFilter = {
        uniquePatientKeys: _.uniq(
            samples.map((sample: Sample) => sample.uniquePatientKey)
        ),
    } as PatientFilter;

    return client.fetchPatientsUsingPOST({
        patientFilter,
    });
}

export function excludeMutationAndSVProfiles(
    molecularprofiles: MolecularProfile[]
): MolecularProfile[] {
    const mutationAlterationTypes = [
        AlterationTypeConstants.MUTATION_EXTENDED,
        AlterationTypeConstants.MUTATION_UNCALLED,
        AlterationTypeConstants.FUSION,
        AlterationTypeConstants.STRUCTURAL_VARIANT,
    ];
    return molecularprofiles.filter(
        profile =>
            !mutationAlterationTypes.includes(profile.molecularAlterationType)
    );
}

export function parseGenericAssayGroups(
    generic_assay_groups: string
): {
    [molecularProfileId: string]: string[];
} {
    const groups = generic_assay_groups
        ? generic_assay_groups.split(';').map((x: string) => x.split(','))
        : [];

    const parsedGroups = groups.reduce(
        (acc: { [molecularProfileId: string]: string[] }, group) => {
            acc[group[0] as string] = group.slice(1);
            return acc;
        },
        {}
    );
    return parsedGroups;
}
