import {
    DiscreteCopyNumberFilter, DiscreteCopyNumberData, ClinicalData, GeneticProfile, Sample
} from "shared/api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";
import {computed, observable, action} from "mobx";
import {remoteData, addErrorHandler} from "shared/api/remoteData";
import {labelMobxPromises, cached} from "mobxpromise";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import {
    findGeneticProfileIdDiscrete, fetchMyCancerGenomeData,
    fetchDiscreteCNAData, findMutationGeneticProfileId, mergeDiscreteCNAData,
    fetchSamples, fetchClinicalDataInStudy, generateDataQueryFilter, makeStudyToCancerTypeMap,
    fetchSamplesWithoutCancerTypeClinicalData, fetchStudiesForSamplesWithoutCancerTypeClinicalData,
    findMutationGeneticProfileIdSynch, IDataQueryFilter
} from "shared/lib/StoreUtils";
import {MutationMapperStore} from "./mutation/MutationMapperStore";
import AppConfig from "appConfig";
import * as _ from 'lodash';
import { IMPACT_GERMLINE_TESTING_CONSENT } from "shared/constants";
import {stringListToSet} from "../../shared/lib/StringUtils";
import {setDifference, setValues, toSet} from "../../shared/lib/SetUtils";

export class ResultsViewPageStore {

    constructor() {
        labelMobxPromises(this);

        addErrorHandler((error:any) => {
            this.ajaxErrors.push(error);
        });
    }

    @observable public urlValidationError: string | null = null;

    @observable ajaxErrors: Error[] = [];

    //@observable studyId: string = '';
    //@observable sampleListId: string|null = null;
    @observable hugoGeneSymbols: string[]|null = null;
    //@observable sampleList: string[]|null = null;
    @observable _studyToSampleIds:{[studyId:string]:{[sampleId:string]:boolean}}|null = null;
    @observable studyToSampleListId:{[studyId:string]:string}|null = null;

    readonly studyToSampleIds = remoteData<{[studyId:string]:{[sampleId:string]:boolean}}>(async()=>{
        if (this._studyToSampleIds) {
            // first priority: user provided custom sample list
            return this._studyToSampleIds;
        } else if (this.studyToSampleListId) {
            // if no custom sample list try to fetch sample ids from the API
            const studyToSampleListId = this.studyToSampleListId;
            const studies = Object.keys(studyToSampleListId);
            const results:string[][] = await Promise.all(studies.map(studyId=>{
                return client.getAllSampleIdsInSampleListUsingGET({
                    sampleListId: studyToSampleListId[studyId]
                });
            }));
            return results.reduce((map:{[studyId:string]:{[sampleId:string]:boolean}}, next:string[], index:number)=>{
                const correspondingStudy = studies[index];
                map[correspondingStudy] = stringListToSet(next);
                return map;
            }, {});
        } else {
            return {};
        }
    }, {});

    readonly studyToMutationGeneticProfileId = remoteData({
        await: () => [
            this.studyToGeneticProfilesInStudy
        ],
        invoke: ()=>{
            const studies = Object.keys(this.studyToGeneticProfilesInStudy);
            return Promise.resolve(studies.reduce((map:{[studyId:string]:string|undefined}, studyId:string)=>{
                map[studyId] = findMutationGeneticProfileIdSynch(
                    this.studyToGeneticProfilesInStudy.result![studyId],
                    studyId
                );
                return map;
            }, {}));
        }
    });

    @computed get studyIds():string[] {
        if (this._studyToSampleIds) {
            return Object.keys(this._studyToSampleIds);
        } else if (this.studyToSampleListId) {
            return Object.keys(this.studyToSampleListId);
        } else {
            return [];
        }
    }

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    protected mutationMapperStores: {[hugoGeneSymbol: string]: MutationMapperStore} = {};

    public getMutationMapperStore(hugoGeneSymbol:string): MutationMapperStore|undefined
    {
        if (this.mutationMapperStores[hugoGeneSymbol]) {
            return this.mutationMapperStores[hugoGeneSymbol];
        }
        else if (!this.hugoGeneSymbols || !this.hugoGeneSymbols.find((gene:string) => gene === hugoGeneSymbol)) {
            return undefined;
        }
        else {
            const store = new MutationMapperStore(AppConfig,
                hugoGeneSymbol,
                this.studies,
                this.studyToMutationGeneticProfileId,
                this.studyToSampleIds,
                this.studyToClinicalDataForSamples,
                this.studyToSamplesWithoutCancerTypeClinicalData,
                this.studyToSampleListId,
                this.studyToPatientIds,
                this.studyToMskImpactGermlineConsentedPatientIds,
                this.studyToDataQueryFilter);

            this.mutationMapperStores[hugoGeneSymbol] = store;

            return store;
        }
    }

    readonly studyToClinicalDataForSamples = remoteData({
        await: () => [
            this.studyToSampleIds
        ],
        invoke: async() => {
            const studies = Object.keys(this.studyToSampleIds.result);
            const clinicalDataSingleStudyFilters = studies.map(studyId=>({
                studyId,
                attributeIds: ["CANCER_TYPE", "CANCER_TYPE_DETAILED"],
                ids: Object.keys(this.studyToSampleIds.result[studyId])
            }));
            const results:ClinicalData[][] = await Promise.all(clinicalDataSingleStudyFilters.map(x=>{
                return fetchClinicalDataInStudy(x.studyId, x, "SAMPLE");
            }));
            return results.reduce((map:{[studyId:string]:ClinicalData[]}, next:ClinicalData[], index:number)=>{
                map[studies[index]] = next;
                return map;
            }, {});
        }
    }, {});

    readonly studyToMskImpactGermlineConsentedPatientIds = remoteData({
        await:()=>[this.studyToPatientIds],
        invoke: async()=>{
            const studyToPatientIds = this.studyToPatientIds.result;
            const studies = Object.keys(studyToPatientIds);
            const results:ClinicalData[][] = await Promise.all(studies.map(studyId=>{
                const filter = {
                    attributeIds: [IMPACT_GERMLINE_TESTING_CONSENT],
                    ids: Object.keys(studyToPatientIds[studyId])
                };
                return fetchClinicalDataInStudy(studyId, filter, 'PATIENT');
            }));
            return results.reduce((map:{[studyId:string]:{[patientId:string]:boolean}}, next:ClinicalData[], index:number)=>{
                map[studies[index]] = stringListToSet(next.map(d=>d.entityId));
                return map;
            }, {});
        },
    });

    readonly studyToSamples = remoteData({
        await: ()=>[
            this.studyToSampleIds
        ],
        invoke: async()=>{
            const studies = Object.keys(this.studyToSampleIds.result);
            const results:Sample[][] = await Promise.all(
                studies.map(studyId=>fetchSamples(Object.keys(this.studyToSampleIds.result[studyId]), studyId))
            );
            return results.reduce((map:{[studyId:string]:Sample[]}, next:Sample[], index:number)=>{
                map[studies[index]] = next;
                return map;
            }, {});
        }
    }, {});

    readonly studyToSamplesWithoutCancerTypeClinicalData = remoteData({
        await: ()=>[
            this.studyToSamples,
            this.studyToClinicalDataForSamples
        ],
        invoke: ()=>{
            const studyToSamples = this.studyToSamples.result;
            const studyToClinicalDataForSamples = this.studyToClinicalDataForSamples.result;
            const studies = Object.keys(studyToSamples);
            return Promise.resolve(studies.reduce((map:{[studyId:string]:Sample[]}, studyId:string)=>{
                const allSamples = toSet(studyToSamples[studyId], d=>d.sampleId);
                const samplesWithClinicalData = toSet(studyToClinicalDataForSamples[studyId], d=>d.entityId);
                map[studyId] = setValues(setDifference(allSamples, samplesWithClinicalData));
                return map;
            }, {}));
        }
    });

    readonly studyToPatientIds = remoteData({
        await: ()=>[ this.studyToSamples ],
        invoke: async()=>{
            const studies = Object.keys(this.studyToSamples.result);
            const ret:{[studyId:string]:{[patientId:string]:boolean}} = {};
            for (const study of studies) {
                ret[study] = this.studyToSamples.result[study].reduce((map:{[patientId:string]:boolean}, next:Sample)=>{
                    map[next.patientId] = true;
                    return map;
                }, {});
            }
            return ret;
        }
    }, {});

    readonly studies = remoteData({
        invoke: ()=>Promise.all(this.studyIds.map(studyId=>client.getStudyUsingGET({studyId})))
    }, []);

    @computed get studyToCancerType() {
        return makeStudyToCancerTypeMap(this.studies.result);
    }

    readonly studyToGeneticProfilesInStudy = remoteData(async()=>{
        const results:GeneticProfile[][] = await Promise.all(this.studyIds.map(studyId=>{
            return client.getAllGeneticProfilesInStudyUsingGET({
                studyId
            });
        }));
        return results.reduce((map:{[studyId:string]:GeneticProfile[]}, profiles:GeneticProfile[], index:number)=>{
            const correspondingStudy = this.studyIds[index];
            map[correspondingStudy] = profiles;
            return map;
        }, {});
    });

    readonly studyToGeneticProfileIdDiscrete = remoteData({
        await: ()=>[
            this.studyToGeneticProfilesInStudy
        ],
        invoke: async()=>{
            const studyToProfiles:{[studyId:string]:GeneticProfile[]} = this.studyToGeneticProfilesInStudy.result!;
            const studies = Object.keys(this.studyToGeneticProfilesInStudy.result);
            return studies.reduce((map:{[studyId:string]:string|undefined}, studyId:string)=>{
                map[studyId] = findGeneticProfileIdDiscrete(studyToProfiles[studyId]);
                return map;
            }, {});
        }
    });

    readonly studyToDiscreteCNAData = remoteData({
        await: () => [
            this.studyToGeneticProfileIdDiscrete,
            this.studyToDataQueryFilter
        ],
        invoke: async () => {
            const studies = Object.keys(this.studyToDataQueryFilter.result);
            const studyToDataQueryFilter = this.studyToDataQueryFilter.result;
            const studyToGeneticProfileIdDiscrete = this.studyToGeneticProfileIdDiscrete.result;
            if (!studyToDataQueryFilter || !studyToGeneticProfileIdDiscrete) {
                return {};
            } else {
                const results:DiscreteCopyNumberData[][] = await Promise.all(studies.map(studyId=>{
                    return fetchDiscreteCNAData(studyToDataQueryFilter[studyId] as DiscreteCopyNumberFilter, studyToGeneticProfileIdDiscrete[studyId]);
                }));
                return results.reduce((map:{[studyId:string]:DiscreteCopyNumberData[]}, next:DiscreteCopyNumberData[], index:number)=>{
                    map[studies[index]] = next;
                    return map;
                }, {});
            }
        },
        onResult: (result:{[studyId:string]:DiscreteCopyNumberData[]}) => {
            // We want to take advantage of this loaded data, and not redownload the same data
            //  for users of the cache
            for (const studyId of Object.keys(result)) {
                this.discreteCNACache.addData(result[studyId], studyId);
            }
        }

    }, {});

    readonly studyToDataQueryFilter = remoteData({
        await: () => [
            this.studyToSampleIds
        ],
        invoke: () => {
            const studyToSampleIds = this.studyToSampleIds.result;
            const studies = Object.keys(studyToSampleIds);
            const ret:{[studyId:string]:IDataQueryFilter} = {};
            for (const studyId of studies) {
                if (this.studyToSampleListId && this.studyToSampleListId[studyId]) {
                    ret[studyId] = {
                        sampleListId: this.studyToSampleListId[studyId]
                    };
                } else {
                    ret[studyId] = {
                        sampleIds: Object.keys(studyToSampleIds[studyId])
                    };
                }
            }
            return Promise.resolve(ret);
        }
    });

    @cached get oncoKbEvidenceCache() {
        return new OncoKbEvidenceCache();
    }

    @cached get pubMedCache() {
        return new PubMedCache();
    }

    @cached get discreteCNACache() {
        return new DiscreteCNACache(this.studyToGeneticProfileIdDiscrete.result);
    }

    @cached get cancerTypeCache() {
        return new CancerTypeCache();
    }

    @cached get mutationCountCache() {
        return new MutationCountCache(this.studyToMutationGeneticProfileId.result);
    }

    @cached get pdbHeaderCache() {
        return new PdbHeaderCache();
    }

    @action clearErrors() {
        this.ajaxErrors = [];
    }
}
