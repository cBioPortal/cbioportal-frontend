import * as _ from 'lodash';
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {
    ClinicalData, SampleIdentifier,
    GeneticProfile, Sample, Mutation, DiscreteCopyNumberFilter
} from "../../../shared/api/CBioPortalAPI";
import {ClinicalInformationData} from "../Connector";
import client from "../../../shared/api/cbioportalClientInstance";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";
import {computed, observable, action} from "../../../../node_modules/mobx/lib/mobx";
import {remoteData} from "../../../shared/api/remoteData";
import {MrnaRankData} from "../mutation/column/MrnaExprColumnFormatter";
import {MrnaPercentile} from "../../../shared/api/CBioPortalAPIInternal";
import {labelMobxPromises} from "../../../shared/api/MobxPromise";

export function groupByEntityId(clinicalDataArray: Array<ClinicalData>)
{
    return _.map(
        _.groupBy(clinicalDataArray, 'entityId'),
        (v:ClinicalData[], k:string):ClinicalDataBySampleId => ({
            clinicalData: v,
            id: k,
        })
    );
}

/*
 * Transform clinical data from API to clinical data shape as it will be stored
 * in the store
 */
function transformClinicalInformationToStoreShape(patientId: string, studyId: string, clinicalDataPatient: Array<ClinicalData>, clinicalDataSample: Array<ClinicalData>):ClinicalInformationData
{
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

export class PatientViewPageStore
{
    constructor()
    {
        labelMobxPromises(this);
    }

    @observable patientId = '';

    @observable studyId = '';

    @computed get mutationGeneticProfileId() {
        return `${this.studyId}_mutations`;
    }

    readonly clinicalDataPatient = remoteData(() => {
        return client.getAllClinicalDataOfPatientInStudyUsingGET({
            projection: 'DETAILED',
            studyId: this.studyId,
            patientId: this.patientId
        });
    }, []);

    readonly samplesOfPatient = remoteData(() => {
        return client.getAllSamplesOfPatientInStudyUsingGET({
            studyId: this.studyId,
            patientId: this.patientId
        });
    }, []);

    readonly cnaSegments = remoteData({
        await: () => [
            this.samplesOfPatient
        ],
        invoke: () => client.fetchCopyNumberSegmentsUsingPOST({
            sampleIdentifiers: this.samplesOfPatient.result!.map(sample => ({
                sampleId: sample.sampleId,
                studyId: this.studyId
            })),
            projection: 'DETAILED',
        })
    }, []);

    readonly clinicalDataForSamples = remoteData({
        await: () => [
            this.samplesOfPatient
        ],
        invoke: () => client.fetchClinicalDataUsingPOST({
            clinicalDataType: 'SAMPLE',
            identifiers: this.samplesOfPatient.result.map(sample => ({
                entityId: sample.sampleId,
                studyId: this.studyId
            })),
            projection: 'DETAILED',
        })
    }, []);

    readonly clinicalDataGroupedBySample = remoteData({
        await:() => [this.clinicalDataForSamples],
        invoke: () => Promise.resolve(groupByEntityId(this.clinicalDataForSamples.result!))
    }, []);

    readonly patientViewData = remoteData({
        await: () => [
            this.clinicalDataPatient,
            this.clinicalDataForSamples
        ],
        invoke: () => Promise.resolve(transformClinicalInformationToStoreShape(
            this.patientId,
            this.studyId,
            this.clinicalDataPatient.result,
            this.clinicalDataForSamples.result
        ))
    },{});

    readonly geneticProfilesInStudy = remoteData(() => client.getAllGeneticProfilesInStudyUsingGET({
        studyId: this.studyId
    }), []);

    private readonly mrnaRankGeneticProfileId = remoteData({
        await: () => [
            this.geneticProfilesInStudy
        ],
        invoke: () => {
            const regex1 = /^.+rna_seq.*_zscores$/; // We prefer profiles that look like this
            const regex2 = /^.*_zscores$/; // If none of the above are available, we'll look for ones like this
            const preferredProfile:(GeneticProfile | undefined) = this.geneticProfilesInStudy.result.find(
                (gp:GeneticProfile) => regex1.test(gp.geneticProfileId.toLowerCase()));

            if (preferredProfile) {
                return Promise.resolve(preferredProfile.geneticProfileId);
            } else {
                const fallbackProfile:(GeneticProfile | undefined) = this.geneticProfilesInStudy.result.find(
                    (gp:GeneticProfile) => regex2.test(gp.geneticProfileId.toLowerCase()));

                return Promise.resolve(fallbackProfile ? fallbackProfile.geneticProfileId : null);
            }
        }
    }, null);

    readonly discreteCNAData = remoteData({

        await: ()=> [
            this.geneticProfilesInStudy,
            this.samplesOfPatient
        ],
        invoke: () => {

            const sampleIds = this.samplesOfPatient.result.map((sample)=>sample.sampleId);

            if (this.geneticProfileIdDiscrete.isComplete && this.geneticProfileIdDiscrete.result) {
                return client.fetchDiscreteCopyNumbersInGeneticProfileUsingPOST({
                    projection: 'DETAILED',
                    discreteCopyNumberFilter: {sampleIds: sampleIds} as DiscreteCopyNumberFilter,
                    geneticProfileId: this.geneticProfileIdDiscrete.result
                });
            } else {
                return Promise.resolve([]);
            }

        }

    },[]);

    readonly geneticProfileIdDiscrete = remoteData({

        await: ()=> [
           this.geneticProfilesInStudy
        ],
        invoke: () => {
            const profile = this.geneticProfilesInStudy.result!.find((profile: GeneticProfile)=> {
                return profile.datatype === 'DISCRETE';
            });
            return (profile) ? Promise.resolve(profile.geneticProfileId) : Promise.resolve(undefined);
        }

    });

    readonly mutationData = remoteData({
        await: () => [
            this.samplesOfPatient
        ],
        invoke: ()=> {
            const geneticProfileId = this.mutationGeneticProfileId;
            if (geneticProfileId) {
                return client.fetchMutationsInGeneticProfileUsingPOST({
                    geneticProfileId: geneticProfileId,
                    sampleIds: this.samplesOfPatient.result.map((sample:Sample) => sample.sampleId),
                    projection: "DETAILED"
                });
            } else {
                return Promise.resolve([]);
            }
    }}, []);

    readonly mrnaExprRankData = remoteData<MrnaRankData>({
        await: () => [
            this.mrnaRankGeneticProfileId,
            this.mutationData
        ],
        invoke: () => {
            const sampleToEntrezGeneIds = _.reduce(this.mutationData.result, (map:{ [s:string]:Set<number> }, next:Mutation) => {
                const sampleId = next.sampleId;
                map[sampleId] = map[sampleId] || new Set();
                map[sampleId].add(next.entrezGeneId);
                return map;
            }, {});

            return new Promise((resolve, reject) => {
                const mrnaPercentiles: MrnaPercentile[] = [];
                const fetchAllMrnaPercentilesPromise = Promise.all(Object.keys(sampleToEntrezGeneIds).map((sampleId:string) =>
                    new Promise((sampleResolve, sampleReject) => {
                        const entrezGeneIds = sampleToEntrezGeneIds[sampleId];
                        if (typeof entrezGeneIds === "undefined" || entrezGeneIds.size === 0 || this.mrnaRankGeneticProfileId.result === null) {
                            sampleResolve();
                        } else {
                            const fetchMrnaPercentilesPromise = internalClient.fetchMrnaPercentileUsingPOST({
                                geneticProfileId:this.mrnaRankGeneticProfileId.result,
                                sampleId:sampleId,
                                entrezGeneIds: Array.from(entrezGeneIds)
                            });
                            fetchMrnaPercentilesPromise.then((d) => {
                                mrnaPercentiles.push.apply(mrnaPercentiles, d);
                                sampleResolve();
                            });
                            fetchMrnaPercentilesPromise.catch(() => sampleReject());
                        }
                    })
                ));
                fetchAllMrnaPercentilesPromise.then(() => {
                    let mrnaRankData:MrnaRankData = mrnaPercentiles.reduce((map: any, next: any) => {
                        map[next.sampleId] = map[next.sampleId] || {};
                        map[next.sampleId][next.entrezGeneId] = {
                            percentile: next.percentile,
                            zScore: next.zScore
                        };
                        return map;
                    }, {});
                    resolve(mrnaRankData);
                });
                fetchAllMrnaPercentilesPromise.catch(() => reject());
            });
        }
    }, {});

    @action("ChangePatientId") changePatientId(newId: string) {
        this.patientId = newId;
    }

}
