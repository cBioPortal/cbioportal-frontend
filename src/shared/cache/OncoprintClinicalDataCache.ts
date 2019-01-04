import MobxPromiseCache from "../lib/MobxPromiseCache";
import {
    CancerStudy, ClinicalAttribute, ClinicalData, GenePanelData, MolecularProfile,
    Patient, Sample
} from "../api/generated/CBioPortalAPI";
import {
    MutationSpectrum, MutationSpectrumFilter
} from "../api/generated/CBioPortalAPIInternal";
import {MobxPromise} from "mobxpromise";
import {CoverageInformation} from "../../pages/resultsView/ResultsViewPageStoreUtils";
import _ from "lodash";
import client from "../api/cbioportalClientInstance";
import internalClient from "../api/cbioportalInternalClientInstance";
import {OncoprintClinicalAttribute} from "../components/oncoprint/ResultsViewOncoprint";

export enum SpecialAttribute {
    MutationSpectrum = "NO_CONTEXT_MUTATION_SIGNATURE",
    StudyOfOrigin = "CANCER_STUDY",
    ProfiledInPrefix = "PROFILED_IN",
    NumSamplesPerPatient = "NUM_SAMPLES_PER_PATIENT"
}

const locallyComputedSpecialAttributes = [SpecialAttribute.StudyOfOrigin, SpecialAttribute.NumSamplesPerPatient];

export function clinicalAttributeIsPROFILEDIN(attribute:{clinicalAttributeId:string|SpecialAttribute}) {
    return attribute.clinicalAttributeId.startsWith(SpecialAttribute.ProfiledInPrefix);
}

export function clinicalAttributeIsLocallyComputed(attribute:{clinicalAttributeId:string|SpecialAttribute}) {
    return clinicalAttributeIsPROFILEDIN(attribute) || (locallyComputedSpecialAttributes.indexOf(attribute.clinicalAttributeId as any) > -1);
}

type OncoprintClinicalData = ClinicalData[]|MutationSpectrum[];

function makeProfiledData(
    attribute: OncoprintClinicalAttribute,
    samples:Sample[],
    coverageInformation:CoverageInformation,
):ClinicalData[] {
    const molecularProfileIds = attribute.molecularProfileIds!;
    const ret = [];
    for (const sample of samples) {
        const coverageInfo = coverageInformation.samples[sample.uniqueSampleKey];
        if (!coverageInfo) {
            continue;
        }
        const allCoverage:GenePanelData[] = _.flatten(_.values(coverageInfo.byGene)).concat(coverageInfo.allGenes);
        const coveredMolecularProfiles = _.keyBy(allCoverage, "molecularProfileId");
        const profiled = _.some(molecularProfileIds, molecularProfileId=>(molecularProfileId in coveredMolecularProfiles));
        if (profiled) {
            ret.push({
                clinicalAttribute: attribute as ClinicalAttribute,
                clinicalAttributeId: attribute.clinicalAttributeId,
                patientId: sample.patientId,
                sampleId: sample.sampleId,
                studyId: sample.studyId,
                uniquePatientKey: sample.uniquePatientKey,
                uniqueSampleKey: sample.uniqueSampleKey,
                value: "Yes"
            });
        }
    }
    return ret;
}

async function fetch(
    attribute:OncoprintClinicalAttribute,
    samples:Sample[],
    patients:Patient[],
    studyToMutationMolecularProfile:{[studyId:string]:MolecularProfile},
    studyIdToStudy:{[studyId:string]:CancerStudy},
    coverageInformation:CoverageInformation
) {
    let ret:OncoprintClinicalData;
    let studyToSamples:{[studyId:string]:Sample[]};
    switch(attribute.clinicalAttributeId) {
        case SpecialAttribute.MutationSpectrum:
            studyToSamples = _.groupBy(samples, sample=>sample.studyId);
            ret = _.flatten(await Promise.all(Object.keys(studyToMutationMolecularProfile).map(studyId=>{
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
            })));
            break;
        case SpecialAttribute.StudyOfOrigin:
            ret = samples.map(sample=>({
                clinicalAttribute: attribute,
                clinicalAttributeId: attribute.clinicalAttributeId,
                patientId: sample.patientId,
                sampleId: sample.sampleId,
                studyId: sample.studyId,
                uniquePatientKey: sample.uniquePatientKey,
                uniqueSampleKey: sample.uniqueSampleKey,
                value: studyIdToStudy[sample.studyId].name
            } as ClinicalData));
            break;
        case SpecialAttribute.NumSamplesPerPatient:
            const patientToSamples = _.groupBy(samples, "uniquePatientKey");
            const patientKeyToPatient = _.keyBy(patients, "uniquePatientKey");
            ret = _.map(patientToSamples, (samples, patientKey)=>{
                const patient = patientKeyToPatient[patientKey];
                return {
                    clinicalAttribute: attribute,
                    clinicalAttributeId: attribute.clinicalAttributeId,
                    patientId: patient.patientId,
                    uniquePatientKey: patientKey,
                    studyId: patient.studyId,
                    value: samples.length
                } as any as ClinicalData;
            });
            break;
        default:
            if (attribute.clinicalAttributeId.indexOf(SpecialAttribute.ProfiledInPrefix) === 0) {
                ret = makeProfiledData(attribute, samples, coverageInformation);
            } else {
                ret = await client.fetchClinicalDataUsingPOST({
                    clinicalDataType: attribute.patientAttribute ? "PATIENT" : "SAMPLE",
                    clinicalDataMultiStudyFilter: {
                        attributeIds: [attribute.clinicalAttributeId as string],
                        identifiers: attribute.patientAttribute ? patients.map(p=>({entityId:p.patientId, studyId:p.studyId})) : samples.map(s=>({entityId:s.sampleId, studyId:s.studyId}))
                    }
                });
            }
            break;
    }
    return ret;
}

export default class OncoprintClinicalDataCache extends MobxPromiseCache<OncoprintClinicalAttribute, OncoprintClinicalData> {
    constructor(
        samplesPromise:MobxPromise<Sample[]>,
        patientsPromise:MobxPromise<Patient[]>,
        studyToMutationMolecularProfilePromise:MobxPromise<{[studyId:string]:MolecularProfile}>,
        studyIdToStudyPromise:MobxPromise<{[studyId:string]:CancerStudy}>,
        coverageInformationPromise:MobxPromise<CoverageInformation>
    ) {
        super(
            q=>({
                await:()=>[
                    samplesPromise,
                    patientsPromise,
                    studyToMutationMolecularProfilePromise,
                    studyIdToStudyPromise,
                    coverageInformationPromise
                ],
                invoke:()=>fetch(
                    q,
                    samplesPromise.result!,
                    patientsPromise.result!,
                    studyToMutationMolecularProfilePromise.result!,
                    studyIdToStudyPromise.result!,
                    coverageInformationPromise.result!
                )
            }),
            q=>`${q.clinicalAttributeId},${(q.molecularProfileIds || []).join("-")},${q.patientAttribute}`
        );
    }
}
