import * as _ from 'lodash';
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import {
    ClinicalData, GeneticProfile, Sample, Mutation, DiscreteCopyNumberFilter, DiscreteCopyNumberData, MutationFilter
} from "../../../shared/api/generated/CBioPortalAPI";
import client from "../../../shared/api/cbioportalClientInstance";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";
import hotspot3DClient from '../../../shared/api/3DhotspotClientInstance';
import hotspotClient from '../../../shared/api/hotspotClientInstance';
import {
    CopyNumberCount, CopyNumberCountIdentifier, Gistic, GisticToGene, CosmicMutation, default as CBioPortalAPIInternal,
    MutSig
} from "shared/api/generated/CBioPortalAPIInternal";
import {computed, observable, action} from "mobx";
import oncokbClient from "../../../shared/api/oncokbClientInstance";
import {remoteData, addErrorHandler} from "../../../shared/api/remoteData";
import {IGisticData} from "shared/model/Gistic";
import {
    generateIdToIndicatorMap, generateQueryVariant, generateEvidenceQuery
} from "shared/lib/OncoKbUtils";
import {Query} from "shared/api/generated/OncoKbAPI";
import {labelMobxPromises, cached} from "mobxpromise";
import MrnaExprRankCache from './MrnaExprRankCache';
import request from 'superagent';
import DiscreteCNACache from "./DiscreteCNACache";
import {getTissueImageCheckUrl, getDarwinUrl} from "../../../shared/api/urls";
import {getAlterationString} from "shared/lib/CopyNumberUtils";
import OncoKbEvidenceCache from "../OncoKbEvidenceCache";
import PmidCache from "../PmidCache";
import {keywordToCosmic, indexHotspots, geneToMyCancerGenome} from "shared/lib/AnnotationUtils";
import {IOncoKbData} from "shared/model/OncoKB";
import {IMyCancerGenomeData, IMyCancerGenome} from "shared/model/MyCancerGenome";
import {IHotspotData} from "shared/model/CancerHotspots";
import {IMutSigData} from "shared/model/MutSig";
import {ClinicalInformationData} from "shared/model/ClinicalInformation";
import VariantCountCache from "./VariantCountCache";

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

export async function fetchOncoKbData(sampleIdToTumorType: {[sampleId: string]: string}, queryVariants: Query[]) {
    const onkokbSearch = await oncokbClient.searchPostUsingPOST(
        {body: generateEvidenceQuery(queryVariants)});

    const oncoKbData: IOncoKbData = {
        sampleToTumorMap: sampleIdToTumorType,
        indicatorMap: generateIdToIndicatorMap(onkokbSearch)
    };

    return oncoKbData;
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

    @computed get mutationGeneticProfileId() {
        return `${this.studyId}_mutations`;
    }

    @observable patientIdsInCohort: string[] = [];

    get myCancerGenomeData() : IMyCancerGenomeData {
        const data:IMyCancerGenome[] = require('../../../../resources/mycancergenome.json');
        return geneToMyCancerGenome(data);
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
        invoke: async() => {
            if (this.studyId && this.patientId)
                return await client.getAllClinicalDataOfPatientInStudyUsingGET({
                    projection: 'DETAILED',
                    studyId: this.studyId,
                    patientId: this.patientId
                });
            return [];
        },
        default: []
    });

    readonly samples = remoteData(async() => {
        if (this.studyId && this._patientId)
            return await client.getAllSamplesOfPatientInStudyUsingGET({
                studyId: this.studyId,
                patientId: this.patientId
            });

        if (this.studyId && this._sampleId)
            return await client.getSampleInStudyUsingGET({
                studyId: this.studyId,
                sampleId: this.sampleId
            }).then(data => [data]);

        return [];
    }, []);


    readonly cnaSegments = remoteData({
        await: () => [
            this.samples
        ],
        invoke: () => client.fetchCopyNumberSegmentsUsingPOST({
            sampleIdentifiers: this.samples.result.map(sample => ({
                sampleId: sample.sampleId,
                studyId: this.studyId
            })),
            projection: 'DETAILED',
        })
    }, []);

    readonly pathologyReport = remoteData({
        await: () => [this.derivedPatientId],
        invoke: async() => {

            let resp: any = await request.get(`//api.github.com/search/code?q=${this.patientId}+extension:pdf+in:path+repo:cBioPortal/datahub`);

            const parsedResp: any = JSON.parse(resp.text);

            return handlePathologyReportCheckResponse(parsedResp);

        },
        onError: (err: Error) => {
            // fail silently
        }

    }, []);

    async cosmicDataInvoke() {
        if (this.mutationData.result.length === 0) {
            return undefined;
        }

        const queryKeywords: string[] = _.uniq(_.map(this.mutationData.result, (mutation: Mutation) => mutation.keyword));

        const cosmicData: CosmicMutation[] = await this.internalClient.fetchCosmicCountsUsingPOST({
            keywords: _.filter(queryKeywords, (query) => {
                return query != null;
            })
        });

        return keywordToCosmic(cosmicData);
    }

    readonly cosmicData = remoteData({
        await: () => [
            this.mutationData
        ],
        invoke: () => this.cosmicDataInvoke()
    });

    readonly mutSigData = remoteData({
        invoke: async () => {
            const mutSigdata = await internalClient.getSignificantlyMutatedGenesUsingGET({studyId: this.studyId});
            const byEntrezGeneId: IMutSigData = mutSigdata.reduce((map:IMutSigData, next:MutSig) => {
                map[next.entrezGeneId] = { qValue: next.qValue };
                return map;
            }, {});
            return byEntrezGeneId;
        }
    });


    readonly hotspotData = remoteData({
        await: ()=> [
            this.mutationData
        ],
        invoke: async () => {
            const queryGenes:string[] = _.uniq(_.map(this.mutationData.result, function(mutation:Mutation) {
                if (mutation && mutation.gene) {
                    return mutation.gene.hugoGeneSymbol;
                }
                else {
                    return "";
                }
            }));

            const [dataSingle, data3d] = await Promise.all([
                hotspotClient.fetchSingleResidueHotspotMutationsByGenePOST({
                    hugoSymbols: queryGenes
                }),
                hotspot3DClient.fetch3dHotspotMutationsByGenePOST({
                    hugoSymbols: queryGenes
                })
            ]);

            return {
                single: dataSingle,
                clustered: data3d
            };
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
        invoke: () => client.fetchClinicalDataUsingPOST({
            clinicalDataType: 'SAMPLE',
            identifiers: this.samples.result.map(sample => ({
                entityId: sample.sampleId,
                studyId: this.studyId
            })),
            projection: 'DETAILED',
        })
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
        invoke: async() => {
            const regex1 = /^.+rna_seq.*_zscores$/; // We prefer profiles that look like this
            const regex2 = /^.*_zscores$/; // If none of the above are available, we'll look for ones like this
            const preferredProfile: (GeneticProfile | undefined) = this.geneticProfilesInStudy.result.find(
                (gp: GeneticProfile) => regex1.test(gp.geneticProfileId.toLowerCase()));

            if (preferredProfile) {
                return preferredProfile.geneticProfileId;
            } else {
                const fallbackProfile: (GeneticProfile | undefined) = this.geneticProfilesInStudy.result.find(
                    (gp: GeneticProfile) => regex2.test(gp.geneticProfileId.toLowerCase()));

                return fallbackProfile ? fallbackProfile.geneticProfileId : null;
            }
        }
    }, null);

    readonly discreteCNAData = remoteData({

        await: () => [
            this.geneticProfilesInStudy,
            this.samples
        ],
        invoke: async() => {

            const sampleIds = this.samples.result.map((sample) => sample.sampleId);

            if (this.geneticProfileIdDiscrete.isComplete && this.geneticProfileIdDiscrete.result) {
                return await client.fetchDiscreteCopyNumbersInGeneticProfileUsingPOST({
                    projection: 'DETAILED',
                    discreteCopyNumberFilter: {sampleIds: sampleIds} as DiscreteCopyNumberFilter,
                    geneticProfileId: this.geneticProfileIdDiscrete.result
                });
            } else {
                return [];
            }

        }

    }, []);

    readonly gisticData = remoteData<IGisticData>({
        invoke: async() => {
            if (this.studyId) {
                const gisticData = await internalClient.getSignificantCopyNumberRegionsUsingGET({studyId: this.studyId});

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
            const profile = this.geneticProfilesInStudy.result.find((profile: GeneticProfile) => {
                return profile.datatype === 'DISCRETE';
            });
            return profile ? profile.geneticProfileId : undefined;
        }

    });

    readonly darwinUrl = remoteData({
        await: () => [
            this.derivedPatientId
        ],
        invoke: async() => {
            let enableDarwin: boolean | null | undefined = ((window as any).enableDarwin);

            if (enableDarwin === true) {
                let resp = await request.get(getDarwinUrl(this.samples.result.map((sample: Sample) => sample.sampleId), this.patientId));
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

    readonly mutationData = remoteData({
        await: () => [
            this.samples
        ],
        invoke: async() => {
            const geneticProfileId = this.mutationGeneticProfileId;
            if (geneticProfileId) {
                return await client.fetchMutationsInGeneticProfileUsingPOST({
                    geneticProfileId: geneticProfileId,
                    mutationFilter: {
                        sampleIds: this.samples.result.map((sample: Sample) => sample.sampleId)
                    } as MutationFilter,
                    projection: "DETAILED"
                });
            } else {
                return [];
            }
        }
    }, []);


    async oncoKbDataInvoke(){

        if (this.mutationData.result.length === 0) {
            return {sampleToTumorMap: {}, indicatorMap: {}};
        }

        const queryVariants = _.uniqBy(_.map(this.mutationData.result, (mutation: Mutation) => {
            return generateQueryVariant(mutation.gene.hugoGeneSymbol,
                this.sampleIdToTumorType[mutation.sampleId],
                mutation.proteinChange,
                mutation.mutationType,
                mutation.proteinPosStart,
                mutation.proteinPosEnd);
        }), "id");

        return fetchOncoKbData(this.sampleIdToTumorType, queryVariants);
    }

    readonly oncoKbData = remoteData<IOncoKbData>({
        await: () => [
            this.mutationData,
            this.clinicalDataForSamples
        ],
        invoke: async() => this.oncoKbDataInvoke()
    }, {sampleToTumorMap: {}, indicatorMap: {}});

    readonly cnaOncoKbData = remoteData<IOncoKbData>({
        await: () => [
            this.discreteCNAData,
            this.clinicalDataForSamples
        ],
        invoke: async() => {
            const queryVariants = _.uniqBy(_.map(this.discreteCNAData.result, (copyNumberData: DiscreteCopyNumberData) => {
                return generateQueryVariant(copyNumberData.gene.hugoGeneSymbol,
                    this.sampleIdToTumorType[copyNumberData.sampleId],
                    getAlterationString(copyNumberData.alteration));
            }), "id");

            return fetchOncoKbData(this.sampleIdToTumorType, queryVariants);
        }
    }, {sampleToTumorMap: {}, indicatorMap: {}});

    readonly copyNumberCountData = remoteData<CopyNumberCount[]>({
        await: () => [
            this.discreteCNAData
        ],
        invoke: async() => {
            const copyNumberCountIdentifiers: CopyNumberCountIdentifier[] =
                this.discreteCNAData.result.map((cnData: DiscreteCopyNumberData) => {
                    return {
                        alteration: cnData.alteration,
                        entrezGeneId: cnData.entrezGeneId
                    };
                });

            if (this.geneticProfileIdDiscrete.result) {
                return await internalClient.fetchCopyNumberCountsUsingPOST({
                    geneticProfileId: this.geneticProfileIdDiscrete.result,
                    copyNumberCountIdentifiers
                });
            } else {
                return [];
            }
        }
    }, []);

    @computed get indexedHotspotData(): IHotspotData|undefined
    {
        const data = this.hotspotData.result;

        if (data) {
            return {
                single: indexHotspots(data.single),
                clustered: indexHotspots(data.clustered)
            }
        }
        else {
            return undefined;
        }
    }

    @computed get mergedMutationData(): Mutation[][] {
        let idToMutations: {[key: string]: Array<Mutation>} = {};
        let mutationId: string;
        let MutationId: (m: Mutation) => string = (m: Mutation) => {
            return [m.gene.chromosome, m.startPosition, m.endPosition, m.referenceAllele, m.variantAllele].join("_");
        }

        for (const mutation of this.mutationData.result) {
            mutationId = MutationId(mutation);
            idToMutations[mutationId] = idToMutations[mutationId] || [];
            idToMutations[mutationId].push(mutation);
        }

        return Object.keys(idToMutations).map(id => idToMutations[id]);
    }

    @computed get sampleIdToTumorType(): {[sampleId: string]: string} {
        const map: {[sampleId: string]: string} = {};

        if (this.clinicalDataForSamples.result) {
            _.each(this.clinicalDataForSamples.result, function (clinicalData) {
                if (clinicalData.clinicalAttributeId === "CANCER_TYPE") {
                    map[clinicalData.entityId] = clinicalData.value;
                }
            });
        }

        return map;
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
        return new VariantCountCache(this.mutationGeneticProfileId);
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

    @action setActiveTabId(id: string) {
        this.activeTabId = id;
    }

    @action clearErrors() {
        this.ajaxErrors = [];
    }

}
