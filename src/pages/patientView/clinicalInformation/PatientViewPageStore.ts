import * as _ from 'lodash';
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import {
    ClinicalData, MolecularProfile, Sample, Mutation, DiscreteCopyNumberFilter, DiscreteCopyNumberData, MutationFilter,
    CopyNumberCount, ClinicalDataMultiStudyFilter, ReferenceGenomeGene, GenePanelData, GenePanel
} from "../../../shared/api/generated/CBioPortalAPI";
import client from "../../../shared/api/cbioportalClientInstance";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";
import {
    Gistic, GisticToGene, default as CBioPortalAPIInternal, MutSig
} from "shared/api/generated/CBioPortalAPIInternal";
import {computed, observable, action, runInAction} from "mobx";
import {remoteData} from "../../../public-lib/api/remoteData";
import {IGisticData} from "shared/model/Gistic";
import {labelMobxPromises, cached} from "mobxpromise";
import MrnaExprRankCache from 'shared/cache/MrnaExprRankCache';
import request from 'superagent';
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import {
    getDarwinUrl,
    getDigitalSlideArchiveMetaUrl
} from "../../../shared/api/urls";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import GenomeNexusCache from "shared/cache/GenomeNexusCache";
import GenomeNexusMyVariantInfoCache from "shared/cache/GenomeNexusMyVariantInfoCache";
import {IOncoKbData} from "shared/model/OncoKB";
import {IHotspotIndex, indexHotspotsData} from "react-mutation-mapper";
import {IMutSigData} from "shared/model/MutSig";
import {ICivicVariant, ICivicGene} from "shared/model/Civic.ts";
import {ClinicalInformationData} from "shared/model/ClinicalInformation";
import VariantCountCache from "shared/cache/VariantCountCache";
import CopyNumberCountCache from "./CopyNumberCountCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import AppConfig from "appConfig";
import {
    findMolecularProfileIdDiscrete,
    ONCOKB_DEFAULT,
    fetchOncoKbData,
    fetchCnaOncoKbData,
    mergeMutations,
    fetchMyCancerGenomeData,
    fetchMutationalSignatureData,
    fetchMutationalSignatureMetaData,
    fetchCosmicData,
    fetchMutationData,
    fetchDiscreteCNAData,
    generateUniqueSampleKeyToTumorTypeMap,
    findMutationMolecularProfileId,
    findUncalledMutationMolecularProfileId,
    mergeMutationsIncludingUncalled,
    fetchGisticData,
    fetchCopyNumberData,
    fetchMutSigData,
    findMrnaRankMolecularProfileId,
    mergeDiscreteCNAData,
    fetchSamplesForPatient,
    fetchClinicalData,
    fetchCopyNumberSegments,
    fetchClinicalDataForPatient,
    makeStudyToCancerTypeMap,
    fetchCivicGenes,
    fetchCnaCivicGenes,
    fetchCivicVariants,
    groupBySampleId,
    findSamplesWithoutCancerTypeClinicalData,
    fetchStudiesForSamplesWithoutCancerTypeClinicalData,
    concatMutationData,
    fetchOncoKbCancerGenes,
    fetchVariantAnnotationsIndexedByGenomicLocation,
    fetchReferenceGenomeGenes,
    fetchGenePanelData,
    fetchGenePanel,
    noGenePanelUsed
} from "shared/lib/StoreUtils";
import {fetchHotspotsData} from "shared/lib/CancerHotspotsUtils";
import {stringListToSet} from "../../../public-lib/lib/StringUtils";
import {MutationTableDownloadDataFetcher} from "shared/lib/MutationTableDownloadDataFetcher";
import { VariantAnnotation } from 'public-lib/api/generated/GenomeNexusAPI';
import {getNavCaseIdsCache} from "../../../shared/lib/handleLongUrls";
import {CancerGene} from "public-lib/api/generated/OncoKbAPI";
import { fetchTrialsById, fetchTrialMatchesUsingPOST } from "../../../shared/api/MatchMinerAPI";
import { IDetailedTrialMatch, ITrial, ITrialMatch, ITrialQuery } from "../../../shared/model/MatchMiner";
import { groupTrialMatchesById } from "../trialMatch/TrialMatchTableUtils";
import { GeneFilterOption } from '../mutation/GeneFilterMenu';
import TumorColumnFormatter from '../mutation/column/TumorColumnFormatter';
import { AppStore, SiteError } from 'AppStore';


type PageMode = 'patient' | 'sample';

export async function checkForTissueImage(patientId: string): Promise<boolean> {

    if (/TCGA/.test(patientId) === false) {
        return false;
    } else {

        let resp = await request.get(getDigitalSlideArchiveMetaUrl(patientId));

        // if the count is greater than 0, there is a slide for this patient
        return resp.body && resp.body.total_count && resp.body.total_count > 0
    }

}

export type PathologyReportPDF = {

    name: string;
    url: string;

}

export function parseCohortIds(concatenatedIds:string){
    return concatenatedIds.split(',').map((entityId:string)=>{
        return entityId.includes(':') ? entityId : this.studyId + ':' + entityId;
    });
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

export function filterMutationsByProfiledGene(mutationRows:Mutation[][], sampleIds:string[], sampleToGenePanelId:{[sampleId:string]:string}, genePanelIdToEntrezGeneIds:{[sampleId:string]:number[]}):Mutation[][] {
    return _.filter(mutationRows,(mutations:Mutation[]) => {
        const entrezGeneId = mutations[0].gene.entrezGeneId;
        const geneProfiledInSamples = TumorColumnFormatter.getProfiledSamplesForGene(entrezGeneId, sampleIds, sampleToGenePanelId, genePanelIdToEntrezGeneIds);
        return _(geneProfiledInSamples).values().filter((profiled:boolean) => profiled).value().length === sampleIds.length;
    });
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

    constructor(private appStore: AppStore) {
        labelMobxPromises(this);
        this.internalClient = internalClient;
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

    @observable public mutationTableGeneFilterOption = GeneFilterOption.ANY_SAMPLE;
    @observable public copyNumberTableGeneFilterOption = GeneFilterOption.ANY_SAMPLE;

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

    @computed get metaDescription(): string {
        const id = ((this.pageMode === "patient") ?
            this.patientId : this.sampleId);
        return `${id} from ${this.studyMetaData.result!.name}`;
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

    // this is a string of concatenated ids
    @observable
    private _patientIdsInCohort:string[] = [];

    public set patientIdsInCohort(cohortIds:string[]){
        // cannot put action on setter
        runInAction(()=>this._patientIdsInCohort = cohortIds);
    }

    @computed
    public get patientIdsInCohort(): string[] {
        let concatenatedIds: string;
        // check to see if we copied from url hash on app load
        const memoryCachedIds = getNavCaseIdsCache();
        return (memoryCachedIds) ? memoryCachedIds : this._patientIdsInCohort;
    }

    @computed get myCancerGenomeData() {
        return fetchMyCancerGenomeData();
    }

    readonly mutationalSignatureData = remoteData({
        invoke: async() => fetchMutationalSignatureData()
    });

    readonly mutationalSignatureMetaData = remoteData({
        invoke: async() => fetchMutationalSignatureMetaData()
    });

    readonly hasMutationalSignatureData = remoteData({
        invoke: async() => false,
        default: false
    });

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
        {
            invoke: async () => fetchSamplesForPatient(this.studyId, this._patientId, this.sampleId),
            onError: (err: Error) => {
                this.appStore.siteErrors.push({errorObj: err, dismissed: false, title:"Samples / Patients not valid"} as SiteError);
            }
        },
        []
    );

    // use this when pageMode === 'sample' to get total nr of samples for the
    // patient
    readonly allSamplesForPatient = remoteData({
            await: () => [this.derivedPatientId],
            invoke: async() => {
                return await client.getAllSamplesOfPatientInStudyUsingGET({
                    studyId: this.studyId,
                    patientId: this.derivedPatientId.result,
                    projection: 'DETAILED'
                });
            },
            default: []
    });

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

    readonly studyIdToStudy = remoteData({
        await: ()=>[this.studies],
        invoke:()=>Promise.resolve(_.keyBy(this.studies.result, x=>x.studyId))
    }, {});

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
                const rawPdfUrl = "https://github.com/inodb/datahub/raw/a0d36d77b242e32cda3175127de73805b028f595/tcga/pathology_reports";
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
                return Promise.resolve([]);
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

    // Mutation annotation
    // genome nexus
    readonly indexedVariantAnnotations = remoteData<{[genomicLocation: string]: VariantAnnotation} | undefined>({
        await:()=>[
            this.mutationData,
            this.uncalledMutationData,
        ],
        invoke: async () => await fetchVariantAnnotationsIndexedByGenomicLocation(
            concatMutationData(this.mutationData, this.uncalledMutationData),
            ["annotation_summary", "hotspots"],
            AppConfig.serverConfig.isoformOverrideSource),
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, undefined);

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

    readonly getWholeSlideViewerIds = remoteData({
        await: () => [this.clinicalDataGroupedBySample],
        invoke: () => {
            const clinicalData = this.clinicalDataGroupedBySample.result!;
            const clinicalAttributeId = "MSK_SLIDE_ID";
            if (clinicalData) {
                const ids = _.chain(clinicalData)
                .map((data) => data.clinicalData)
                .flatten()
                .filter((attribute) => {return attribute.clinicalAttributeId === clinicalAttributeId})
                .map((attribute) => attribute.value)
                .value();

                return Promise.resolve(ids);
            }
            return Promise.resolve([]);
        }
    });

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

    readonly referenceGenes = remoteData<ReferenceGenomeGene[]>({
        await: ()=>[
            this.studies,
            this.discreteCNAData
        ],
        invoke: async () => {
            return fetchReferenceGenomeGenes(this.studies.result[0].referenceGenome,
                this.discreteCNAData.result.map(
                    (d:DiscreteCopyNumberData)=>d.gene.hugoGeneSymbol.toUpperCase()));
        },
        onError:(err)=>{
            // throwing this allows sentry to report it
            throw(err);
        }
    });

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
            if (AppConfig.serverConfig.enable_darwin === true) {
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

    readonly oncoKbCancerGenes = remoteData({
        invoke: () => {
            if (AppConfig.serverConfig.show_oncokb) {
                return fetchOncoKbCancerGenes();
            } else {
                return Promise.resolve([]);
            }
        }
    }, []);

    readonly oncoKbAnnotatedGenes = remoteData({
        await: () => [this.oncoKbCancerGenes],
        invoke: () => {
            if (AppConfig.serverConfig.show_oncokb) {
                return Promise.resolve(_.reduce(this.oncoKbCancerGenes.result, (map: { [entrezGeneId: number]: boolean }, next: CancerGene) => {
                    if (next.oncokbAnnotated) {
                        map[next.entrezGeneId] = true;
                    }
                    return map;
                }, {}));
            } else {
                return Promise.resolve({});
            }
        }
    }, {});

    readonly oncoKbData = remoteData<IOncoKbData|Error>({
        await: () => [
            this.oncoKbAnnotatedGenes,
            this.mutationData,
            this.uncalledMutationData,
            this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData,
            this.studies
        ],
        invoke: () => {
            if (AppConfig.serverConfig.show_oncokb) {
                return fetchOncoKbData(this.uniqueSampleKeyToTumorType, this.oncoKbAnnotatedGenes.result || {}, this.mutationData, undefined, this.uncalledMutationData);
            } else {
                return Promise.resolve({indicatorMap: null, uniqueSampleKeyToTumorType: null});
            }
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
        invoke: async() => AppConfig.serverConfig.show_civic ? fetchCivicGenes(this.mutationData, this.uncalledMutationData) : {},
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
            if (AppConfig.serverConfig.show_civic && this.civicGenes.result) {
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
        invoke: async() => {
            if (AppConfig.serverConfig.show_oncokb) {
                return fetchCnaOncoKbData(this.uniqueSampleKeyToTumorType, this.oncoKbAnnotatedGenes.result || {}, this.discreteCNAData);
            } else {
                return ONCOKB_DEFAULT;
            }
        },
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, ONCOKB_DEFAULT);

    readonly cnaCivicGenes = remoteData<ICivicGene | undefined>({
        await: () => [
            this.discreteCNAData,
            this.clinicalDataForSamples
        ],
        invoke: async() => AppConfig.serverConfig.show_civic ? fetchCnaCivicGenes(this.discreteCNAData) : {},
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

    readonly sampleToMutationGenePanelData = remoteData<{[sampleId: string]: GenePanelData}>({
        await:()=>[
            this.mutationMolecularProfileId
        ],
        invoke: async() => {
            if (this.mutationMolecularProfileId.result) {
                return fetchGenePanelData(this.mutationMolecularProfileId.result, this.sampleIds);
            }
            return {};
        }
    }, {});

    readonly sampleToMutationGenePanelId = remoteData<{[sampleId: string]: string}>({
        await:()=>[
            this.sampleToMutationGenePanelData
        ],
        invoke: async() => {
            return _.mapValues(this.sampleToMutationGenePanelData.result, (genePanelData) => genePanelData.genePanelId);
        }
    }, {});

    readonly sampleToDiscreteGenePanelData = remoteData<{[sampleId: string]: GenePanelData}>({
        await:()=>[
            this.molecularProfileIdDiscrete
        ],
        invoke: async() => {
            if (this.molecularProfileIdDiscrete.result) {
                return fetchGenePanelData(this.molecularProfileIdDiscrete.result, this.sampleIds);
            }
            return {};
        }
    }, {});

    readonly sampleToDiscreteGenePanelId = remoteData<{[sampleId: string]: string}>({
        await:()=>[
            this.sampleToDiscreteGenePanelData
        ],
        invoke: async() => {
            return _.mapValues(this.sampleToDiscreteGenePanelData.result, (genePanelData) => genePanelData.genePanelId);
        }
    }, {});

    readonly genePanelIdToPanel = remoteData<{[genePanelId: string]: GenePanel}>({
        await:()=>[
            this.sampleToMutationGenePanelData,
            this.sampleToDiscreteGenePanelData
        ],
        invoke: async() => {
            const sampleGenePanelInfo = _.concat(_.values(this.sampleToMutationGenePanelData.result), _.values(this.sampleToDiscreteGenePanelData.result));
            const panelIds = _(sampleGenePanelInfo)
                .map((genePanelData) => genePanelData.genePanelId)
                .filter((genePanelId) => !noGenePanelUsed(genePanelId))
                .value();
            return fetchGenePanel(panelIds);
        }
    }, {});

    readonly genePanelIdToEntrezGeneIds = remoteData<{[genePanelId: string]: number[]}>({
        await:()=>[
            this.genePanelIdToPanel
        ],
        invoke: async() => {
            return _(this.genePanelIdToPanel.result)
            .mapValues((genePanel) => _.map(genePanel.genes, (genePanelToGene) => genePanelToGene.entrezGeneId))
            .value();
        }
    }, {});

    @computed get mergedMutationData(): Mutation[][] {
        return mergeMutations(this.mutationData);
    }
    
    @computed get mergedMutationDataIncludingUncalled(): Mutation[][] {
        return mergeMutationsIncludingUncalled(this.mutationData, this.uncalledMutationData);
    }
    
    @computed get mergedMutationDataFilteredByGene():Mutation[][] {
        if (this.mutationTableGeneFilterOption === GeneFilterOption.ALL_SAMPLES) {
            return filterMutationsByProfiledGene(this.mergedMutationData, this.sampleIds, this.sampleToMutationGenePanelId.result, this.genePanelIdToEntrezGeneIds.result);
        }
        return this.mergedMutationData;
    }

    @computed get mergedMutationDataIncludingUncalledFilteredByGene():Mutation[][] {
        if (this.mutationTableGeneFilterOption === GeneFilterOption.ALL_SAMPLES) {
            return filterMutationsByProfiledGene(this.mergedMutationDataIncludingUncalled, this.sampleIds, this.sampleToMutationGenePanelId.result, this.genePanelIdToEntrezGeneIds.result);
        }
        return this.mergedMutationDataIncludingUncalled;
    }

    @computed get mergedDiscreteCNADataFilteredByGene():DiscreteCopyNumberData[][] {
        if (this.copyNumberTableGeneFilterOption === GeneFilterOption.ALL_SAMPLES) {
            return _.filter(this.mergedDiscreteCNAData,(mutations:DiscreteCopyNumberData[]) => {
                const entrezGeneId = mutations[0].gene.entrezGeneId;
                const geneProfiledInSamples = TumorColumnFormatter.getProfiledSamplesForGene(entrezGeneId, this.sampleIds, this.sampleToMutationGenePanelId.result, this.genePanelIdToEntrezGeneIds.result);
                return _(geneProfiledInSamples).values().filter((profiled:boolean) => profiled).value().length === this.sampleIds.length;
            });
        }
        return this.mergedDiscreteCNAData;
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

    @cached get genomeNexusCache() {
        return new GenomeNexusCache();
    }

    @cached get genomeNexusMyVariantInfoCache() {
        return new GenomeNexusMyVariantInfoCache();
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

    readonly trialMatches = remoteData<ITrialMatch[]>({
        invoke: () => {
            return fetchTrialMatchesUsingPOST({mrn: this.patientId});
        }
    }, []);

    readonly trialIds = remoteData<ITrialQuery>({
        await: () => [
            this.trialMatches
        ],
        invoke: async() => {
            let nctIds = new Set<string>(); // Trial unique id from clinicaltrials.gov
            let protocolNos = new Set<string>(); // Trials's MSK ID same as protocol_number or protocol_id
            _.forEach(this.trialMatches.result, (trialMatch: ITrialMatch) => {
                if (_.isEmpty(trialMatch.protocolNo)) {
                    nctIds.add(trialMatch.nctId);
                } else {
                    protocolNos.add(trialMatch.protocolNo);
                }
            });
            return {
                nct_id: [...nctIds],
                protocol_no: [...protocolNos]
            };
        }
    }, {
        nct_id: [],
        protocol_no: []
    });

    readonly trials = remoteData<ITrial[]>({
        await: () => [
            this.trialIds
        ],
        invoke: async () => {
            if (this.trialIds.result.protocol_no.length > 0 || this.trialIds.result.nct_id.length > 0) {
                return fetchTrialsById(this.trialIds.result);
            }
            return [];
        }
    }, []);

    readonly detailedTrialMatches = remoteData<IDetailedTrialMatch[]>({
        await: () => [
            this.trials,
            this.trialMatches
        ],
        invoke: async () => {
            if (this.trials.result && this.trialMatches.result ) {
                return groupTrialMatchesById(this.trials.result, this.trialMatches.result);
            }
            return [];
        }
    }, []);

}
