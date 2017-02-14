import * as _ from 'lodash';
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {ClinicalData, SampleIdentifier,
    GeneticProfile, Sample, Mutation} from "../../../shared/api/CBioPortalAPI";
import {ClinicalInformationData} from "../Connector";
import client from "../../../shared/api/cbioportalClientInstance";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";
import {computed, observable, action} from "../../../../node_modules/mobx/lib/mobx";
import {remoteData} from "../../../shared/api/remoteData";
import {MrnaRankData} from "../mutation/column/MrnaExprColumnFormatter";
import {MrnaPercentile} from "../../../shared/api/CBioPortalAPIInternal";
import {labelMobxPromises} from "../../../shared/api/MobxPromise";
import Immutable from "seamless-immutable";

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

    @observable.ref mrnaExprRankData:MrnaRankData = {};

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
            this.geneticProfilesInStudy,
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

    @action("ChangePatientId") changePatientId(newId: string) {
        this.patientId = newId;
    }
    readonly requestMrnaExprRankData = remoteData({
        await: () => [
            this.mrnaRankGeneticProfileId
        ],
        invoke: () => {
            return Promise.resolve(function(sampleToEntrezGeneIds:{ [sampleId:string]:Set<number> }) {
                // Reference to new immutable map
                // See which we need to fetch, and set "pending" for those data
                const toQuery:{ [sampleId:string]:number[]} = {};
                _.forEach(sampleToEntrezGeneIds, (entrezGeneIds:number[], sampleId:string) => {
                        this.mrnaExprRankData[sampleId] = this.mrnaExprRankData[sampleId] || {};
                        for (const entrezGeneId of entrezGeneIds) {
                            if (!this.mrnaExprRankData[sampleId].hasOwnProperty(entrezGeneId)) {
                                toQuery[sampleId] = toQuery[sampleId] || [];
                                toQuery[sampleId].push(entrezGeneId);
                                this.mrnaExprRankData[sampleId][entrezGeneId] = { status:"pending" };
                            }
                        }
                });
                // Fetch that data
                const mrnaPercentiles: MrnaPercentile[] = [];
                const fetchAllMrnaPercentilesPromise = Promise.all(Object.keys(toQuery).map((sampleId:string) =>
                    new Promise((sampleResolve, sampleReject) => {
                        const entrezGeneIds = toQuery[sampleId];
                        if (this.mrnaRankGeneticProfileId.result === null) {
                            sampleResolve();
                        } else {
                            const fetchMrnaPercentilesPromise = internalClient.fetchMrnaPercentileUsingPOST({
                                geneticProfileId:this.mrnaRankGeneticProfileId.result,
                                sampleId,
                                entrezGeneIds
                            });
                            fetchMrnaPercentilesPromise.then((d) => {
                                mrnaPercentiles.push(...d);
                                sampleResolve();
                            });
                            fetchMrnaPercentilesPromise.catch(() => sampleReject());
                        }
                    })
                ));
                fetchAllMrnaPercentilesPromise.then(() => {
                    const haveData:{ [sampleId:string]: { [entrezGeneId: string]:boolean}} = {};
                    for (const mrnaPercentile of mrnaPercentiles) {
                        // Add data
                        this.mrnaExprRankData[mrnaPercentile.sampleId] = this.mrnaExprRankData[mrnaPercentile.sampleId] || {};
                        this.mrnaExprRankData[mrnaPercentile.sampleId][mrnaPercentile.entrezGeneId] = {
                            status: "available",
                            percentile: mrnaPercentile.percentile,
                            zScore: mrnaPercentile.zScore
                        };
                        // As we go through, keep track of which we have data for
                        haveData[mrnaPercentile.sampleId] = haveData[mrnaPercentile.sampleId] || {};
                        haveData[mrnaPercentile.sampleId][mrnaPercentile.entrezGeneId] = true;
                    }
                    // Go through and mark those we don't have data for as unavailable
                    for (const sampleId in toQuery) {
                        if (toQuery.hasOwnProperty(sampleId)) {
                            for (const entrezGeneId of toQuery[sampleId]) {
                                if (!haveData[sampleId] || !haveData[sampleId][entrezGeneId]) {
                                    this.mrnaExprRankData[sampleId][entrezGeneId] = { status: "not available" };
                                }
                            }
                        }
                    }

                    if (mrnaPercentiles.length > 0) {
                        this.mrnaExprRankData = Object.assign({}, this.mrnaExprRankData); // trigger observable
                    }
                });
                fetchAllMrnaPercentilesPromise.catch(() => {
                    // Delete all the pending statuses for what we queried
                    for (const sampleId in toQuery) {
                        if (toQuery.hasOwnProperty(sampleId)) {
                            for (const entrezGeneId of toQuery[sampleId]) {
                                delete this.mrnaExprRankData[sampleId][entrezGeneId];
                            }
                        }
                    }
                });
            }.bind(this));
        }
    }, ()=>{});

}
