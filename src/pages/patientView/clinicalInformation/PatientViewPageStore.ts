import * as _ from 'lodash';
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import {
    ClinicalData, GeneticProfile, Sample, Mutation, DiscreteCopyNumberFilter, DiscreteCopyNumberData, MutationFilter
} from "../../../shared/api/generated/CBioPortalAPI";
import client from "../../../shared/api/cbioportalClientInstance";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";
import {
    CopyNumberCount, CopyNumberCountIdentifier, Gistic, GisticToGene, default as CBioPortalAPIInternal, MutSig
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
import PmidCache from "shared/cache/PmidCache";
import {IOncoKbData} from "shared/model/OncoKB";
import {IHotspotData} from "shared/model/CancerHotspots";
import {IMutSigData} from "shared/model/MutSig";
import {ClinicalInformationData} from "shared/model/ClinicalInformation";
import VariantCountCache from "shared/cache/VariantCountCache";
import CopyNumberCountCache from "./CopyNumberCountCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import {
    findGeneticProfileIdDiscrete, ONCOKB_DEFAULT, fetchOncoKbData, fetchCnaOncoKbData,
    indexHotspotData, mergeMutations, fetchHotspotsData, fetchMyCancerGenomeData, fetchCosmicData,
    fetchMutationData, fetchDiscreteCNAData, generateSampleIdToTumorTypeMap, findMutationGeneticProfileId,
    findUncalledMutationGeneticProfileId, mergeMutationsIncludingUncalled, fetchGisticData, fetchCopyNumberData,
    fetchMutSigData, findMrnaRankGeneticProfileId, mergeDiscreteCNAData, fetchSamplesForPatient, fetchClinicalData,
    fetchCopyNumberSegments, fetchClinicalDataForPatient
} from "shared/lib/StoreUtils";

type PageMode = 'patient' | 'sample';

export function groupByEntityId(clinicalDataArray: Array<ClinicalData>) {
    return _.map(
        _.groupBy(clinicalDataArray, 'entityId'),
        (v: ClinicalData[], k: string): ClinicalDataBySampleId => ({
            clinicalData: v,
            id: k,
        })
    );
}

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

export function handlePathologyReportCheckResponse(resp: any): PathologyReportPDF[] {

    if (resp.total_count > 0) {
        return _.map(resp.items, (item: any) => ( {url: item.url, name: item.name} ));
    } else {
        return [];
    }

}

/*
 * Transform clinical data from API to clinical data shape as it will be stored
 * in the store
 */
function transformClinicalInformationToStoreShape(patientId: string, studyId: string, clinicalDataPatient: Array<ClinicalData>, clinicalDataSample: Array<ClinicalData>): ClinicalInformationData {
    const patient = {
        id: patientId,
        clinicalData: clinicalDataPatient
    };
    const samples = groupByEntityId(clinicalDataSample);
    const rv = {
        patient,
        samples,
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

    @computed get pageMode(): PageMode {
        return this._sampleId ? 'sample' : 'patient';
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

            return handlePathologyReportCheckResponse(parsedResp);

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

    readonly MSKPathSlidesAvailable = remoteData({
        await: () => [this.derivedPatientId],
        invoke: async() => {
                let resp: any = await request.get(`//slides.mskcc.org/cbioportal/${this.patientId}`);
                return resp.length > 0;
        },
        onError: ()=>{
            //fail silently
        }
    }, false);

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
        invoke: () => fetchClinicalData(this.studyId, this.sampleIds)
    }, []);

    readonly clinicalDataGroupedBySample = remoteData({
        await: () => [this.clinicalDataForSamples],
        invoke: async() => groupByEntityId(this.clinicalDataForSamples.result)
    }, []);

    readonly studyMetaData = remoteData({
        invoke: async() => client.getStudyUsingGET({studyId: this.studyId})
    });

    readonly patientViewData = remoteData({
        await: () => [
            this.clinicalDataPatient,
            this.clinicalDataForSamples
        ],
        invoke: async() => transformClinicalInformationToStoreShape(
            this.patientId,
            this.studyId,
            this.clinicalDataPatient.result,
            this.clinicalDataForSamples.result
        )
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
            let enableDarwin: boolean | null | undefined = ((window as any).enableDarwin);

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
            this.clinicalDataForSamples
        ],
        invoke: async() => fetchOncoKbData(this.sampleIdToTumorType, this.mutationData, this.uncalledMutationData)
    }, ONCOKB_DEFAULT);

    readonly cnaOncoKbData = remoteData<IOncoKbData>({
        await: () => [
            this.discreteCNAData,
            this.clinicalDataForSamples
        ],
        invoke: async() => fetchCnaOncoKbData(this.sampleIdToTumorType, this.discreteCNAData)
    }, ONCOKB_DEFAULT);

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
        return generateSampleIdToTumorTypeMap(this.clinicalDataForSamples);
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

    @cached get pmidCache() {
        return new PmidCache();
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
