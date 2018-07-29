import MobxPromiseCache from "../lib/MobxPromiseCache";
import {
    CancerStudy, ClinicalAttribute, ClinicalData, GenePanelData, MolecularProfile,
    MutationCount, Patient, Sample
} from "../api/generated/CBioPortalAPI";
import {
    FractionGenomeAltered, FractionGenomeAlteredFilter,
    MutationSpectrum, MutationSpectrumFilter
} from "../api/generated/CBioPortalAPIInternal";
import {MobxPromise} from "mobxpromise";
import {CoverageInformation} from "../../pages/resultsView/ResultsViewPageStoreUtils";
import _ from "lodash";
import client from "../api/cbioportalClientInstance";
import internalClient from "../api/cbioportalInternalClientInstance";
import {OncoprintClinicalAttribute} from "../components/oncoprint/ResultsViewOncoprint";
import {logicalOr} from "../lib/LogicUtils";

export enum SpecialAttribute {
    MutationCount = "MUTATION_COUNT",
    FractionGenomeAltered = "FRACTION_GENOME_ALTERED",
    MutationSpectrum = "NO_CONTEXT_MUTATION_SIGNATURE",
    StudyOfOrigin = "CANCER_STUDY",
    Profiled = "PROFILED_IN"
}

type OncoprintClinicalData = ClinicalData[]|MutationCount[]|FractionGenomeAltered[]|MutationSpectrum[];

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
        const profiled = logicalOr(molecularProfileIds.map(molecularProfileId=>!!allCoverage.find(gpData=>(gpData.molecularProfileId === molecularProfileId))));
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
        case SpecialAttribute.MutationCount:
            studyToSamples = _.groupBy(samples, sample=>sample.studyId);
            ret = _.flatten(await Promise.all(Object.keys(studyToMutationMolecularProfile).map(studyId=>{
                const samplesInStudy = studyToSamples[studyId];
                if (samplesInStudy.length) {
                    return client.fetchMutationCountsInMolecularProfileUsingPOST({
                        molecularProfileId: studyToMutationMolecularProfile[studyId].molecularProfileId,
                        sampleIds: samplesInStudy.map(s=>s.sampleId)
                    });
                } else {
                    return Promise.resolve([]);
                }
            })));
            break;
        case SpecialAttribute.FractionGenomeAltered:
            studyToSamples = _.groupBy(samples, sample=>sample.studyId);
            ret = _.flatten(await Promise.all(Object.keys(studyToSamples).map(studyId=>{
                const samplesInStudy = studyToSamples[studyId];
                if (samplesInStudy.length) {
                    return internalClient.fetchFractionGenomeAlteredUsingPOST({
                        studyId,
                        fractionGenomeAlteredFilter: {
                            sampleIds: samplesInStudy.map(s=>s.sampleId)
                        } as FractionGenomeAlteredFilter
                    });
                } else {
                    return Promise.resolve([]);
                }
            })));
            break;
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
        default:
            if (attribute.clinicalAttributeId.indexOf(SpecialAttribute.Profiled) === 0) {
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
