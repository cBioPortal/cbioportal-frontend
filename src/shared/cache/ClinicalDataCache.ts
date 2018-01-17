import LazyMobXCache from "../lib/LazyMobXCache";
import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalData, MolecularProfile, MutationCount, Patient, PatientIdentifier, Sample,
    SampleIdentifier
} from "../api/generated/CBioPortalAPI";
import client from "../api/cbioportalClientInstance";
import internalClient from "../api/cbioportalInternalClientInstance";
import _ from "lodash";
import {
    FractionGenomeAltered, FractionGenomeAlteredFilter,
    MutationSpectrum, MutationSpectrumFilter
} from "../api/generated/CBioPortalAPIInternal";

export enum SpecialAttribute {
    MutationCount = "0",
    FractionGenomeAltered = "1",
    MutationSpectrum = "2",
    StudyOfOrigin = "3"
}

interface Query extends ClinicalAttribute {
    clinicalAttributeId: string|SpecialAttribute;
}

function queryToKey(query:Query) {
    return `${query.clinicalAttributeId}~${!!query.patientAttribute}`;
}

function dataToKey(d:any, query:Query) {
    return `${query.clinicalAttributeId}~${!!query.patientAttribute}`;
}

async function fetch(
    queries:Query[],
    samples:Sample[],
    patients:Patient[],
    studyToMutationMolecularProfile:{[studyId:string]:MolecularProfile},
    studyIdToStudy:{[studyId:string]:CancerStudy}
) {
    let resultsPerStudyPerAttribute:Object[][][] =
        await Promise.all(queries.map<any>(q=>{
            let ret:Promise<any[][]>;
            let studyToSamples:{[studyId:string]:Sample[]};
            switch(q.clinicalAttributeId) {
                case SpecialAttribute.MutationCount:
                    studyToSamples = _.groupBy(samples, sample=>sample.studyId);
                    ret = Promise.all(Object.keys(studyToMutationMolecularProfile).map(studyId=>{
                        const samplesInStudy = studyToSamples[studyId];
                        if (samplesInStudy.length) {
                            return client.fetchMutationCountsInMolecularProfileUsingPOST({
                                molecularProfileId: studyToMutationMolecularProfile[studyId].molecularProfileId,
                                sampleIds: samplesInStudy.map(s=>s.sampleId)
                            });
                        } else {
                            return Promise.resolve([]);
                        }
                    }));
                    break;
                case SpecialAttribute.FractionGenomeAltered:
                    studyToSamples = _.groupBy(samples, sample=>sample.studyId);
                    ret = Promise.all(Object.keys(studyToSamples).map(studyId=>{
                        const samplesInStudy = studyToSamples[studyId];
                        if (samplesInStudy.length) {
                            return internalClient.fetchFractionGenomeAlteredUsingPOST({
                                studyId,
                                fractionGenomeAlteredFilter: {
                                    sampleIds: samplesInStudy.map(s=>s.sampleId)
                                } as FractionGenomeAlteredFilter,
                                cutoff: 0.2
                            });
                        } else {
                            return Promise.resolve([]);
                        }
                    }));
                    break;
                case SpecialAttribute.MutationSpectrum:
                    studyToSamples = _.groupBy(samples, sample=>sample.studyId);
                    ret = Promise.all(Object.keys(studyToMutationMolecularProfile).map(studyId=>{
                        const samplesInStudy = studyToSamples[studyId];
                        if (samplesInStudy.length) {
                            return internalClient.fetchMutationSpectrumsUsingPOST({
                                molecularProfileId: studyToMutationMolecularProfile[studyId].molecularProfileId,
                                mutationSpectrumFilter: {
                                    sampleIds: samplesInStudy.map(s=>s.sampleId)
                                } as MutationSpectrumFilter
                            });
                        } else {
                            return Promise.resolve([]);
                        }
                    }));
                    break;
                case SpecialAttribute.StudyOfOrigin:
                    ret = Promise.all([samples.map(sample=>({
                        clinicalAttribute: q,
                        clinicalAttributeId: q.clinicalAttributeId,
                        patientId: sample.patientId,
                        sampleId: sample.sampleId,
                        studyId: sample.studyId,
                        uniquePatientKey: sample.uniquePatientKey,
                        uniqueSampleKey: sample.uniqueSampleKey,
                        value: studyIdToStudy[sample.studyId].name
                    }))]);
                    break;
                default:
                    ret = Promise.all([client.fetchClinicalDataUsingPOST({
                        clinicalDataType: q.patientAttribute ? "PATIENT" : "SAMPLE",
                        clinicalDataMultiStudyFilter: {
                            attributeIds: [q.clinicalAttributeId as string],
                            identifiers: q.patientAttribute ? patients.map(p=>({entityId:p.patientId, studyId:p.studyId})) : samples.map(s=>({entityId:s.sampleId, studyId:s.studyId}))
                        }
                    })]);
                    break;
            }
            return ret;
    }));
    let resultsPerAttribute:Object[][] = resultsPerStudyPerAttribute.map(x=>_.flatten(x)); // make each element the data for a single attribute, aka flatten separate study requests
    return resultsPerAttribute.map((data:any[], index:number)=>({ data:[data], meta:queries[index] }));
}

export default class ClinicalDataCache extends LazyMobXCache<ClinicalData[]|MutationCount[]|FractionGenomeAltered[]|MutationSpectrum[], Query> {
    constructor(
        samples:Sample[],
        patients:Patient[],
        studyToMutationMolecularProfile:{[studyId:string]:MolecularProfile},
        studyIdToStudy:{[studyId:string]:CancerStudy}
    ) {
        super(queryToKey, dataToKey, fetch, samples, patients, studyToMutationMolecularProfile, studyIdToStudy);
    }
}