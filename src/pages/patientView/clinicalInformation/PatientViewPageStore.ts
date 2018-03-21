import * as _ from 'lodash';
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import {
    ClinicalData, MolecularProfile, Sample, Mutation, DiscreteCopyNumberFilter, DiscreteCopyNumberData, MutationFilter,
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
import GenomeNexusEnrichmentCache from "shared/cache/GenomeNexusEnrichment";
import PubMedCache from "shared/cache/PubMedCache";
import {IOncoKbData} from "shared/model/OncoKB";
import {IHotspotIndex} from "shared/model/CancerHotspots";
import {IMutSigData} from "shared/model/MutSig";
import {ICivicVariant, ICivicGene} from "shared/model/Civic.ts";
import {ClinicalInformationData} from "shared/model/ClinicalInformation";
import VariantCountCache from "shared/cache/VariantCountCache";
import CopyNumberCountCache from "./CopyNumberCountCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import AppConfig from "appConfig";
import {
    findMolecularProfileIdDiscrete, ONCOKB_DEFAULT, fetchOncoKbData,
    fetchCnaOncoKbData, mergeMutations, fetchMyCancerGenomeData, fetchCosmicData,
    fetchMutationData, fetchDiscreteCNAData, generateUniqueSampleKeyToTumorTypeMap, findMutationMolecularProfileId,
    findUncalledMutationMolecularProfileId, mergeMutationsIncludingUncalled, fetchGisticData, fetchCopyNumberData,
    fetchMutSigData, findMrnaRankMolecularProfileId, mergeDiscreteCNAData, fetchSamplesForPatient, fetchClinicalData,
    fetchCopyNumberSegments, fetchClinicalDataForPatient, makeStudyToCancerTypeMap,
    fetchCivicGenes, fetchCnaCivicGenes, fetchCivicVariants, groupBySampleId, findSamplesWithoutCancerTypeClinicalData,
    fetchStudiesForSamplesWithoutCancerTypeClinicalData, fetchOncoKbAnnotatedGenes
} from "shared/lib/StoreUtils";
import {indexHotspotsData, fetchHotspotsData} from "shared/lib/CancerHotspotsUtils";
import {stringListToSet} from "../../../shared/lib/StringUtils";
import {Gene as OncoKbGene} from "../../../shared/api/generated/OncoKbAPI";
import {MutationTableDownloadDataFetcher} from "shared/lib/MutationTableDownloadDataFetcher";

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
    const samples = groupBySampleId(sampleIds, clinicalDataSample);
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

    readonly mutationMolecularProfileId = remoteData({
        await: () => [
            this.molecularProfilesInStudy
        ],
        invoke: async() => findMutationMolecularProfileId(this.molecularProfilesInStudy, this.studyId)
    });

    readonly uncalledMutationMolecularProfileId = remoteData({
        await: () => [
            this.molecularProfilesInStudy
        ],
        invoke: async() => findUncalledMutationMolecularProfileId(this.molecularProfilesInStudy, this.studyId)
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
        invoke: () => {
            // only check path report for tcga studies
            if (this.studyId.toLowerCase().indexOf('tcga') > -1) {
                const pathLinkUrl = "https://raw.githubusercontent.com/inodb/datahub/a0d36d77b242e32cda3175127de73805b028f595/tcga/pathology_reports/symlink_by_patient";
                const rawPdfUrl = "https://github.com/cBioPortal/datahub/raw/master/tcga/pathology_reports";
                const reports: PathologyReportPDF[] = [];

                // keep checking if patient has more reports recursively
                function getPathologyReport(patientId:string, i:number):any {
                    return request.get(`${pathLinkUrl}/${patientId}.${i}`).then(function(resp){
                            // add report
                            let pdfName: string = resp.text.split('/')[1];
                            reports.push({name: `${pdfName}`, url: `${rawPdfUrl}/${pdfName}`});
                            // check if patient has more reports
                            return getPathologyReport(patientId, i+1);
                        }, () => reports);
                }
                
               return getPathologyReport(this.patientId, 0);
            } else {
                return [];
            }
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
        invoke: async() => groupBySampleId(this.sampleIds, this.clinicalDataForSamples.result)
    }, []);

    readonly studyMetaData = remoteData({
        invoke: async() => client.getStudyUsingGET({studyId: this.studyId})
    });

    readonly patientViewData = remoteData<ClinicalInformationData>({
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

    readonly sequencedSampleIdsInStudy = remoteData({
        invoke: async () => {
            return stringListToSet(await client.getAllSampleIdsInSampleListUsingGET({sampleListId:`${this.studyId}_sequenced`}));
        },
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, {});

    readonly molecularProfilesInStudy = remoteData(() => {
        return client.getAllMolecularProfilesInStudyUsingGET({
            studyId: this.studyId
        })
    }, []);

    readonly molecularProfileIdToMolecularProfile = remoteData<{[molecularProfileId:string]:MolecularProfile}>({
        await:()=>[this.molecularProfilesInStudy],
        invoke:()=>{
            return Promise.resolve(this.molecularProfilesInStudy.result.reduce((map:{[molecularProfileId:string]:MolecularProfile}, next:MolecularProfile)=>{
                map[next.molecularProfileId] = next;
                return map;
            }, {}));
        }
    }, {});


    public readonly mrnaRankMolecularProfileId = remoteData({
        await: () => [
            this.molecularProfilesInStudy
        ],
        invoke: async() => findMrnaRankMolecularProfileId(this.molecularProfilesInStudy)
    }, null);

    readonly discreteCNAData = remoteData({

        await: () => [
            this.molecularProfileIdDiscrete,
            this.samples
        ],
        invoke: async() => {
            const filter = {sampleIds: this.sampleIds} as DiscreteCopyNumberFilter;
            return fetchDiscreteCNAData(filter, this.molecularProfileIdDiscrete);
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

    readonly molecularProfileIdDiscrete = remoteData({
        await: () => [
            this.molecularProfilesInStudy
        ],
        invoke: async() => {
            return findMolecularProfileIdDiscrete(this.molecularProfilesInStudy);
        }
    });

    readonly studyToMolecularProfileDiscrete = remoteData({
        await: ()=>[this.molecularProfileIdDiscrete],
        invoke:async ()=>{
            // we just need it in this form for input to DiscreteCNACache
            const ret:{[studyId:string]:MolecularProfile} = {};
            if (this.molecularProfileIdDiscrete.result) {
                ret[this.studyId] = await client.getMolecularProfileUsingGET({molecularProfileId:this.molecularProfileIdDiscrete.result});
            }
            return ret;
        }
    }, {});

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
            this.uncalledMutationMolecularProfileId
        ],
        invoke: async() => {
            const mutationFilter = {
                sampleIds: this.samples.result.map((sample: Sample) => sample.sampleId)
            } as MutationFilter;

            return fetchMutationData(mutationFilter, this.uncalledMutationMolecularProfileId.result);
        }
    }, []);

    readonly mutationData = remoteData({
        await: () => [
            this.samples,
            this.mutationMolecularProfileId
        ],
        invoke: async() => {
            const mutationFilter = {
                sampleIds: this.sampleIds
            } as MutationFilter;

            return fetchMutationData(mutationFilter, this.mutationMolecularProfileId.result);
        }
    }, []);

    readonly oncoKbAnnotatedGenes = remoteData({
        invoke:()=>fetchOncoKbAnnotatedGenes(),
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, {});

    readonly oncoKbData = remoteData<IOncoKbData>({
        await: () => [
            this.oncoKbAnnotatedGenes,
            this.mutationData,
            this.uncalledMutationData,
            this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData,
            this.studies
        ],
        invoke: () => {
            return fetchOncoKbData(this.uniqueSampleKeyToTumorType, this.oncoKbAnnotatedGenes.result || {}, this.mutationData, this.uncalledMutationData);
        },
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
        invoke: async() => AppConfig.showCivic ? fetchCivicGenes(this.mutationData, this.uncalledMutationData) : {},
        onError: (err: Error) => {
            // fail silently
        }
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
        },
        onError: (err: Error) => {
            // fail silently
        }
    }, undefined);

    readonly cnaOncoKbData = remoteData<IOncoKbData>({
        await: () => [
            this.oncoKbAnnotatedGenes,
            this.discreteCNAData,
            this.clinicalDataForSamples,
            this.studies
        ],
        invoke: async() => fetchCnaOncoKbData(this.uniqueSampleKeyToTumorType, this.oncoKbAnnotatedGenes.result || {}, this.discreteCNAData),
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, ONCOKB_DEFAULT);

    readonly cnaCivicGenes = remoteData<ICivicGene | undefined>({
        await: () => [
            this.discreteCNAData,
            this.clinicalDataForSamples
        ],
        invoke: async() => AppConfig.showCivic ? fetchCnaCivicGenes(this.discreteCNAData) : {},
        onError: (err: Error) => {
            // fail silently
        }
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
        },
        onError: (err: Error) => {
            // fail silently
        }
    }, undefined);

    readonly copyNumberCountData = remoteData<CopyNumberCount[]>({
        await: () => [
            this.discreteCNAData
        ],
        invoke: async() => fetchCopyNumberData(this.discreteCNAData, this.molecularProfileIdDiscrete)
    }, []);

    @computed get sampleIds(): string[]
    {
        if (this.samples.result) {
            return this.samples.result.map(sample => sample.sampleId);
        }

        return [];
    }

    readonly indexedHotspotData = remoteData<IHotspotIndex|undefined>({
        await:()=>[
            this.hotspotData
        ],
        invoke: ()=>Promise.resolve(indexHotspotsData(this.hotspotData))
    });

    @computed get mergedMutationData(): Mutation[][] {
        return mergeMutations(this.mutationData);
    }

    @computed get mergedMutationDataIncludingUncalled(): Mutation[][] {
        return mergeMutationsIncludingUncalled(this.mutationData, this.uncalledMutationData);
    }

    @computed get uniqueSampleKeyToTumorType(): {[sampleId: string]: string} {
        return generateUniqueSampleKeyToTumorTypeMap(this.clinicalDataForSamples,
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
        return new MrnaExprRankCache(this.mrnaRankMolecularProfileId.result);
    }

    @cached get variantCountCache() {
        return new VariantCountCache(this.mutationMolecularProfileId.result);
    }

    @cached get discreteCNACache() {
        return new DiscreteCNACache(this.studyToMolecularProfileDiscrete.result);
    }

    @cached get oncoKbEvidenceCache() {
        return new OncoKbEvidenceCache();
    }

    @cached get genomeNexusEnrichmentCache() {
        return new GenomeNexusEnrichmentCache();
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
        return new MutationTableDownloadDataFetcher(this.mutationData, () => this.genomeNexusEnrichmentCache);
    }

    @action setActiveTabId(id: string) {
        this.activeTabId = id;
    }

    @action clearErrors() {
        this.ajaxErrors = [];
    }

}
