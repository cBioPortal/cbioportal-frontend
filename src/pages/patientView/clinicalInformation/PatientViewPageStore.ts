import * as _ from 'lodash';
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import {
    ClinicalData, GeneticProfile, Sample, Mutation, DiscreteCopyNumberFilter, DiscreteCopyNumberData, MutationFilter,
    CopyNumberCount, ClinicalDataMultiStudyFilter
} from "../../../shared/api/generated/CBioPortalAPI";
import client from "../../../shared/api/cbioportalClientInstance";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";
import {
    Gistic, GisticToGene, default as CBioPortalAPIInternal, MutSig
} from "shared/api/generated/CBioPortalAPIInternal";
import {computed, observable, action} from "mobx";
import {remoteData, addErrorHandler} from "../../../shared/api/remoteData";
import {IGisticData} from "shared/model/Gistic";
import {labelMobxPromises, cached} from "mobxpromise";
import MrnaExprRankCache from 'shared/cache/MrnaExprRankCache';
import request from 'superagent';
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import {getTissueImageCheckUrl, getDarwinUrl} from "../../../shared/api/urls";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import {IOncoKbData} from "shared/model/OncoKB";
import {IHotspotData} from "shared/model/CancerHotspots";
import {IMutSigData} from "shared/model/MutSig";
import {ICivicVariant, ICivicGene} from "shared/model/Civic.ts";
import {ClinicalInformationData} from "shared/model/ClinicalInformation";
import VariantCountCache from "shared/cache/VariantCountCache";
import CopyNumberCountCache from "./CopyNumberCountCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import AppConfig from "appConfig";
import {
    findGeneticProfileIdDiscrete, ONCOKB_DEFAULT, fetchOncoKbData, fetchCnaOncoKbData,
    indexHotspotData, mergeMutations, fetchHotspotsData, fetchMyCancerGenomeData, fetchCosmicData,
    fetchMutationData, fetchDiscreteCNAData, generateSampleIdToTumorTypeMap, findMutationGeneticProfileId,
    findUncalledMutationGeneticProfileId, mergeMutationsIncludingUncalled, fetchGisticData, fetchCopyNumberData,
    fetchMutSigData, findMrnaRankGeneticProfileId, mergeDiscreteCNAData, fetchSamplesForPatient, fetchClinicalData,
    fetchCopyNumberSegments, fetchClinicalDataForPatient, makeStudyToCancerTypeMap,
    fetchCivicGenes, fetchCnaCivicGenes, fetchCivicVariants, groupByEntityId, findSamplesWithoutCancerTypeClinicalData,
    fetchStudiesForSamplesWithoutCancerTypeClinicalData
} from "shared/lib/StoreUtils";
import {stringListToSet} from "../../../shared/lib/StringUtils";

type PageMode = 'patient' | 'sample';

export async function checkForTissueImage(patientId: string): Promise<boolean> {

    if (/TCGA/.test(patientId) === false) {
        return false;
    } else {

        let resp = await request.get(getTissueImageCheckUrl(patientId));

        let matches = resp.text.match(/<data total_count='([0-9]+)'>/);

        // if the count is greater than 0, there is a slide for this patient
        return ( (!!matches && parseInt(matches[1], 10)) > 0 );
    }

}

export type PathologyReportPDF = {

    name: string;
    url: string;

}

export function handlePathologyReportCheckResponse(patientId: string, resp: any): PathologyReportPDF[] {

    if (resp.total_count > 0) {
        // only use pdfs starting with the patient id to prevent mismatches
        const r = new RegExp("^" + patientId);
        const filteredItems:any = _.filter(resp.items, (item: any) => r.test(item.name));
        return _.map(filteredItems, (item: any) => ( {url: item.url, name: item.name} ));
    } else {
        return [];
    }

}

/*
 * Transform clinical data from API to clinical data shape as it will be stored
 * in the store
 */
function transformClinicalInformationToStoreShape(patientId: string, studyId: string, sampleIds: Array<string>, clinicalDataPatient: Array<ClinicalData>, clinicalDataSample: Array<ClinicalData>): ClinicalInformationData {
    const patient = {
        id: patientId,
        clinicalData: clinicalDataPatient
    };
    const samples = groupByEntityId(sampleIds, clinicalDataSample);
    const rv = {
        patient,
        samples
    };

    return rv;
}

export class PatientViewPageStore {
    constructor() {
        labelMobxPromises(this);

        this.internalClient = internalClient;

        addErrorHandler((error) => {
            this.ajaxErrors.push(error);
        });

    }

    public internalClient: CBioPortalAPIInternal;

    @observable public activeTabId = '';

    @observable private _patientId = '';
    @computed get patientId(): string {
        if (this._patientId)
            return this._patientId;

        return this.derivedPatientId.result;
    }

    @observable public urlValidationError: string | null = null;

    @observable ajaxErrors: Error[] = [];

    @observable studyId = '';

    @observable _sampleId = '';

    @computed get sampleId() {
        return this._sampleId;
    }

    @computed get pageTitle(): string {
            if (this.pageMode === 'patient') {
                return `Patient: ${this.patientId}`
            } else {
                return `Sample: ${this.sampleId}`
            }
    }

    @computed get pageMode(): PageMode {
        return this._sampleId ? 'sample' : 'patient';
    }

    @computed get caseId():string {
        return this.pageMode === 'sample' ? this.sampleId : this.patientId;
    }

    readonly mutationGeneticProfileId = remoteData({
        await: () => [
            this.geneticProfilesInStudy
        ],
        invoke: async() => findMutationGeneticProfileId(this.geneticProfilesInStudy, this.studyId)
    });

    readonly uncalledMutationGeneticProfileId = remoteData({
        await: () => [
            this.geneticProfilesInStudy
        ],
        invoke: async() => findUncalledMutationGeneticProfileId(this.geneticProfilesInStudy, this.studyId)
    });

    @observable patientIdsInCohort: string[] = [];

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    readonly derivedPatientId = remoteData<string>({
        await: () => [this.samples],
        invoke: async() => {
            for (let sample of this.samples.result)
                return sample.patientId;
            return '';
        },
        default: ''
    });

    readonly clinicalDataPatient = remoteData({
        await: () => this.pageMode === 'patient' ? [] : [this.derivedPatientId],
        invoke: async() => fetchClinicalDataForPatient(this.studyId, this.patientId),
        default: []
    });

    readonly samples = remoteData(
        async() => fetchSamplesForPatient(this.studyId, this._patientId, this.sampleId),
        []
    );

    readonly samplesWithoutCancerTypeClinicalData = remoteData({
        await: () => [
            this.samples,
            this.clinicalDataForSamples
        ],
        invoke: async () => findSamplesWithoutCancerTypeClinicalData(this.samples, this.clinicalDataForSamples)
    }, []);

    readonly studiesForSamplesWithoutCancerTypeClinicalData = remoteData({
        await: () => [
            this.samplesWithoutCancerTypeClinicalData
        ],
        invoke: async () => fetchStudiesForSamplesWithoutCancerTypeClinicalData(this.samplesWithoutCancerTypeClinicalData)
    }, []);

    readonly studies = remoteData({
        invoke: async()=>([await client.getStudyUsingGET({studyId: this.studyId})])
    }, []);

    @computed get studyToCancerType() {
        return makeStudyToCancerTypeMap(this.studies.result);
    }

    readonly cnaSegments = remoteData({
        await: () => [
            this.samples
        ],
        invoke: () => fetchCopyNumberSegments(this.studyId, this.sampleIds)
    }, []);

    readonly pathologyReport = remoteData({
        await: () => [this.derivedPatientId],
        invoke: async() => {

            let resp: any = await request.get(`https://api.github.com/search/code?q=${this.patientId}+extension:pdf+in:path+repo:cBioPortal/datahub`);

            const parsedResp: any = JSON.parse(resp.text);

            return handlePathologyReportCheckResponse(this.patientId, parsedResp);

        },
        onError: (err: Error) => {
            // fail silently
        }

    }, []);

    readonly cosmicData = remoteData({
        await: () => [
            this.mutationData,
            this.uncalledMutationData
        ],
        invoke: () => fetchCosmicData(this.mutationData, this.uncalledMutationData)
    });

    readonly mutSigData = remoteData({
        invoke: async () => fetchMutSigData(this.studyId)
    });

    readonly hotspotData = remoteData({
        await: ()=> [
            this.mutationData,
            this.uncalledMutationData,
        ],
        invoke: async () => {
            return fetchHotspotsData(this.mutationData, this.uncalledMutationData);
        },
        onError: () => {
            // fail silently
        }
    });


    readonly MDAndersonHeatMapAvailable = remoteData({
        await: () => [this.derivedPatientId],
        invoke: async() => {

            let resp: any = await request.get(`//bioinformatics.mdanderson.org/dyce?app=chmdb&command=participant2maps&participant=${this.patientId}`);

            const parsedResp: any = JSON.parse(resp.text);

            // filecontent array is serialized :(
            const fileContent: string[] = JSON.parse(parsedResp.fileContent);

            return fileContent.length > 0;

        },
        onError: () => {
            // fail silently
        }
    }, false);


    //
    readonly clinicalDataForSamples = remoteData({
        await: () => [
            this.samples
        ],
        invoke: () => {
            const identifiers = this.sampleIds.map((sampleId: string) => ({
                entityId: sampleId,
                studyId: this.studyId
            }));
            const clinicalDataMultiStudyFilter = {identifiers} as ClinicalDataMultiStudyFilter;
            return fetchClinicalData(clinicalDataMultiStudyFilter)
        }
    }, []);

    readonly clinicalDataGroupedBySample = remoteData({
        await: () => [this.clinicalDataForSamples],
        invoke: async() => groupByEntityId(this.sampleIds, this.clinicalDataForSamples.result)
    }, []);

    readonly studyMetaData = remoteData({
        invoke: async() => client.getStudyUsingGET({studyId: this.studyId})
    });

    readonly patientViewData = remoteData({
        await: () => [
            this.clinicalDataPatient,
            this.clinicalDataForSamples,
        ],
        invoke: async() => transformClinicalInformationToStoreShape(
            this.patientId,
            this.studyId,
            this.sampleIds,
            this.clinicalDataPatient.result,
            this.clinicalDataForSamples.result
        )
    }, {});

    readonly sequencedSampleIdsInStudy = remoteData(async() => {
        return stringListToSet(await client.getAllSampleIdsInSampleListUsingGET({sampleListId:`${this.studyId}_sequenced`}));
    }, {});

    readonly geneticProfilesInStudy = remoteData(() => {
        return client.getAllGeneticProfilesInStudyUsingGET({
            studyId: this.studyId
        })
    }, []);

    public readonly mrnaRankGeneticProfileId = remoteData({
        await: () => [
            this.geneticProfilesInStudy
        ],
        invoke: async() => findMrnaRankGeneticProfileId(this.geneticProfilesInStudy)
    }, null);

    readonly discreteCNAData = remoteData({

        await: () => [
            this.geneticProfileIdDiscrete,
            this.samples
        ],
        invoke: async() => {
            const filter = {sampleIds: this.sampleIds} as DiscreteCopyNumberFilter;
            return fetchDiscreteCNAData(filter, this.geneticProfileIdDiscrete);
        },
        onResult: (result:DiscreteCopyNumberData[])=>{
            // We want to take advantage of this loaded data, and not redownload the same data
            //  for users of the cache
            this.discreteCNACache.addData(result);
        }

    }, []);

    @computed get mergedDiscreteCNAData():DiscreteCopyNumberData[][] {
        return mergeDiscreteCNAData(this.discreteCNAData);
    }

    readonly gisticData = remoteData<IGisticData>({
        invoke: async() => fetchGisticData(this.studyId)
    }, {});

    readonly clinicalEvents = remoteData({

        await: () => [
            this.patientViewData
        ],
        invoke: async() => {

            return await client.getAllClinicalEventsOfPatientInStudyUsingGET({
                studyId: this.studyId, patientId: this.patientId, projection: 'DETAILED'
            })

        }

    }, []);

    readonly geneticProfileIdDiscrete = remoteData({
        await: () => [
            this.geneticProfilesInStudy
        ],
        invoke: async() => {
            return findGeneticProfileIdDiscrete(this.geneticProfilesInStudy);
        }
    });

    readonly darwinUrl = remoteData({
        await: () => [
            this.derivedPatientId
        ],
        invoke: async() => {
            let enableDarwin: boolean | null | undefined = AppConfig.enableDarwin;

            if (enableDarwin === true) {
                let resp = await request.get(getDarwinUrl(this.sampleIds, this.patientId));
                return resp.text;
            } else {
                return '';
            }
        },
        onError: () => {
            // fail silently
        }
    });


    readonly hasTissueImageIFrameUrl = remoteData({
        await: () => [
            this.derivedPatientId
        ],
        invoke: async() => {

            return checkForTissueImage(this.patientId);

        },
        onError: () => {
            // fail silently
        }
    }, false);

    readonly uncalledMutationData = remoteData({
        await: () => [
            this.samples,
            this.uncalledMutationGeneticProfileId
        ],
        invoke: async() => {
            const mutationFilter = {
                sampleIds: this.samples.result.map((sample: Sample) => sample.sampleId)
            } as MutationFilter;

            return fetchMutationData(mutationFilter, this.uncalledMutationGeneticProfileId.result);
        }
    }, []);

    readonly mutationData = remoteData({
        await: () => [
            this.samples,
            this.mutationGeneticProfileId
        ],
        invoke: async() => {
            const mutationFilter = {
                sampleIds: this.sampleIds
            } as MutationFilter;

            return fetchMutationData(mutationFilter, this.mutationGeneticProfileId.result);
        }
    }, []);


    readonly oncoKbData = remoteData<IOncoKbData>({
        await: () => [
            this.mutationData,
            this.uncalledMutationData,
            this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData,
            this.studies
        ],
        invoke: async() => fetchOncoKbData(this.sampleIdToTumorType, this.mutationData, this.uncalledMutationData),
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, ONCOKB_DEFAULT);

    readonly civicGenes = remoteData<ICivicGene | undefined>({
        await: () => [
            this.mutationData,
            this.uncalledMutationData,
            this.clinicalDataForSamples
        ],
        invoke: async() => AppConfig.showCivic ? fetchCivicGenes(this.mutationData, this.uncalledMutationData) : {}
    }, undefined);

    readonly civicVariants = remoteData<ICivicVariant | undefined>({
        await: () => [
            this.civicGenes,
            this.mutationData,
            this.uncalledMutationData
        ],
        invoke: async() => {
            if (AppConfig.showCivic && this.civicGenes.result) {
                return fetchCivicVariants(this.civicGenes.result as ICivicGene,
                    this.mutationData,
                    this.uncalledMutationData);
            }
            else {
                return {};
            }
       }
    }, undefined);

    readonly cnaOncoKbData = remoteData<IOncoKbData>({
        await: () => [
            this.discreteCNAData,
            this.clinicalDataForSamples,
            this.studies
        ],
        invoke: async() => fetchCnaOncoKbData(this.sampleIdToTumorType, this.discreteCNAData),
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, ONCOKB_DEFAULT);

    readonly cnaCivicGenes = remoteData<ICivicGene | undefined>({
        await: () => [
            this.discreteCNAData,
            this.clinicalDataForSamples
        ],
        invoke: async() => AppConfig.showCivic ? fetchCnaCivicGenes(this.discreteCNAData) : {}
    }, undefined);

    readonly cnaCivicVariants = remoteData<ICivicVariant | undefined>({
        await: () => [
            this.civicGenes,
            this.mutationData
        ],
        invoke: async() => {
            if (this.cnaCivicGenes.status == "complete") {
                return fetchCivicVariants(this.cnaCivicGenes.result as ICivicGene);
            }
       }
    }, undefined);

    readonly copyNumberCountData = remoteData<CopyNumberCount[]>({
        await: () => [
            this.discreteCNAData
        ],
        invoke: async() => fetchCopyNumberData(this.discreteCNAData, this.geneticProfileIdDiscrete)
    }, []);

    @computed get sampleIds(): string[]
    {
        if (this.samples.result) {
            return this.samples.result.map(sample => sample.sampleId);
        }

        return [];
    }

    @computed get indexedHotspotData(): IHotspotData|undefined
    {
        return indexHotspotData(this.hotspotData);
    }

    @computed get mergedMutationData(): Mutation[][] {
        return mergeMutations(this.mutationData);
    }

    @computed get mergedMutationDataIncludingUncalled(): Mutation[][] {
        return mergeMutationsIncludingUncalled(this.mutationData, this.uncalledMutationData);
    }

    @computed get sampleIdToTumorType(): {[sampleId: string]: string} {
        return generateSampleIdToTumorTypeMap(this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData,
            this.samplesWithoutCancerTypeClinicalData);
    }

    @action("SetSampleId") setSampleId(newId: string) {
        if (newId)
            this._patientId = '';
        this._sampleId = newId;
    }

    @action("SetPatientId") setPatientId(newId: string) {
        if (newId)
            this._sampleId = '';
        this._patientId = newId;
    }

    @cached get mrnaExprRankCache() {
        return new MrnaExprRankCache(this.mrnaRankGeneticProfileId.result);
    }

    @cached get variantCountCache() {
        return new VariantCountCache(this.mutationGeneticProfileId.result);
    }

    @cached get discreteCNACache() {
        return new DiscreteCNACache(this.geneticProfileIdDiscrete.result);
    }

    @cached get oncoKbEvidenceCache() {
        return new OncoKbEvidenceCache();
    }

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get copyNumberCountCache() {
        return new CopyNumberCountCache(this.geneticProfileIdDiscrete.result);
    }

    @cached get cancerTypeCache() {
        return new CancerTypeCache(this.studyId);
    }

    @cached get mutationCountCache() {
        return new MutationCountCache(this.mutationGeneticProfileId.result);
    }

    @action setActiveTabId(id: string) {
        this.activeTabId = id;
    }

    @action clearErrors() {
        this.ajaxErrors = [];
    }

}
