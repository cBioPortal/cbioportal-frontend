import LazyMobXCache from "../lib/LazyMobXCache";
import {
    ClinicalData, MolecularProfile, MutationCount, PatientIdentifier, Sample,
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
    MutationSpectrum = "2"
}

type SpecialQuery = {
    clinicalAttributeId: SpecialAttribute;
    patientAttribute?:boolean;
}
type NormalQuery = {
    clinicalAttributeId: string;
    patientAttribute: boolean;
}
type Query = SpecialQuery | NormalQuery;

function queryToKey(query:Query) {
    return `${query.clinicalAttributeId}~${!!query.patientAttribute}`;
}

function dataToKey(d:any, query:Query) {
    return `${query.clinicalAttributeId}~${!!query.patientAttribute}`;
}

async function fetch(
    queries:Query[],
    samples:SampleIdentifier[],
    patients:PatientIdentifier[],
    studyToMutationMolecularProfile:{[studyId:string]:MolecularProfile}
) {
    let resultsPerStudyPerAttribute:Object[][][] =
        await Promise.all(queries.map<any>(q=>{
        if (q.clinicalAttributeId === SpecialAttribute.MutationCount) {
            const studyToSamples = _.groupBy(samples, sample=>sample.studyId);
            return Promise.all(Object.keys(studyToMutationMolecularProfile).map(studyId=>{
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
        } else if (q.clinicalAttributeId === SpecialAttribute.FractionGenomeAltered) {
            const studyToSamples = _.groupBy(samples, sample=>sample.studyId);
            return Promise.all(Object.keys(studyToSamples).map(studyId=>{
                const samplesInStudy = studyToSamples[studyId];
                if (samplesInStudy.length) {
                    return internalClient.fetchFractionGenomeAlteredUsingPOST({
                        studyId,
                        fractionGenomeAlteredFilter: {
                            sampleIds: samplesInStudy.map(s=>s.sampleId)
                        } as FractionGenomeAlteredFilter,
                        cutoff: 0
                    });
                } else {
                    return Promise.resolve([]);
                }
            }));
        } else if (q.clinicalAttributeId === SpecialAttribute.MutationSpectrum) {
            const studyToSamples = _.groupBy(samples, sample=>sample.studyId);
            return Promise.all(Object.keys(studyToMutationMolecularProfile).map(studyId=>{
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
        } else {
            const normalQuery = q as NormalQuery;
            return Promise.all([client.fetchClinicalDataUsingPOST({
                clinicalDataType: normalQuery.patientAttribute ? "PATIENT" : "SAMPLE",
                clinicalDataMultiStudyFilter: {
                    attributeIds: [normalQuery.clinicalAttributeId],
                    identifiers: normalQuery.patientAttribute ? patients.map(p=>({entityId:p.patientId, studyId:p.studyId})) : samples.map(s=>({entityId:s.sampleId, studyId:s.studyId}))
                }
            })]);
        }
    }));
    let resultsPerAttribute:Object[][] = resultsPerStudyPerAttribute.map(x=>_.flatten(x)); // make each element the data for a single attribute, aka flatten separate study requests
    return resultsPerAttribute.map((data:any[], index:number)=>({ data:[data], meta:queries[index] }));
}

export default class ClinicalDataCache extends LazyMobXCache<ClinicalData[]|MutationCount[]|FractionGenomeAltered[]|MutationSpectrum[], Query> {
    constructor(
        samples:SampleIdentifier[],
        patients:PatientIdentifier[],
        studyToMutationMolecularProfile:{[studyId:string]:MolecularProfile}
    ) {
        super(queryToKey, dataToKey, fetch, samples, patients, studyToMutationMolecularProfile);
    }
}