import MobxPromiseCache from '../lib/MobxPromiseCache';
import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalData,
    GenePanelData,
    MolecularProfile,
    Patient,
    Sample,
} from 'cbioportal-ts-api-client';
import {
    MutationSpectrum,
    MutationSpectrumFilter,
} from 'cbioportal-ts-api-client';
import { MobxPromise } from 'mobxpromise';
import {
    CoverageInformation,
    ExtendedClinicalAttribute,
} from '../../pages/resultsView/ResultsViewPageStoreUtils';
import _ from 'lodash';
import client from '../api/cbioportalClientInstance';
import internalClient from '../api/cbioportalInternalClientInstance';
import { Group } from '../api/ComparisonGroupClient';
import ComplexKeySet from '../lib/complexKeyDataStructures/ComplexKeySet';
import { makeUniqueColorGetter } from '../components/plots/PlotUtils';
import { RESERVED_CLINICAL_VALUE_COLORS } from '../lib/Colors';
import { interpolateReds } from 'd3-scale-chromatic';

export enum SpecialAttribute {
    MutationSpectrum = 'NO_CONTEXT_MUTATION_SIGNATURE',
    StudyOfOrigin = 'CANCER_STUDY',
    ProfiledInPrefix = 'PROFILED_IN',
    ComparisonGroupPrefix = 'IN_COMPARISON_GROUP',
    NumSamplesPerPatient = 'NUM_SAMPLES_PER_PATIENT',
}

const locallyComputedSpecialAttributes = [
    SpecialAttribute.StudyOfOrigin,
    SpecialAttribute.NumSamplesPerPatient,
];

export function clinicalAttributeIsPROFILEDIN(attribute: {
    clinicalAttributeId: string | SpecialAttribute;
}) {
    return attribute.clinicalAttributeId.startsWith(
        SpecialAttribute.ProfiledInPrefix
    );
}

export function clinicalAttributeIsINCOMPARISONGROUP(attribute: {
    clinicalAttributeId: string | SpecialAttribute;
}) {
    return attribute.clinicalAttributeId.startsWith(
        SpecialAttribute.ComparisonGroupPrefix
    );
}

export function clinicalAttributeIsLocallyComputed(attribute: {
    clinicalAttributeId: string | SpecialAttribute;
}) {
    return (
        clinicalAttributeIsPROFILEDIN(attribute) ||
        clinicalAttributeIsINCOMPARISONGROUP(attribute) ||
        locallyComputedSpecialAttributes.indexOf(
            attribute.clinicalAttributeId as any
        ) > -1
    );
}

export type ClinicalDataCacheEntry = {
    categoryToColor?: { [value: string]: string };
    numericalValueToColor?: (x: number) => string;
    logScaleNumericalValueToColor?: (x: number) => string;
    numericalValueRange?: [number, number];
    data: OncoprintClinicalData;
};

type OncoprintClinicalData = ClinicalData[] | MutationSpectrum[];

function makeComparisonGroupData(
    attribute: ExtendedClinicalAttribute,
    samples: Sample[]
): ClinicalData[] {
    const ret = [];
    const samplesInGroup = new ComplexKeySet();
    for (const study of attribute.comparisonGroup!.data.studies) {
        const studyId = study.id;
        for (const sampleId of study.samples) {
            samplesInGroup.add({ studyId, sampleId });
        }
    }
    for (const sample of samples) {
        ret.push({
            clinicalAttribute: attribute as ClinicalAttribute,
            clinicalAttributeId: attribute.clinicalAttributeId,
            patientId: sample.patientId,
            sampleId: sample.sampleId,
            studyId: sample.studyId,
            uniquePatientKey: sample.uniquePatientKey,
            uniqueSampleKey: sample.uniqueSampleKey,
            value: samplesInGroup.has({
                studyId: sample.studyId,
                sampleId: sample.sampleId,
            })
                ? 'Yes'
                : 'No',
        });
    }
    return ret;
}

function makeProfiledData(
    attribute: ExtendedClinicalAttribute,
    samples: Sample[],
    coverageInformation: CoverageInformation
): ClinicalData[] {
    const molecularProfileIds = attribute.molecularProfileIds!;
    const ret = [];
    for (const sample of samples) {
        const coverageInfo =
            coverageInformation.samples[sample.uniqueSampleKey];
        if (!coverageInfo) {
            continue;
        }
        const allCoverage: { molecularProfileId: string }[] = (_.flatten(
            _.values(coverageInfo.byGene)
        ) as { molecularProfileId: string }[]).concat(coverageInfo.allGenes);
        const coveredMolecularProfiles = _.keyBy(
            allCoverage,
            'molecularProfileId'
        );
        const profiled = _.some(
            molecularProfileIds,
            molecularProfileId => molecularProfileId in coveredMolecularProfiles
        );
        if (profiled) {
            ret.push({
                clinicalAttribute: attribute as ClinicalAttribute,
                clinicalAttributeId: attribute.clinicalAttributeId,
                patientId: sample.patientId,
                sampleId: sample.sampleId,
                studyId: sample.studyId,
                uniquePatientKey: sample.uniquePatientKey,
                uniqueSampleKey: sample.uniqueSampleKey,
                value: 'Yes',
            });
        }
    }
    return ret;
}

async function fetch(
    attribute: ExtendedClinicalAttribute,
    samples: Sample[],
    patients: Patient[],
    studyToMutationMolecularProfile: { [studyId: string]: MolecularProfile },
    studyIdToStudy: { [studyId: string]: CancerStudy },
    coverageInformation: CoverageInformation
): Promise<OncoprintClinicalData> {
    let ret: OncoprintClinicalData;
    let studyToSamples: { [studyId: string]: Sample[] };
    switch (attribute.clinicalAttributeId) {
        case SpecialAttribute.MutationSpectrum:
            studyToSamples = _.groupBy(samples, sample => sample.studyId);
            ret = _.flatten(
                await Promise.all(
                    Object.keys(studyToMutationMolecularProfile).map(
                        studyId => {
                            const samplesInStudy = studyToSamples[studyId];
                            if (samplesInStudy.length) {
                                return internalClient.fetchMutationSpectrumsUsingPOST(
                                    {
                                        molecularProfileId:
                                            studyToMutationMolecularProfile[
                                                studyId
                                            ].molecularProfileId,
                                        mutationSpectrumFilter: {
                                            sampleIds: samplesInStudy.map(
                                                s => s.sampleId
                                            ),
                                        } as MutationSpectrumFilter,
                                    }
                                );
                            } else {
                                return Promise.resolve([]);
                            }
                        }
                    )
                )
            );
            break;
        case SpecialAttribute.StudyOfOrigin:
            ret = samples.map(
                sample =>
                    ({
                        clinicalAttribute: attribute,
                        clinicalAttributeId: attribute.clinicalAttributeId,
                        patientId: sample.patientId,
                        sampleId: sample.sampleId,
                        studyId: sample.studyId,
                        uniquePatientKey: sample.uniquePatientKey,
                        uniqueSampleKey: sample.uniqueSampleKey,
                        value: studyIdToStudy[sample.studyId].name,
                    } as ClinicalData)
            );
            break;
        case SpecialAttribute.NumSamplesPerPatient:
            const patientToSamples = _.groupBy(samples, 'uniquePatientKey');
            const patientKeyToPatient = _.keyBy(patients, 'uniquePatientKey');
            ret = _.map(patientToSamples, (samples, patientKey) => {
                const patient = patientKeyToPatient[patientKey];
                return ({
                    clinicalAttribute: attribute,
                    clinicalAttributeId: attribute.clinicalAttributeId,
                    patientId: patient.patientId,
                    uniquePatientKey: patientKey,
                    studyId: patient.studyId,
                    value: samples.length,
                } as any) as ClinicalData;
            });
            break;
        default:
            if (clinicalAttributeIsPROFILEDIN(attribute)) {
                ret = makeProfiledData(attribute, samples, coverageInformation);
            } else if (clinicalAttributeIsINCOMPARISONGROUP(attribute)) {
                ret = makeComparisonGroupData(attribute, samples);
            } else {
                ret = await client.fetchClinicalDataUsingPOST({
                    clinicalDataType: attribute.patientAttribute
                        ? 'PATIENT'
                        : 'SAMPLE',
                    clinicalDataMultiStudyFilter: {
                        attributeIds: [attribute.clinicalAttributeId as string],
                        identifiers: attribute.patientAttribute
                            ? patients.map(p => ({
                                  entityId: p.patientId,
                                  studyId: p.studyId,
                              }))
                            : samples.map(s => ({
                                  entityId: s.sampleId,
                                  studyId: s.studyId,
                              })),
                    },
                });
            }
            break;
    }
    return ret;
}

export default class ClinicalDataCache extends MobxPromiseCache<
    ExtendedClinicalAttribute,
    ClinicalDataCacheEntry
> {
    constructor(
        samplesPromise: MobxPromise<Sample[]>,
        patientsPromise: MobxPromise<Patient[]>,
        studyToMutationMolecularProfilePromise: MobxPromise<{
            [studyId: string]: MolecularProfile;
        }>,
        studyIdToStudyPromise: MobxPromise<{ [studyId: string]: CancerStudy }>,
        coverageInformationPromise: MobxPromise<CoverageInformation>
    ) {
        super(
            q => ({
                await: () => [
                    samplesPromise,
                    patientsPromise,
                    studyToMutationMolecularProfilePromise,
                    studyIdToStudyPromise,
                    coverageInformationPromise,
                ],
                invoke: async () => {
                    const data: OncoprintClinicalData = await fetch(
                        q,
                        samplesPromise.result!,
                        patientsPromise.result!,
                        studyToMutationMolecularProfilePromise.result!,
                        studyIdToStudyPromise.result!,
                        coverageInformationPromise.result!
                    );
                    let categoryToColor;
                    let numericalValueToColor;
                    let logScaleNumericalValueToColor;
                    let numericalValueRange;
                    if (q.datatype === 'STRING') {
                        const colorGetter = makeUniqueColorGetter(
                            _.values(RESERVED_CLINICAL_VALUE_COLORS)
                        );
                        categoryToColor = _.cloneDeep(
                            RESERVED_CLINICAL_VALUE_COLORS
                        );
                        for (const d of data) {
                            if (
                                !((d as ClinicalData).value in categoryToColor)
                            ) {
                                categoryToColor[
                                    (d as ClinicalData).value
                                ] = colorGetter();
                            }
                        }
                    } else if (q.datatype === 'NUMBER') {
                        // TODO: calculate gradient with data
                        const numbers = (data as ClinicalData[]).reduce(
                            (nums, d) => {
                                if (d.value && !isNaN(d.value as any)) {
                                    nums.push(parseFloat(d.value));
                                }
                                return nums;
                            },
                            [] as number[]
                        );
                        const min = _.min(numbers)!;
                        const max = _.max(numbers)!;
                        if (min !== undefined && max !== undefined) {
                            numericalValueToColor = (x: number) =>
                                interpolateReds((x - min) / (max - min));

                            if (min >= 0) {
                                const safeLog = (x: number) => {
                                    return Math.log(Math.max(0.01, x));
                                };
                                const logMin = safeLog(min);
                                const logMax = safeLog(max);
                                logScaleNumericalValueToColor = (x: number) => {
                                    return interpolateReds(
                                        (safeLog(x) - logMin) /
                                            (logMax - logMin)
                                    );
                                };
                            }
                            numericalValueRange = [min, max] as [
                                number,
                                number
                            ];
                        } else {
                            numericalValueToColor = (x: number) => '#000000';
                        }
                    }
                    return {
                        data,
                        categoryToColor,
                        numericalValueToColor,
                        numericalValueRange,
                        logScaleNumericalValueToColor,
                    };
                },
            }),
            q =>
                `${q.clinicalAttributeId},${(q.molecularProfileIds || []).join(
                    '-'
                )},${q.patientAttribute}`
        );
    }
}
