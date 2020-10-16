import * as _ from 'lodash';
import {
    CBioPortalAPIInternal,
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    CopyNumberCount,
    DiscreteCopyNumberData,
    DiscreteCopyNumberFilter,
    GenePanel,
    GenePanelData,
    MolecularProfile,
    Mutation,
    MutationFilter,
    NumericGeneMolecularData,
    ReferenceGenomeGene,
    ResourceData,
    Sample,
    SampleMolecularIdentifier,
} from 'cbioportal-ts-api-client';
import client from '../../../shared/api/cbioportalClientInstance';
import internalClient from '../../../shared/api/cbioportalInternalClientInstance';

import { ExtendedGenomeNexusAPIInternal } from '../../../shared/api/genomeNexusInternalClientInstance';

import { computed, observable, action, runInAction } from 'mobx';
import {
    getBrowserWindow,
    remoteData,
    stringListToSet,
} from 'cbioportal-frontend-commons';
import { IGisticData } from 'shared/model/Gistic';
import { cached, labelMobxPromises } from 'mobxpromise';
import MrnaExprRankCache from 'shared/cache/MrnaExprRankCache';
import request from 'superagent';
import DiscreteCNACache from 'shared/cache/DiscreteCNACache';
import {
    getDarwinUrl,
    getDigitalSlideArchiveMetaUrl,
    getGenomeNexusHgvsgUrl,
} from '../../../shared/api/urls';
import PubMedCache from 'shared/cache/PubMedCache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import {
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';
import {
    ONCOKB_DEFAULT_INFO,
    USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB,
} from 'react-mutation-mapper';
import { ClinicalInformationData } from 'shared/model/ClinicalInformation';
import VariantCountCache from 'shared/cache/VariantCountCache';
import CopyNumberCountCache from './CopyNumberCountCache';
import CancerTypeCache from 'shared/cache/CancerTypeCache';
import MutationCountCache from 'shared/cache/MutationCountCache';
import AppConfig from 'appConfig';
import {
    concatMutationData,
    existsSomeMutationWithAscnPropertyInCollection,
    fetchClinicalData,
    fetchClinicalDataForPatient,
    fetchCnaOncoKbData,
    fetchCopyNumberData,
    fetchCopyNumberSegments,
    fetchCosmicData,
    fetchDiscreteCNAData,
    fetchGenePanel,
    fetchGenePanelData,
    fetchGisticData,
    fetchMutationalSignatureData,
    fetchMutationalSignatureMetaData,
    fetchMutationData,
    fetchMutSigData,
    fetchOncoKbCancerGenes,
    fetchOncoKbData,
    fetchOncoKbInfo,
    fetchReferenceGenomeGenes,
    fetchSamplesForPatient,
    fetchStudiesForSamplesWithoutCancerTypeClinicalData,
    mapSampleIdToClinicalData,
    fetchVariantAnnotationsIndexedByGenomicLocation,
    findMolecularProfileIdDiscrete,
    findMrnaRankMolecularProfileId,
    findMutationMolecularProfile,
    findSamplesWithoutCancerTypeClinicalData,
    findUncalledMutationMolecularProfileId,
    generateUniqueSampleKeyToTumorTypeMap,
    groupBySampleId,
    makeStudyToCancerTypeMap,
    mergeDiscreteCNAData,
    mergeMutations,
    mergeMutationsIncludingUncalled,
    noGenePanelUsed,
    ONCOKB_DEFAULT,
    getGenomeNexusUrl,
    makeGetOncoKbMutationAnnotationForOncoprint,
    makeGetOncoKbCnaAnnotationForOncoprint,
    fetchOncoKbDataForOncoprint,
    fetchCnaOncoKbDataForOncoprint,
    makeIsHotspotForOncoprint,
    findDiscreteMolecularProfile,
    filterAndAnnotateMolecularData,
} from 'shared/lib/StoreUtils';
import {
    getCoverageInformation,
    CoverageInformation,
} from 'shared/lib/GenePanelUtils';
import {
    fetchCivicGenes,
    fetchCivicVariants,
    fetchCnaCivicGenes,
} from 'shared/lib/CivicUtils';
import { fetchHotspotsData } from 'shared/lib/CancerHotspotsUtils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { CancerGene, IndicatorQueryResp } from 'oncokb-ts-api-client';
import { MutationTableDownloadDataFetcher } from 'shared/lib/MutationTableDownloadDataFetcher';
import { getNavCaseIdsCache } from 'shared/lib/handleLongUrls';
import {
    fetchTrialMatchesUsingPOST,
    fetchTrialsById,
} from '../../../shared/api/MatchMinerAPI';
import {
    IDetailedTrialMatch,
    ITrial,
    ITrialMatch,
    ITrialQuery,
} from '../../../shared/model/MatchMiner';
import { groupTrialMatchesById } from '../trialMatch/TrialMatchTableUtils';
import { GeneFilterOption } from '../mutation/GeneFilterMenu';
import TumorColumnFormatter from '../mutation/column/TumorColumnFormatter';
import {
    filterAndAnnotateMutations,
    getOncoKbOncogenic,
} from '../../resultsView/ResultsViewPageStoreUtils';
import { AppStore } from 'AppStore';
import { getVariantAlleleFrequency } from 'shared/lib/MutationUtils';
import { getGeneFilterDefault } from './PatientViewPageStoreUtil';
import { checkNonProfiledGenesExist } from '../PatientViewPageUtils';
import autobind from 'autobind-decorator';
import { createVariantAnnotationsByMutationFetcher } from 'shared/components/mutationMapper/MutationMapperUtils';
import {
    ICivicGene,
    ICivicVariant,
    IHotspotIndex,
    IMyCancerGenomeData,
    indexHotspotsData,
    IMyVariantInfoIndex,
    getMyCancerGenomeData,
    getMyVariantInfoAnnotationsFromIndexedVariantAnnotations,
    IOncoKbData,
    SiteError,
} from 'cbioportal-utils';
import { makeGeneticTrackData } from 'shared/components/oncoprint/DataUtils';
import { GeneticTrackDatum } from 'shared/components/oncoprint/Oncoprint';
import {
    AlterationTypeConstants,
    AnnotatedExtendedAlteration,
} from 'pages/resultsView/ResultsViewPageStore';
import {
    cna_profile_data_to_string,
    getMutationSubType,
    getSimplifiedMutationType,
} from 'shared/lib/oql/AccessorsForOqlFilter';

type PageMode = 'patient' | 'sample';

export async function checkForTissueImage(patientId: string): Promise<boolean> {
    if (/TCGA/.test(patientId) === false) {
        return false;
    } else {
        let resp = await request.get(getDigitalSlideArchiveMetaUrl(patientId));

        // if the count is greater than 0, there is a slide for this patient
        return resp.body && resp.body.total_count && resp.body.total_count > 0;
    }
}

export type PathologyReportPDF = {
    name: string;
    url: string;
};

export function parseCohortIds(concatenatedIds: string) {
    return concatenatedIds.split(',').map((entityId: string) => {
        return entityId.includes(':')
            ? entityId
            : this.studyId + ':' + entityId;
    });
}

export function buildCohortIdsFromNavCaseIds(
    navCaseIds: { patientId: string; studyId: string }[]
) {
    return _.map(navCaseIds, navCaseId => {
        return navCaseId.studyId + ':' + navCaseId.patientId;
    });
}

export function handlePathologyReportCheckResponse(
    patientId: string,
    resp: any
): PathologyReportPDF[] {
    if (resp.total_count > 0) {
        // only use pdfs starting with the patient id to prevent mismatches
        const r = new RegExp('^' + patientId);
        const filteredItems: any = _.filter(resp.items, (item: any) =>
            r.test(item.name)
        );
        return _.map(filteredItems, (item: any) => ({
            url: item.url,
            name: item.name,
        }));
    } else {
        return [];
    }
}

export function filterMutationsByProfiledGene(
    mutationRows: Mutation[][],
    sampleIds: string[],
    sampleToGenePanelId: { [sampleId: string]: string },
    genePanelIdToEntrezGeneIds: { [sampleId: string]: number[] }
): Mutation[][] {
    return _.filter(mutationRows, (mutations: Mutation[]) => {
        const entrezGeneId = mutations[0].gene.entrezGeneId;
        const geneProfiledInSamples = TumorColumnFormatter.getProfiledSamplesForGene(
            entrezGeneId,
            sampleIds,
            sampleToGenePanelId,
            genePanelIdToEntrezGeneIds
        );
        return (
            _(geneProfiledInSamples)
                .values()
                .filter((profiled: boolean) => profiled)
                .value().length === sampleIds.length
        );
    });
}

/*
 * Transform clinical data from API to clinical data shape as it will be stored
 * in the store
 */
function transformClinicalInformationToStoreShape(
    patientId: string,
    studyId: string,
    sampleIds: Array<string>,
    clinicalDataPatient: Array<ClinicalData>,
    clinicalDataSample: Array<ClinicalData>
): ClinicalInformationData {
    const patient = {
        id: patientId,
        clinicalData: clinicalDataPatient,
    };
    const samples = groupBySampleId(sampleIds, clinicalDataSample);
    const rv = {
        patient,
        samples,
    };

    return rv;
}

export class PatientViewPageStore {
    constructor(private appStore: AppStore) {
        labelMobxPromises(this);
        this.internalClient = internalClient;
    }

    public internalClient: CBioPortalAPIInternal;

    @observable public activeTabId = '';

    @observable private _patientId = '';
    @computed get patientId(): string {
        if (this._patientId) return this._patientId;

        return this.derivedPatientId.result;
    }

    @observable public urlValidationError: string | null = null;

    @observable ajaxErrors: Error[] = [];

    @observable studyId = '';

    @observable _sampleId = '';

    private openResourceTabMap = observable.map<boolean>();
    @autobind
    public isResourceTabOpen(resourceId: string) {
        return !!this.openResourceTabMap.get(resourceId);
    }
    @autobind
    @action
    public setResourceTabOpen(resourceId: string, open: boolean) {
        this.openResourceTabMap.set(resourceId, open);
    }

    @observable
    public mutationTableGeneFilterOption: GeneFilterOption = getGeneFilterDefault(
        getBrowserWindow().frontendConfig
    );
    @observable
    public copyNumberTableGeneFilterOption: GeneFilterOption = getGeneFilterDefault(
        getBrowserWindow().frontendConfig
    );

    @computed get sampleId() {
        return this._sampleId;
    }

    @computed get pageTitle(): string {
        if (this.pageMode === 'patient') {
            return `Patient: ${this.patientId}`;
        } else {
            return `Sample: ${this.sampleId}`;
        }
    }

    @computed get metaDescription(): string {
        const id = this.pageMode === 'patient' ? this.patientId : this.sampleId;
        return `${id} from ${this.studyMetaData.result!.name}`;
    }

    @computed get pageMode(): PageMode {
        return this._sampleId ? 'sample' : 'patient';
    }

    @computed get caseId(): string {
        return this.pageMode === 'sample' ? this.sampleId : this.patientId;
    }

    readonly mutationMolecularProfile = remoteData({
        await: () => [this.molecularProfilesInStudy],
        invoke: async () =>
            findMutationMolecularProfile(
                this.molecularProfilesInStudy,
                this.studyId
            ),
    });

    readonly discreteMolecularProfile = remoteData({
        await: () => [this.molecularProfilesInStudy],
        invoke: async () =>
            findDiscreteMolecularProfile(this.molecularProfilesInStudy),
    });

    readonly mutationMolecularProfileId = remoteData({
        await: () => [this.molecularProfilesInStudy],
        invoke: async () => {
            const profile = findMutationMolecularProfile(
                this.molecularProfilesInStudy,
                this.studyId
            );
            if (profile) {
                return profile.molecularProfileId;
            } else {
                return undefined;
            }
        },
    });

    readonly uncalledMutationMolecularProfileId = remoteData({
        await: () => [this.molecularProfilesInStudy],
        invoke: async () =>
            findUncalledMutationMolecularProfileId(
                this.molecularProfilesInStudy,
                this.studyId
            ),
    });

    // this is a string of concatenated ids
    @observable
    private _patientIdsInCohort: string[] = [];

    public set patientIdsInCohort(cohortIds: string[]) {
        // cannot put action on setter
        runInAction(() => (this._patientIdsInCohort = cohortIds));
    }

    @computed
    public get patientIdsInCohort(): string[] {
        let concatenatedIds: string;
        // check to see if we copied from url hash on app load
        const memoryCachedIds = getNavCaseIdsCache();
        return memoryCachedIds ? memoryCachedIds : this._patientIdsInCohort;
    }

    readonly myCancerGenomeData: IMyCancerGenomeData = getMyCancerGenomeData();

    readonly mutationalSignatureData = remoteData({
        invoke: async () => fetchMutationalSignatureData(),
    });

    readonly mutationalSignatureMetaData = remoteData({
        invoke: async () => fetchMutationalSignatureMetaData(),
    });

    readonly hasMutationalSignatureData = remoteData({
        invoke: async () => false,
        default: false,
    });

    readonly derivedPatientId = remoteData<string>({
        await: () => [this.samples],
        invoke: async () => {
            for (let sample of this.samples.result) return sample.patientId;
            return '';
        },
        default: '',
    });

    readonly clinicalDataPatient = remoteData({
        await: () =>
            this.pageMode === 'patient' ? [] : [this.derivedPatientId],
        invoke: async () =>
            fetchClinicalDataForPatient(this.studyId, this.patientId),
        default: [],
    });

    readonly samples = remoteData(
        {
            invoke: () =>
                fetchSamplesForPatient(
                    this.studyId,
                    this._patientId,
                    this.sampleId
                ),
            onError: (err: Error) => {
                this.appStore.siteErrors.push({
                    errorObj: err,
                    dismissed: false,
                    title: 'Samples / Patients not valid',
                } as SiteError);
            },
        },
        []
    );

    // use this when pageMode === 'sample' to get total nr of samples for the
    // patient
    readonly allSamplesForPatient = remoteData({
        await: () => [this.derivedPatientId],
        invoke: async () => {
            return await client.getAllSamplesOfPatientInStudyUsingGET({
                studyId: this.studyId,
                patientId: this.derivedPatientId.result,
                projection: 'DETAILED',
            });
        },
        default: [],
    });

    // NOTE: this.samples do not contain unique keys if it is populated by the getSampleInStudyUsingGET method.
    // To make sure that samples always have unique keys we get them from this.allSamplesForPatient.
    readonly samplesWithUniqueKeys = remoteData(
        {
            await: () => [this.samples, this.allSamplesForPatient],
            invoke: () =>
                Promise.resolve(
                    this.samples.result.map(
                        sample =>
                            this.allSamplesForPatient.result.find(
                                s => s.sampleId === sample.sampleId
                            ) || sample
                    )
                ),
        },
        []
    );

    readonly samplesWithoutCancerTypeClinicalData = remoteData(
        {
            await: () => [this.samples, this.clinicalDataForSamples],
            invoke: async () =>
                findSamplesWithoutCancerTypeClinicalData(
                    this.samples,
                    this.clinicalDataForSamples
                ),
        },
        []
    );

    readonly studiesForSamplesWithoutCancerTypeClinicalData = remoteData(
        {
            await: () => [this.samplesWithoutCancerTypeClinicalData],
            invoke: async () =>
                fetchStudiesForSamplesWithoutCancerTypeClinicalData(
                    this.samplesWithoutCancerTypeClinicalData
                ),
        },
        []
    );

    readonly studies = remoteData(
        {
            invoke: async () => [
                await client.getStudyUsingGET({ studyId: this.studyId }),
            ],
        },
        []
    );

    readonly studyIdToStudy = remoteData(
        {
            await: () => [this.studies],
            invoke: () =>
                Promise.resolve(_.keyBy(this.studies.result, x => x.studyId)),
        },
        {}
    );

    @computed get studyToCancerType() {
        return makeStudyToCancerTypeMap(this.studies.result);
    }

    readonly cnaSegments = remoteData(
        {
            await: () => [this.samples],
            invoke: () => fetchCopyNumberSegments(this.studyId, this.sampleIds),
        },
        []
    );

    readonly resourceDefinitions = remoteData({
        invoke: () =>
            client.getAllResourceDefinitionsInStudyUsingGET({
                studyId: this.studyId,
            }),
        onResult: defs => {
            // open resources which have `openByDefault` set to true
            if (defs) {
                for (const def of defs)
                    if (def.openByDefault)
                        this.setResourceTabOpen(def.resourceId, true);
            }
        },
    });

    readonly studyResourceData = remoteData<ResourceData[]>({
        await: () => [this.resourceDefinitions],
        invoke: () => {
            const ret: ResourceData[] = [];
            const studyResourceDefinitions = this.resourceDefinitions.result!.filter(
                d => d.resourceType === 'STUDY'
            );
            const promises = [];
            for (const resource of studyResourceDefinitions) {
                promises.push(
                    client
                        .getAllStudyResourceDataInStudyUsingGET({
                            studyId: this.studyId,
                            resourceId: resource.resourceId,
                            projection: 'DETAILED',
                        })
                        .then(data => ret.push(...data))
                );
            }
            return Promise.all(promises).then(() => ret);
        },
    });

    readonly sampleResourceData = remoteData<{
        [sampleId: string]: ResourceData[];
    }>({
        await: () => [this.resourceDefinitions, this.samples],
        invoke: () => {
            const sampleResourceDefinitions = this.resourceDefinitions.result!.filter(
                d => d.resourceType === 'SAMPLE'
            );
            if (!sampleResourceDefinitions.length) {
                return Promise.resolve({});
            }

            const samples = this.samples.result!;
            const ret: { [sampleId: string]: ResourceData[] } = {};
            const promises = [];
            for (const sample of samples) {
                for (const resource of sampleResourceDefinitions) {
                    promises.push(
                        client
                            .getAllResourceDataOfSampleInStudyUsingGET({
                                sampleId: sample.sampleId,
                                studyId: this.studyId,
                                resourceId: resource.resourceId,
                                projection: 'DETAILED',
                            })
                            .then(data => {
                                ret[sample.sampleId] =
                                    ret[sample.sampleId] || [];
                                ret[sample.sampleId].push(...data);
                            })
                    );
                }
            }
            return Promise.all(promises).then(() => ret);
        },
    });

    readonly patientResourceData = remoteData<ResourceData[]>({
        await: () => [this.resourceDefinitions],
        invoke: () => {
            const ret: ResourceData[] = [];
            const patientResourceDefinitions = this.resourceDefinitions.result!.filter(
                d => d.resourceType === 'PATIENT'
            );
            const promises = [];
            for (const resource of patientResourceDefinitions) {
                promises.push(
                    client
                        .getAllResourceDataOfPatientInStudyUsingGET({
                            studyId: this.studyId,
                            patientId: this.patientId,
                            resourceId: resource.resourceId,
                            projection: 'DETAILED',
                        })
                        .then(data => ret.push(...data))
                );
            }
            return Promise.all(promises).then(() => ret);
        },
    });

    readonly resourceIdToResourceData = remoteData<{
        [resourceId: string]: ResourceData[];
    }>({
        await: () => [
            this.sampleResourceData,
            this.patientResourceData,
            this.studyResourceData,
        ],
        invoke: () => {
            const allData: ResourceData[] = _.flatMap(
                this.sampleResourceData.result!,
                v => v
            )
                .concat(this.patientResourceData.result!)
                .concat(this.studyResourceData.result!);
            return Promise.resolve(_.groupBy(allData, d => d.resourceId));
        },
    });

    readonly pathologyReport = remoteData(
        {
            await: () => [this.derivedPatientId],
            invoke: () => {
                // only check path report for tcga studies
                if (this.studyId.toLowerCase().indexOf('tcga') > -1) {
                    const pathLinkUrl =
                        'https://raw.githubusercontent.com/inodb/datahub/a0d36d77b242e32cda3175127de73805b028f595/tcga/pathology_reports/symlink_by_patient';
                    const rawPdfUrl =
                        'https://github.com/inodb/datahub/raw/a0d36d77b242e32cda3175127de73805b028f595/tcga/pathology_reports';
                    const reports: PathologyReportPDF[] = [];

                    // keep checking if patient has more reports recursively
                    function getPathologyReport(
                        patientId: string,
                        i: number
                    ): any {
                        return request
                            .get(`${pathLinkUrl}/${patientId}.${i}`)
                            .then(
                                function(resp) {
                                    // add report
                                    let pdfName: string = resp.text.split(
                                        '/'
                                    )[1];
                                    reports.push({
                                        name: `${pdfName}`,
                                        url: `${rawPdfUrl}/${pdfName}`,
                                    });
                                    // check if patient has more reports
                                    return getPathologyReport(patientId, i + 1);
                                },
                                () => reports
                            );
                    }

                    return getPathologyReport(this.patientId, 0);
                } else {
                    return Promise.resolve([]);
                }
            },
            onError: (err: Error) => {
                // fail silently
            },
        },
        []
    );

    readonly cosmicData = remoteData({
        await: () => [this.mutationData, this.uncalledMutationData],
        invoke: () =>
            fetchCosmicData(this.mutationData, this.uncalledMutationData),
    });

    readonly mutSigData = remoteData({
        invoke: async () => fetchMutSigData(this.studyId),
    });

    // Mutation annotation
    // genome nexus
    readonly indexedVariantAnnotations = remoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >(
        {
            await: () => [this.mutationData, this.uncalledMutationData],
            invoke: async () =>
                await fetchVariantAnnotationsIndexedByGenomicLocation(
                    concatMutationData(
                        this.mutationData,
                        this.uncalledMutationData
                    ),
                    ['annotation_summary', 'hotspots'],
                    AppConfig.serverConfig.isoformOverrideSource,
                    this.genomeNexusClient
                ),
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        undefined
    );

    readonly indexedMyVariantInfoAnnotations = remoteData<
        IMyVariantInfoIndex | undefined
    >({
        await: () => [this.mutationData, this.uncalledMutationData],
        invoke: async () => {
            const indexedVariantAnnotations = await fetchVariantAnnotationsIndexedByGenomicLocation(
                concatMutationData(
                    this.mutationData,
                    this.uncalledMutationData
                ),
                ['my_variant_info'],
                AppConfig.serverConfig.isoformOverrideSource,
                this.genomeNexusClient
            );
            return getMyVariantInfoAnnotationsFromIndexedVariantAnnotations(
                indexedVariantAnnotations
            );
        },
        onError: () => {
            // fail silently, leave the error handling responsibility to the data consumer
        },
    });

    readonly hotspotData = remoteData({
        await: () => [this.mutationData, this.uncalledMutationData],
        invoke: async () => {
            return fetchHotspotsData(
                this.mutationData,
                this.uncalledMutationData,
                this.genomeNexusInternalClient
            );
        },
        onError: () => {
            // fail silently
        },
    });

    readonly clinicalDataForSamples = remoteData(
        {
            await: () => [this.samples],
            invoke: () => {
                const identifiers = this.sampleIds.map((sampleId: string) => ({
                    entityId: sampleId,
                    studyId: this.studyId,
                }));
                const clinicalDataMultiStudyFilter = {
                    identifiers,
                } as ClinicalDataMultiStudyFilter;
                return fetchClinicalData(clinicalDataMultiStudyFilter);
            },
        },
        []
    );

    readonly clinicalDataGroupedBySample = remoteData(
        {
            await: () => [this.clinicalDataForSamples],
            invoke: async () =>
                groupBySampleId(
                    this.sampleIds,
                    this.clinicalDataForSamples.result
                ),
        },
        []
    );

    readonly clinicalDataGroupedBySampleMap = remoteData(
        {
            await: () => [this.clinicalDataGroupedBySample],
            invoke: async () => {
                return mapSampleIdToClinicalData(
                    this.clinicalDataGroupedBySample.result
                );
            },
        },
        {}
    );

    readonly getWholeSlideViewerIds = remoteData({
        await: () => [this.clinicalDataGroupedBySample],
        invoke: () => {
            const clinicalData = this.clinicalDataGroupedBySample.result!;
            const clinicalAttributeId = 'MSK_SLIDE_ID';
            if (clinicalData) {
                const ids = _.chain(clinicalData)
                    .map(data => data.clinicalData)
                    .flatten()
                    .filter(attribute => {
                        return (
                            attribute.clinicalAttributeId ===
                            clinicalAttributeId
                        );
                    })
                    .map(attribute => attribute.value)
                    .value();

                return Promise.resolve(ids);
            }
            return Promise.resolve([]);
        },
    });

    readonly studyMetaData = remoteData({
        invoke: async () => client.getStudyUsingGET({ studyId: this.studyId }),
    });

    readonly patientViewData = remoteData<ClinicalInformationData>(
        {
            await: () => [
                this.clinicalDataPatient,
                this.clinicalDataForSamples,
            ],
            invoke: async () =>
                transformClinicalInformationToStoreShape(
                    this.patientId,
                    this.studyId,
                    this.sampleIds,
                    this.clinicalDataPatient.result,
                    this.clinicalDataForSamples.result
                ),
        },
        {}
    );

    readonly sequencedSampleIdsInStudy = remoteData(
        {
            invoke: async () => {
                return stringListToSet(
                    await client.getAllSampleIdsInSampleListUsingGET({
                        sampleListId: `${this.studyId}_sequenced`,
                    })
                );
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        {}
    );

    readonly molecularProfilesInStudy = remoteData(() => {
        return client.getAllMolecularProfilesInStudyUsingGET({
            studyId: this.studyId,
        });
    }, []);

    readonly molecularProfileIdToMolecularProfile = remoteData<{
        [molecularProfileId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.molecularProfilesInStudy],
            invoke: () => {
                return Promise.resolve(
                    this.molecularProfilesInStudy.result.reduce(
                        (
                            map: {
                                [molecularProfileId: string]: MolecularProfile;
                            },
                            next: MolecularProfile
                        ) => {
                            map[next.molecularProfileId] = next;
                            return map;
                        },
                        {}
                    )
                );
            },
        },
        {}
    );

    readonly referenceGenes = remoteData<ReferenceGenomeGene[]>({
        await: () => [this.studies, this.discreteCNAData],
        invoke: async () => {
            return fetchReferenceGenomeGenes(
                this.studies.result[0].referenceGenome,
                this.discreteCNAData.result.map((d: DiscreteCopyNumberData) =>
                    d.gene.hugoGeneSymbol.toUpperCase()
                )
            );
        },
        onError: err => {
            // throwing this allows sentry to report it
            throw err;
        },
    });

    public readonly mrnaRankMolecularProfileId = remoteData(
        {
            await: () => [this.molecularProfilesInStudy],
            invoke: async () =>
                findMrnaRankMolecularProfileId(this.molecularProfilesInStudy),
        },
        null
    );

    readonly discreteCNAData = remoteData<DiscreteCopyNumberData[]>(
        {
            await: () => [this.molecularProfileIdDiscrete, this.samples],
            invoke: async () => {
                const filter = {
                    sampleIds: this.sampleIds,
                } as DiscreteCopyNumberFilter;
                return fetchDiscreteCNAData(
                    filter,
                    this.molecularProfileIdDiscrete
                );
            },
            onResult: (result: DiscreteCopyNumberData[]) => {
                // We want to take advantage of this loaded data, and not redownload the same data
                //  for users of the cache
                this.discreteCNACache.addData(result);
            },
        },
        []
    );

    readonly molecularData = remoteData<NumericGeneMolecularData[]>(
        {
            await: () => [this.discreteCNAData],
            invoke: () =>
                Promise.resolve(
                    this.discreteCNAData.result!.map(d => ({
                        ...d,
                        value: d.alteration,
                    }))
                ),
        },
        []
    );

    @computed get mergedDiscreteCNAData(): DiscreteCopyNumberData[][] {
        return mergeDiscreteCNAData(this.discreteCNAData);
    }

    readonly gisticData = remoteData<IGisticData>(
        {
            invoke: async () => fetchGisticData(this.studyId),
        },
        {}
    );

    readonly clinicalEvents = remoteData(
        {
            await: () => [this.patientViewData],
            invoke: async () => {
                return await client.getAllClinicalEventsOfPatientInStudyUsingGET(
                    {
                        studyId: this.studyId,
                        patientId: this.patientId,
                        projection: 'DETAILED',
                    }
                );
            },
        },
        []
    );

    readonly molecularProfileIdDiscrete = remoteData({
        await: () => [this.molecularProfilesInStudy],
        invoke: async () => {
            return findMolecularProfileIdDiscrete(
                this.molecularProfilesInStudy
            );
        },
    });

    readonly studyToMolecularProfileDiscrete = remoteData(
        {
            await: () => [this.molecularProfileIdDiscrete],
            invoke: async () => {
                // we just need it in this form for input to DiscreteCNACache
                const ret: { [studyId: string]: MolecularProfile } = {};
                if (this.molecularProfileIdDiscrete.result) {
                    ret[
                        this.studyId
                    ] = await client.getMolecularProfileUsingGET({
                        molecularProfileId: this.molecularProfileIdDiscrete
                            .result,
                    });
                }
                return ret;
            },
        },
        {}
    );

    readonly darwinUrl = remoteData({
        await: () => [this.derivedPatientId],
        invoke: async () => {
            if (AppConfig.serverConfig.enable_darwin === true) {
                let resp = await request.get(
                    getDarwinUrl(this.sampleIds, this.patientId)
                );
                return resp.text;
            } else {
                return '';
            }
        },
        onError: () => {
            // fail silently
        },
    });

    readonly hasTissueImageIFrameUrl = remoteData(
        {
            await: () => [this.derivedPatientId],
            invoke: async () => {
                return checkForTissueImage(this.patientId);
            },
            onError: () => {
                // fail silently
            },
        },
        false
    );

    readonly uncalledMutationData = remoteData(
        {
            await: () => [
                this.samples,
                this.uncalledMutationMolecularProfileId,
            ],
            invoke: async () => {
                const mutationFilter = {
                    sampleIds: this.samples.result.map(
                        (sample: Sample) => sample.sampleId
                    ),
                } as MutationFilter;

                return fetchMutationData(
                    mutationFilter,
                    this.uncalledMutationMolecularProfileId.result
                );
            },
        },
        []
    );

    readonly coverageInformation = remoteData<CoverageInformation>(
        {
            await: () => [
                this.mutatedGenes,
                this.samplesWithUniqueKeys,
                this.molecularProfilesInStudy,
            ],
            invoke: () =>
                getCoverageInformation(
                    this.samplesWithUniqueKeys,
                    this.mutatedGenes,
                    () => this.molecularProfilesInStudy.result!,
                    () => [
                        {
                            uniquePatientKey: this.samplesWithUniqueKeys
                                .result![0].uniquePatientKey,
                        },
                    ]
                ),
        },
        { samples: {}, patients: {} }
    );

    readonly mutationData = remoteData<Mutation[]>(
        {
            await: () => [this.samples, this.mutationMolecularProfileId],
            invoke: async () => {
                const mutationFilter = {
                    sampleIds: this.sampleIds,
                } as MutationFilter;

                return fetchMutationData(
                    mutationFilter,
                    this.mutationMolecularProfileId.result
                );
            },
        },
        []
    );

    readonly mutatedGenes = remoteData({
        await: () => [this.mutationData],
        invoke: () => {
            return Promise.resolve(
                _.uniqBy(this.mutationData.result!, d => d.entrezGeneId).map(
                    m => ({
                        hugoGeneSymbol: m.gene.hugoGeneSymbol,
                        entrezGeneId: m.entrezGeneId,
                    })
                )
            );
        },
    });

    readonly oncoKbCancerGenes = remoteData(
        {
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return fetchOncoKbCancerGenes();
                } else {
                    return Promise.resolve([]);
                }
            },
        },
        []
    );

    readonly oncoKbInfo = remoteData(
        {
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return fetchOncoKbInfo();
                } else {
                    return Promise.resolve(ONCOKB_DEFAULT_INFO);
                }
            },
        },
        ONCOKB_DEFAULT_INFO
    );

    @computed get usingPublicOncoKbInstance() {
        return this.oncoKbInfo.result
            ? this.oncoKbInfo.result.publicInstance
            : USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB;
    }

    readonly oncoKbAnnotatedGenes = remoteData(
        {
            await: () => [this.oncoKbCancerGenes],
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return Promise.resolve(
                        _.reduce(
                            this.oncoKbCancerGenes.result,
                            (
                                map: { [entrezGeneId: number]: boolean },
                                next: CancerGene
                            ) => {
                                if (next.oncokbAnnotated) {
                                    map[next.entrezGeneId] = true;
                                }
                                return map;
                            },
                            {}
                        )
                    );
                } else {
                    return Promise.resolve({});
                }
            },
        },
        {}
    );

    readonly oncoKbData = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.oncoKbAnnotatedGenes,
                this.mutationData,
                this.uncalledMutationData,
                this.clinicalDataForSamples,
                this.studiesForSamplesWithoutCancerTypeClinicalData,
                this.studies,
            ],
            invoke: () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return fetchOncoKbData(
                        this.uniqueSampleKeyToTumorType,
                        this.oncoKbAnnotatedGenes.result || {},
                        this.mutationData,
                        undefined,
                        this.uncalledMutationData
                    );
                } else {
                    return Promise.resolve({
                        indicatorMap: null,
                        uniqueSampleKeyToTumorType: null,
                    });
                }
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT
    );

    readonly civicGenes = remoteData<ICivicGene | undefined>(
        {
            await: () => [
                this.mutationData,
                this.uncalledMutationData,
                this.clinicalDataForSamples,
            ],
            invoke: async () =>
                AppConfig.serverConfig.show_civic
                    ? fetchCivicGenes(
                          this.mutationData,
                          this.uncalledMutationData
                      )
                    : {},
            onError: (err: Error) => {
                // fail silently
            },
        },
        undefined
    );

    readonly civicVariants = remoteData<ICivicVariant | undefined>(
        {
            await: () => [
                this.civicGenes,
                this.mutationData,
                this.uncalledMutationData,
            ],
            invoke: async () => {
                if (
                    AppConfig.serverConfig.show_civic &&
                    this.civicGenes.result
                ) {
                    return fetchCivicVariants(
                        this.civicGenes.result as ICivicGene,
                        this.mutationData,
                        this.uncalledMutationData
                    );
                } else {
                    return {};
                }
            },
            onError: (err: Error) => {
                // fail silently
            },
        },
        undefined
    );

    readonly cnaOncoKbData = remoteData<IOncoKbData>(
        {
            await: () => [
                this.oncoKbAnnotatedGenes,
                this.discreteCNAData,
                this.clinicalDataForSamples,
                this.studies,
            ],
            invoke: async () => {
                if (AppConfig.serverConfig.show_oncokb) {
                    return fetchCnaOncoKbData(
                        this.uniqueSampleKeyToTumorType,
                        this.oncoKbAnnotatedGenes.result || {},
                        this.discreteCNAData
                    );
                } else {
                    return ONCOKB_DEFAULT;
                }
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT
    );

    readonly cnaCivicGenes = remoteData<ICivicGene | undefined>(
        {
            await: () => [this.discreteCNAData, this.clinicalDataForSamples],
            invoke: async () =>
                AppConfig.serverConfig.show_civic
                    ? fetchCnaCivicGenes(this.discreteCNAData)
                    : {},
            onError: (err: Error) => {
                // fail silently
            },
        },
        undefined
    );

    readonly cnaCivicVariants = remoteData<ICivicVariant | undefined>(
        {
            await: () => [this.civicGenes, this.mutationData],
            invoke: async () => {
                if (this.cnaCivicGenes.status == 'complete') {
                    return fetchCivicVariants(
                        this.cnaCivicGenes.result as ICivicGene
                    );
                }
            },
            onError: (err: Error) => {
                // fail silently
            },
        },
        undefined
    );

    readonly copyNumberCountData = remoteData<CopyNumberCount[]>(
        {
            await: () => [this.discreteCNAData],
            invoke: async () =>
                fetchCopyNumberData(
                    this.discreteCNAData,
                    this.molecularProfileIdDiscrete
                ),
        },
        []
    );

    @computed get sampleIds(): string[] {
        if (this.samples.result) {
            return this.samples.result.map(sample => sample.sampleId);
        }

        return [];
    }

    readonly indexedHotspotData = remoteData<IHotspotIndex | undefined>({
        await: () => [this.hotspotData],
        invoke: () => Promise.resolve(indexHotspotsData(this.hotspotData)),
    });

    readonly sampleToMutationGenePanelData = remoteData<{
        [sampleId: string]: GenePanelData;
    }>(
        {
            await: () => [this.mutationMolecularProfileId, this.samples],
            invoke: async () => {
                if (this.mutationMolecularProfileId.result) {
                    return fetchGenePanelData(
                        this.mutationMolecularProfileId.result,
                        this.sampleIds
                    );
                }
                return {};
            },
        },
        {}
    );

    readonly sampleToMutationGenePanelId = remoteData<{
        [sampleId: string]: string;
    }>(
        {
            await: () => [this.sampleToMutationGenePanelData],
            invoke: async () => {
                return _.mapValues(
                    this.sampleToMutationGenePanelData.result,
                    genePanelData => genePanelData.genePanelId
                );
            },
        },
        {}
    );

    readonly sampleToDiscreteGenePanelData = remoteData<{
        [sampleId: string]: GenePanelData;
    }>(
        {
            await: () => [this.molecularProfileIdDiscrete, this.samples],
            invoke: async () => {
                if (this.molecularProfileIdDiscrete.result) {
                    return fetchGenePanelData(
                        this.molecularProfileIdDiscrete.result,
                        this.sampleIds
                    );
                }
                return {};
            },
        },
        {}
    );

    readonly sampleToDiscreteGenePanelId = remoteData<{
        [sampleId: string]: string;
    }>(
        {
            await: () => [this.sampleToDiscreteGenePanelData],
            invoke: async () => {
                return _.mapValues(
                    this.sampleToDiscreteGenePanelData.result,
                    genePanelData => genePanelData.genePanelId
                );
            },
        },
        {}
    );

    readonly genePanelIdToPanel = remoteData<{
        [genePanelId: string]: GenePanel;
    }>(
        {
            await: () => [
                this.sampleToMutationGenePanelData,
                this.sampleToDiscreteGenePanelData,
            ],
            invoke: async () => {
                const sampleGenePanelInfo = _.concat(
                    _.values(this.sampleToMutationGenePanelData.result),
                    _.values(this.sampleToDiscreteGenePanelData.result)
                );
                const panelIds = _(sampleGenePanelInfo)
                    .map(genePanelData => genePanelData.genePanelId)
                    .filter(genePanelId => !noGenePanelUsed(genePanelId))
                    .value();
                return fetchGenePanel(panelIds);
            },
        },
        {}
    );

    readonly genePanelIdToEntrezGeneIds = remoteData<{
        [genePanelId: string]: number[];
    }>(
        {
            await: () => [this.genePanelIdToPanel],
            invoke: async () => {
                return _(this.genePanelIdToPanel.result)
                    .mapValues(genePanel =>
                        _.map(
                            genePanel.genes,
                            genePanelToGene => genePanelToGene.entrezGeneId
                        )
                    )
                    .value();
            },
        },
        {}
    );

    @computed get mergedMutationData(): Mutation[][] {
        return mergeMutations(this.mutationData);
    }

    @computed get mergedMutationDataIncludingUncalled(): Mutation[][] {
        return mergeMutationsIncludingUncalled(
            this.mutationData,
            this.uncalledMutationData
        );
    }

    @computed
    get annotatedExtendedAlterationData(): AnnotatedExtendedAlteration[] {
        const filteredAndAnnotatedMutations = filterAndAnnotateMutations(
            _.flatten(this.mergedMutationDataIncludingUncalledFilteredByGene),
            this.getPutativeDriverInfo.result!,
            this.entrezGeneIdToGene.result!
        );

        const mutationData = [
            ...filteredAndAnnotatedMutations.data,
            ...filteredAndAnnotatedMutations.vusAndGermline,
            ...filteredAndAnnotatedMutations.vus,
            ...filteredAndAnnotatedMutations.germline,
        ];

        const filteredAndAnnotatedMolecularData = filterAndAnnotateMolecularData(
            _.flatten(this.mergedDiscreteCNADataFilteredByGene).map(d => ({
                ...d,
                value: d.alteration,
            })),
            this.entrezGeneIdToGene,
            this.getOncoKbCnaAnnotationForOncoprint,
            this.molecularProfileIdToMolecularProfile
        );

        const cnaData = [
            ...filteredAndAnnotatedMolecularData.data,
            ...filteredAndAnnotatedMolecularData.vus,
        ];

        const annotatedExtendedCnaData = cnaData.map(molecularData => ({
            ...molecularData,
            molecularProfileAlterationType: this.discreteMolecularProfile
                .result!.molecularAlterationType,
            alterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
            alterationSubType: cna_profile_data_to_string[molecularData.value],
        })) as AnnotatedExtendedAlteration[];

        const annotatedExtendedMutations = mutationData.map(
            extendedAlteration => {
                const alterationType =
                    getSimplifiedMutationType(
                        extendedAlteration.mutationType
                    ) === 'fusion'
                        ? AlterationTypeConstants.FUSION
                        : AlterationTypeConstants.MUTATION_EXTENDED;

                return {
                    ...extendedAlteration,
                    molecularProfileAlterationType: this
                        .mutationMolecularProfile.result!
                        .molecularAlterationType,
                    alterationType: alterationType,
                    alterationSubType:
                        getMutationSubType(extendedAlteration) || '',
                    value: 0,
                };
            }
        );

        return [...annotatedExtendedMutations, ...annotatedExtendedCnaData];
    }

    @computed get caseAggregatedAlterationDataGroupedByGene(): {
        [geneSymbol: string]: {
            samples: {
                [uniqueSampleKey: string]: AnnotatedExtendedAlteration[];
            };
        };
    } {
        const groupedByGene = _.groupBy(
            this.annotatedExtendedAlterationData,
            alteration => alteration.hugoGeneSymbol
        );
        return _.mapValues(groupedByGene, alterations => ({
            samples: _.groupBy(alterations, a => a.uniqueSampleKey),
        }));
    }

    @computed get mergedMutationDataFilteredByGene(): Mutation[][] {
        if (
            this.mutationTableGeneFilterOption === GeneFilterOption.ALL_SAMPLES
        ) {
            return filterMutationsByProfiledGene(
                this.mergedMutationData,
                this.sampleIds,
                this.sampleToMutationGenePanelId.result,
                this.genePanelIdToEntrezGeneIds.result
            );
        }
        return this.mergedMutationData;
    }

    @computed
    get mergedMutationDataIncludingUncalledFilteredByGene(): Mutation[][] {
        if (
            this.mutationTableGeneFilterOption === GeneFilterOption.ALL_SAMPLES
        ) {
            return filterMutationsByProfiledGene(
                this.mergedMutationDataIncludingUncalled,
                this.sampleIds,
                this.sampleToMutationGenePanelId.result,
                this.genePanelIdToEntrezGeneIds.result
            );
        }
        return this.mergedMutationDataIncludingUncalled;
    }

    @computed
    get mergedDiscreteCNADataFilteredByGene(): DiscreteCopyNumberData[][] {
        if (
            this.copyNumberTableGeneFilterOption ===
            GeneFilterOption.ALL_SAMPLES
        ) {
            return _.filter(
                this.mergedDiscreteCNAData,
                (mutations: DiscreteCopyNumberData[]) => {
                    const entrezGeneId = mutations[0].gene.entrezGeneId;
                    const geneProfiledInSamples = TumorColumnFormatter.getProfiledSamplesForGene(
                        entrezGeneId,
                        this.sampleIds,
                        this.sampleToMutationGenePanelId.result,
                        this.genePanelIdToEntrezGeneIds.result
                    );
                    return (
                        _(geneProfiledInSamples)
                            .values()
                            .filter((profiled: boolean) => profiled)
                            .value().length === this.sampleIds.length
                    );
                }
            );
        }
        return this.mergedDiscreteCNAData;
    }

    @computed get existsSomeMutationWithVAFData() {
        return _.some(
            this.mergedMutationDataIncludingUncalled,
            mutationList => {
                return _.some(mutationList, m => {
                    const vaf = getVariantAlleleFrequency(m);
                    return vaf != null && vaf > 0;
                });
            }
        );
    }

    @computed get existsSomeMutationWithAscnProperty(): {
        [property: string]: boolean;
    } {
        return existsSomeMutationWithAscnPropertyInCollection(
            this.mergedMutationDataIncludingUncalled
        );
    }

    readonly mutationTableShowGeneFilterMenu = remoteData({
        await: () => [
            this.samples,
            this.sampleToMutationGenePanelId,
            this.genePanelIdToEntrezGeneIds,
        ],
        invoke: () => {
            const entrezGeneIds: number[] = _.uniq(
                _.map(
                    this.mergedMutationDataIncludingUncalled,
                    mutations => mutations[0].entrezGeneId
                )
            );
            const sampleIds = this.samples.result!.map(s => s.sampleId);
            return Promise.resolve(
                sampleIds.length > 1 &&
                    checkNonProfiledGenesExist(
                        sampleIds,
                        entrezGeneIds,
                        this.sampleToMutationGenePanelId.result,
                        this.genePanelIdToEntrezGeneIds.result
                    )
            );
        },
    });

    readonly cnaTableShowGeneFilterMenu = remoteData({
        await: () => [
            this.samples,
            this.sampleToMutationGenePanelId,
            this.genePanelIdToEntrezGeneIds,
        ],
        invoke: () => {
            const entrezGeneIds: number[] = _.uniq(
                _.map(
                    this.mergedDiscreteCNAData,
                    alterations => alterations[0].entrezGeneId
                )
            );
            const sampleIds = this.samples.result!.map(s => s.sampleId);
            return Promise.resolve(
                sampleIds.length > 1 &&
                    checkNonProfiledGenesExist(
                        sampleIds,
                        entrezGeneIds,
                        this.sampleToMutationGenePanelId.result,
                        this.genePanelIdToEntrezGeneIds.result
                    )
            );
        },
    });

    @computed get uniqueSampleKeyToTumorType(): { [sampleId: string]: string } {
        return generateUniqueSampleKeyToTumorTypeMap(
            this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData,
            this.samplesWithoutCancerTypeClinicalData
        );
    }

    @action('SetSampleId') setSampleId(newId: string) {
        if (newId) this._patientId = '';
        this._sampleId = newId;
    }

    @action('SetPatientId') setPatientId(newId: string) {
        if (newId) this._sampleId = '';
        this._patientId = newId;
    }

    @cached get mrnaExprRankCache() {
        return new MrnaExprRankCache(this.mrnaRankMolecularProfileId.result);
    }

    @cached get variantCountCache() {
        return new VariantCountCache(this.mutationMolecularProfileId.result);
    }

    @cached get discreteCNACache() {
        return new DiscreteCNACache(
            this.studyToMolecularProfileDiscrete.result
        );
    }

    @cached get genomeNexusCache() {
        return new GenomeNexusCache(
            createVariantAnnotationsByMutationFetcher(
                ['annotation_summary'],
                this.genomeNexusClient
            )
        );
    }

    @cached get genomeNexusMutationAssessorCache() {
        return new GenomeNexusMutationAssessorCache(
            createVariantAnnotationsByMutationFetcher(
                ['annotation_summary', 'mutation_assessor'],
                this.genomeNexusClient
            )
        );
    }

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get copyNumberCountCache() {
        return new CopyNumberCountCache(this.molecularProfileIdDiscrete.result);
    }

    @cached get cancerTypeCache() {
        return new CancerTypeCache();
    }

    @cached get mutationCountCache() {
        return new MutationCountCache();
    }

    @cached get downloadDataFetcher() {
        return new MutationTableDownloadDataFetcher(this.mutationData);
    }

    @action setActiveTabId(id: string) {
        this.activeTabId = id;
    }

    @action clearErrors() {
        this.ajaxErrors = [];
    }

    readonly trialMatches = remoteData<ITrialMatch[]>(
        {
            invoke: () => {
                return fetchTrialMatchesUsingPOST({ mrn: this.patientId });
            },
        },
        []
    );

    readonly trialIds = remoteData<ITrialQuery>(
        {
            await: () => [this.trialMatches],
            invoke: async () => {
                let nctIds = new Set<string>(); // Trial unique id from clinicaltrials.gov
                let protocolNos = new Set<string>(); // Trials's MSK ID same as protocol_number or protocol_id
                _.forEach(
                    this.trialMatches.result,
                    (trialMatch: ITrialMatch) => {
                        if (_.isEmpty(trialMatch.protocolNo)) {
                            nctIds.add(trialMatch.nctId);
                        } else {
                            protocolNos.add(trialMatch.protocolNo);
                        }
                    }
                );
                return {
                    nct_id: [...nctIds],
                    protocol_no: [...protocolNos],
                };
            },
        },
        {
            nct_id: [],
            protocol_no: [],
        }
    );

    readonly trials = remoteData<ITrial[]>(
        {
            await: () => [this.trialIds],
            invoke: async () => {
                if (
                    this.trialIds.result.protocol_no.length > 0 ||
                    this.trialIds.result.nct_id.length > 0
                ) {
                    return fetchTrialsById(this.trialIds.result);
                }
                return [];
            },
        },
        []
    );

    readonly detailedTrialMatches = remoteData<IDetailedTrialMatch[]>(
        {
            await: () => [this.trials, this.trialMatches],
            invoke: async () => {
                if (this.trials.result && this.trialMatches.result) {
                    return groupTrialMatchesById(
                        this.trials.result,
                        this.trialMatches.result
                    );
                }
                return [];
            },
        },
        []
    );

    readonly oncoKbDataForOncoprint = remoteData<IOncoKbData | Error>(
        {
            await: () => [this.mutationData, this.oncoKbAnnotatedGenes],
            invoke: async () =>
                fetchOncoKbDataForOncoprint(
                    this.oncoKbAnnotatedGenes,
                    this.mutationData
                ),
        },
        ONCOKB_DEFAULT
    );

    readonly cnaOncoKbDataForOncoprint = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.oncoKbAnnotatedGenes,
                this.molecularData,
                this.molecularProfileIdToMolecularProfile,
            ],
            invoke: async () =>
                fetchCnaOncoKbDataForOncoprint(
                    this.oncoKbAnnotatedGenes,
                    this.molecularData,
                    this.molecularProfileIdToMolecularProfile
                ),
        },
        ONCOKB_DEFAULT
    );

    readonly getPutativeDriverInfo = remoteData({
        await: () => [
            this.getOncoKbMutationAnnotationForOncoprint,
            this.isHotspotForOncoprint,
        ],
        invoke: () => {
            return Promise.resolve((mutation: Mutation): {
                oncoKb: string;
                hotspots: boolean;
                cbioportalCount: boolean;
                cosmicCount: boolean;
                customDriverBinary: boolean;
                customDriverTier?: string;
            } => {
                const getOncoKbMutationAnnotationForOncoprint = this
                    .getOncoKbMutationAnnotationForOncoprint.result!;
                const oncoKbDatum:
                    | IndicatorQueryResp
                    | undefined
                    | null
                    | false =
                    getOncoKbMutationAnnotationForOncoprint &&
                    !(
                        getOncoKbMutationAnnotationForOncoprint instanceof Error
                    ) &&
                    getOncoKbMutationAnnotationForOncoprint(mutation);

                let oncoKb: string = '';
                if (oncoKbDatum) {
                    oncoKb = getOncoKbOncogenic(oncoKbDatum);
                }

                const hotspots: boolean =
                    !(this.isHotspotForOncoprint.result instanceof Error) &&
                    this.isHotspotForOncoprint.result!(mutation);

                return {
                    oncoKb,
                    hotspots,
                    // TODO support these too?
                    cbioportalCount: false,
                    cosmicCount: false,
                    customDriverBinary: false,
                };
            });
        },
    });

    readonly getOncoKbMutationAnnotationForOncoprint = remoteData<
        Error | ((mutation: Mutation) => IndicatorQueryResp | undefined)
    >({
        await: () => [this.oncoKbDataForOncoprint],
        invoke: () =>
            makeGetOncoKbMutationAnnotationForOncoprint(
                this.oncoKbDataForOncoprint
            ),
    });

    readonly getOncoKbCnaAnnotationForOncoprint = remoteData<
        | Error
        | ((data: NumericGeneMolecularData) => IndicatorQueryResp | undefined)
    >({
        await: () => [this.cnaOncoKbDataForOncoprint],
        invoke: () =>
            makeGetOncoKbCnaAnnotationForOncoprint(
                this.cnaOncoKbDataForOncoprint,
                // this.driverAnnotationSettings.oncoKb
                true
            ),
    });

    public readonly isHotspotForOncoprint = remoteData<
        ((m: Mutation) => boolean) | Error
    >({
        await: () => [this.indexedHotspotData],
        invoke: () => makeIsHotspotForOncoprint(this.indexedHotspotData),
    });

    readonly entrezGeneIdToGene = remoteData<{
        [entrezGeneId: number]: {
            hugoGeneSymbol: string;
            entrezGeneId: number;
        };
    }>({
        await: () => [this.mutatedGenes, this.referenceGenes],
        invoke: () =>
            Promise.resolve(
                _.keyBy(
                    [
                        ...this.mutatedGenes.result!,
                        ...this.referenceGenes.result!,
                    ],
                    gene => gene.entrezGeneId
                )
            ),
    });

    readonly geneticTrackData = remoteData<{
        [hugoSymbol: string]: GeneticTrackDatum[];
    }>({
        await: () => [
            this.mutationData,
            this.discreteCNAData,
            this.samplesWithUniqueKeys,
            this.molecularProfileIdDiscrete,
            this.mutationMolecularProfile,
            this.discreteMolecularProfile,
            this.coverageInformation,
            this.getPutativeDriverInfo,
            this.entrezGeneIdToGene,
            this.getOncoKbCnaAnnotationForOncoprint,
        ],
        invoke: () =>
            Promise.resolve(
                _.mapValues(
                    this.caseAggregatedAlterationDataGroupedByGene,
                    data =>
                        makeGeneticTrackData(
                            data.samples,
                            _.values(data.samples)[0][0].hugoGeneSymbol, // TODO get this from the caseAggregatedAlterationDataGroupedByGene keys!
                            this.samplesWithUniqueKeys.result,
                            this.coverageInformation.result!,
                            // remove undefined values (certain molecular profiles might be missing)
                            _.compact([
                                this.mutationMolecularProfile.result!,
                                this.discreteMolecularProfile.result!,
                            ])
                        )
                )
            ),
    });

    @computed get referenceGenomeBuild() {
        if (!this.studies.isComplete) {
            throw new Error('Failed to get studies');
        }
        return getGenomeNexusUrl(this.studies.result);
    }

    @autobind
    generateGenomeNexusHgvsgUrl(hgvsg: string) {
        return getGenomeNexusHgvsgUrl(hgvsg, this.referenceGenomeBuild);
    }

    @computed get genomeNexusClient() {
        return new GenomeNexusAPI(this.referenceGenomeBuild);
    }

    @computed get genomeNexusInternalClient() {
        return new ExtendedGenomeNexusAPIInternal(this.referenceGenomeBuild);
    }
}
