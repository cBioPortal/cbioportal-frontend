import {
    AnnotatedExtendedAlteration,
    AnnotatedMutation,
    CaseAggregatedData, ExtendedAlteration
} from "../../../pages/resultsView/ResultsViewPageStore";
import {
    ClinicalAttribute,
    ClinicalData,
    NumericGeneMolecularData, GenePanelData, MolecularProfile, Mutation, MutationCount, Patient,
    Sample
} from "../../api/generated/CBioPortalAPI";
import {
    ClinicalTrackDatum,
    GeneticTrackDatum,
    IBaseHeatmapTrackDatum,
    IGeneHeatmapTrackDatum,
} from "./Oncoprint";
import {isMutationCount, isSample, isSampleList} from "../../lib/CBioPortalAPIUtils";
import {getSimplifiedMutationType, SimplifiedMutationType} from "../../lib/oql/accessors";
import _ from "lodash";
import {FractionGenomeAltered, MutationSpectrum} from "../../api/generated/CBioPortalAPIInternal";
import {OncoprintClinicalAttribute} from "./ResultsViewOncoprint";
import {CoverageInformation} from "../../../pages/resultsView/ResultsViewPageStoreUtils";
import { MUTATION_STATUS_GERMLINE } from "shared/constants";
import {SpecialAttribute} from "../../cache/OncoprintClinicalDataCache";

const cnaDataToString:{[integerCNA:string]:string|undefined} = {
    "-2": "homdel",
    "-1": "hetloss",
    "0": undefined,
    "1": "gain",
    "2": "amp"
};
const mutRenderPriority = {
    'trunc_rec':1,
    'inframe_rec':2,
    'missense_rec':3,
    'trunc': 4,
    'inframe': 5,
    'missense': 6
};
const cnaRenderPriority = {
    'amp': 0,
    'homdel': 0,
    'gain': 1,
    'hetloss': 1
};
const mrnaRenderPriority = {
    'up': 0,
    'down': 0
};
const protRenderPriority = {
    'up': 0,
    'down': 0
};

export type OncoprintMutationType = "missense" | "inframe" | "fusion" | "promoter" | "trunc";

export function getOncoprintMutationType(d:Mutation):OncoprintMutationType {
    if ((d.proteinChange || "").toLowerCase() === "promoter") {
        // promoter mutations aren't labeled as such in mutationType, but in proteinChange, so we must detect it there
        return "promoter";
    } else {
        const simplifiedMutationType = getSimplifiedMutationType(d.mutationType);
        switch (simplifiedMutationType) {
            case "missense":
            case "inframe":
            case "fusion":
                return simplifiedMutationType;
            default:
                return "trunc";
        }
    }
}

export function selectDisplayValue(counts:{[value:string]:number}, priority:{[value:string]:number}) {
    const options = Object.keys(counts).map(k=>({key:k, value:counts[k]}));
    if (options.length > 0) {
        options.sort(function (kv1, kv2) {
            const rendering_priority_diff = priority[kv1.key] - priority[kv2.key];
            if (rendering_priority_diff < 0) {
                return -1;
            } else if (rendering_priority_diff > 0) {
                return 1;
            } else {
                if (kv1.value < kv2.value) {
                    return 1;
                } else if (kv1.value > kv2.value) {
                    return -1;
                } else {
                    return 0;
                }
            }
        });
        return options[0].key;
    } else {
        return undefined;
    }
}

export function fillGeneticTrackDatum(
    // must already have all non-disp* fields except trackLabel and data
    newDatum:Partial<GeneticTrackDatum>,
    trackLabel:string,
    data:AnnotatedExtendedAlteration[]
): GeneticTrackDatum {
    newDatum.trackLabel = trackLabel;
    newDatum.data = data;

    let dispFusion = false;
    const dispCnaCounts:{[cnaEvent:string]:number} = {};
    const dispMrnaCounts:{[mrnaEvent:string]:number} = {};
    const dispProtCounts:{[protEvent:string]:number} = {};
    const dispMutCounts:{[mutType:string]:number} = {};
    const dispGermline:{[mutType:string]:boolean} = {};
    const caseInsensitiveGermlineMatch = new RegExp(MUTATION_STATUS_GERMLINE, "i");

    for (const event of data) {
        const molecularAlterationType = event.molecularProfileAlterationType;
        switch (molecularAlterationType) {
            case "COPY_NUMBER_ALTERATION":
                const cnaEvent = cnaDataToString[(event as NumericGeneMolecularData).value];
                if (cnaEvent) {
                    // not diploid
                    dispCnaCounts[cnaEvent] = dispCnaCounts[cnaEvent] || 0;
                    dispCnaCounts[cnaEvent] += 1;
                }
                break;
            case "MRNA_EXPRESSION":
                if (event.alterationSubType) {
                    const mrnaEvent = event.alterationSubType;
                    dispMrnaCounts[mrnaEvent] = dispMrnaCounts[mrnaEvent] || 0;
                    dispMrnaCounts[mrnaEvent] += 1;
                }
                break;
            case "PROTEIN_LEVEL":
                if (event.alterationSubType) {
                    const protEvent = event.alterationSubType;
                    dispProtCounts[protEvent] = dispProtCounts[protEvent] || 0;
                    dispProtCounts[protEvent] += 1;
                }
                break;
            case "MUTATION_EXTENDED":
                let oncoprintMutationType = getOncoprintMutationType(event as Mutation);
                if (oncoprintMutationType === "fusion") {
                    dispFusion = true;
                } else {
                    if (event.putativeDriver) {
                        oncoprintMutationType += "_rec";
                    }
                    dispGermline[oncoprintMutationType] = dispGermline[oncoprintMutationType] || (caseInsensitiveGermlineMatch.test(event.mutationStatus));
                    dispMutCounts[oncoprintMutationType] = dispMutCounts[oncoprintMutationType] || 0;
                    dispMutCounts[oncoprintMutationType] += 1;
                }
                break;
        }
    }
    if (dispFusion) {
        newDatum.disp_fusion = true;
    }
    newDatum.disp_cna = selectDisplayValue(dispCnaCounts, cnaRenderPriority);
    newDatum.disp_mrna = selectDisplayValue(dispMrnaCounts, mrnaRenderPriority);
    newDatum.disp_prot = selectDisplayValue(dispProtCounts, protRenderPriority);
    newDatum.disp_mut = selectDisplayValue(dispMutCounts, mutRenderPriority);
    newDatum.disp_germ = newDatum.disp_mut ? dispGermline[newDatum.disp_mut] : undefined;

    return newDatum as GeneticTrackDatum; // return for convenience, even though changes made in place
}

export function makeGeneticTrackData(
    caseAggregatedAlterationData:CaseAggregatedData<AnnotatedExtendedAlteration>["samples"],
    hugoGeneSymbols:string|string[],
    samples:Sample[],
    genePanelInformation:CoverageInformation,
    selectedMolecularProfiles:MolecularProfile[]
):GeneticTrackDatum[];

export function makeGeneticTrackData(
    caseAggregatedAlterationData:CaseAggregatedData<AnnotatedExtendedAlteration>["patients"],
    hugoGeneSymbols:string|string[],
    patients:Patient[],
    genePanelInformation:CoverageInformation,
    selectedMolecularProfiles:MolecularProfile[]
):GeneticTrackDatum[];

export function makeGeneticTrackData(
    caseAggregatedAlterationData:CaseAggregatedData<AnnotatedExtendedAlteration>["samples"]|CaseAggregatedData<AnnotatedExtendedAlteration>["patients"],
    hugoGeneSymbols:string|string[],
    cases:Sample[]|Patient[],
    genePanelInformation:CoverageInformation,
    selectedMolecularProfiles:MolecularProfile[]
):GeneticTrackDatum[] {
    if (!cases.length) {
        return [];
    }
    const geneSymbolArray = hugoGeneSymbols instanceof Array ? hugoGeneSymbols : [hugoGeneSymbols];
    const _selectedMolecularProfiles = _.keyBy(selectedMolecularProfiles, p=>p.molecularProfileId);
    const ret:GeneticTrackDatum[] = [];
    if (isSampleList(cases)) {
        // case: Samples
        for (const sample of cases) {
            const newDatum:Partial<GeneticTrackDatum> = {};
            newDatum.sample = sample.sampleId;
            newDatum.study_id = sample.studyId;
            newDatum.uid = sample.uniqueSampleKey;

            const sampleSequencingInfo = genePanelInformation.samples[sample.uniqueSampleKey];
            newDatum.profiled_in = _.flatMap(
                geneSymbolArray,
                hugoGeneSymbol => sampleSequencingInfo.byGene[hugoGeneSymbol] || []
            );
            newDatum.profiled_in = newDatum.profiled_in.concat(sampleSequencingInfo.allGenes).filter(p=>!!_selectedMolecularProfiles[p.molecularProfileId]); // filter out coverage information about non-selected profiles
            if (!newDatum.profiled_in.length) {
                newDatum.na = true;
            }
            newDatum.not_profiled_in = _.flatMap(
                geneSymbolArray,
                hugoGeneSymbol => sampleSequencingInfo.notProfiledByGene[hugoGeneSymbol] || []
            );
            newDatum.not_profiled_in = newDatum.not_profiled_in.concat(sampleSequencingInfo.notProfiledAllGenes).filter(p=>!!_selectedMolecularProfiles[p.molecularProfileId]); // filter out coverage information about non-selected profiles

            ret.push(fillGeneticTrackDatum(
                newDatum,
                geneSymbolArray.join(' / '),
                caseAggregatedAlterationData[sample.uniqueSampleKey]
            ));
        }
    } else {
        // case: Patients
        for (const patient of cases) {
            const newDatum:Partial<GeneticTrackDatum> = {};
            newDatum.patient = patient.patientId;
            newDatum.study_id = patient.studyId;
            newDatum.uid = patient.uniquePatientKey;

            const patientSequencingInfo = genePanelInformation.patients[patient.uniquePatientKey];
            newDatum.profiled_in = _.flatMap(
                geneSymbolArray,
                hugoGeneSymbol => patientSequencingInfo.byGene[hugoGeneSymbol] || []
            );
            newDatum.profiled_in = newDatum.profiled_in.concat(patientSequencingInfo.allGenes).filter(p=>!!_selectedMolecularProfiles[p.molecularProfileId]); // filter out coverage information about non-selected profiles
            if (!newDatum.profiled_in.length) {
                newDatum.na = true;
            }
            newDatum.not_profiled_in = _.flatMap(
                geneSymbolArray,
                hugoGeneSymbol => patientSequencingInfo.notProfiledByGene[hugoGeneSymbol] || []
            );
            newDatum.not_profiled_in = newDatum.not_profiled_in.concat(patientSequencingInfo.notProfiledAllGenes).filter(p=>!!_selectedMolecularProfiles[p.molecularProfileId]); // filter out coverage information about non-selected profiles

            ret.push(fillGeneticTrackDatum(
                newDatum,
                geneSymbolArray.join(' / '),
                caseAggregatedAlterationData[patient.uniquePatientKey]
            ));
        }
    }
    return ret;
}

export function fillHeatmapTrackDatum<T extends IBaseHeatmapTrackDatum, K extends keyof T>(
    trackDatum: Partial<T>,
    featureKey: K,
    featureId: T[K],
    case_:Sample|Patient,
    data?: {value: number}[]
) {
    trackDatum[featureKey] = featureId;
    trackDatum.study = case_.studyId;
    if (!data || !data.length) {
        trackDatum.profile_data = null;
        trackDatum.na = true;
    } else if (data.length === 1) {
        trackDatum.profile_data = data[0].value;
    } else {
        if (isSample(case_)) {
            throw Error("Unexpectedly received multiple heatmap profile data for one sample");
        } else {
            // aggregate samples for this patient by selecting the highest absolute (Z-)score
            trackDatum.profile_data = data.reduce(
                (maxInAbsVal: number, next) => {
                    const val = next.value;
                    if (Math.abs(val) > Math.abs(maxInAbsVal)) {
                        return val;
                    } else {
                        return maxInAbsVal;
                    }
                },
                0);
        }
    }
    return trackDatum;
}

export function makeHeatmapTrackData<T extends IBaseHeatmapTrackDatum, K extends keyof T>(
    featureKey: K,
    featureId: T[K],
    cases:Sample[]|Patient[],
    data: {value: number, uniquePatientKey: string, uniqueSampleKey: string}[]
): T[] {
    if (!cases.length) {
        return [];
    }
    const sampleData = isSampleList(cases);
    let keyToData:{[uniqueKey:string]:{value: number}[]};
    let ret: T[];
    if (isSampleList(cases)) {
        keyToData = _.groupBy(data, d=>d.uniqueSampleKey);
        ret = cases.map(c=>{
            const trackDatum: Partial<T> = {};
            trackDatum.sample = c.sampleId;
            trackDatum.uid = c.uniqueSampleKey;
            const caseData = keyToData[c.uniqueSampleKey];
            fillHeatmapTrackDatum(trackDatum, featureKey, featureId, c, caseData);
            return trackDatum as T;
        });
    } else {
        keyToData = _.groupBy(data, d=>d.uniquePatientKey);
        ret = cases.map(c=>{
            const trackDatum: Partial<T> = {};
            trackDatum.patient = c.patientId;
            trackDatum.uid = c.uniquePatientKey;
            const caseData = keyToData[c.uniquePatientKey];
            fillHeatmapTrackDatum(trackDatum, featureKey, featureId, c, caseData);
            return trackDatum as T;
        });
    }
    return ret;
}

function fillNoDataValue(
    trackDatum:Partial<ClinicalTrackDatum>,
    attribute:OncoprintClinicalAttribute,
) {
    if (attribute.clinicalAttributeId === SpecialAttribute.MutationCount) {
        trackDatum.attr_val = 0;
    } else {
        trackDatum.na = true;
    }
}
export function fillClinicalTrackDatum(
    trackDatum:Partial<ClinicalTrackDatum>,
    attribute:OncoprintClinicalAttribute,
    case_:Sample|Patient,
    data?:(ClinicalData|MutationCount|FractionGenomeAltered|MutationSpectrum)[],
) {
    trackDatum.attr_id = attribute.clinicalAttributeId;
    trackDatum.study_id = case_.studyId;
    trackDatum.attr_val_counts = {};

    if (!data || !data.length) {
        fillNoDataValue(trackDatum, attribute);
    } else {
        if (attribute.datatype.toLowerCase() === "number") {
            let numValCount = 0;
            let numValSum = 0;
            for (const x of data) {
                if (isMutationCount(x)) {
                    numValCount += 1;
                    numValSum += x.mutationCount;
                } else {
                    const newVal = parseFloat((x as ClinicalData|FractionGenomeAltered).value+"");
                    if (!isNaN(newVal)) {
                        numValCount += 1;
                        numValSum += newVal;
                    }
                }
            }
            if (numValCount === 0) {
                fillNoDataValue(trackDatum, attribute);
            } else {
                // average
                trackDatum.attr_val = numValSum / numValCount;
                trackDatum.attr_val_counts[trackDatum.attr_val] = 1;
            }
        } else if (attribute.datatype.toLowerCase() === "string") {
            const attr_val_counts = trackDatum.attr_val_counts;
            for (const datum of (data as ClinicalData[])) {
                attr_val_counts[datum.value] = attr_val_counts[datum.value] || 0;
                attr_val_counts[datum.value] += 1;
            }
            const attr_vals = Object.keys(attr_val_counts);
            if (attr_vals.length > 1) {
                trackDatum.attr_val = "Mixed";
            } else {
                trackDatum.attr_val = attr_vals[0];
            }
        } else if (attribute.clinicalAttributeId === SpecialAttribute.MutationSpectrum) {
            const spectrumData = data as MutationSpectrum[];
            // add up vectors
            const attr_val_counts = trackDatum.attr_val_counts;
            attr_val_counts["C>A"] = 0;
            attr_val_counts["C>G"] = 0;
            attr_val_counts["C>T"] = 0;
            attr_val_counts["T>A"] = 0;
            attr_val_counts["T>C"] = 0;
            attr_val_counts["T>G"] = 0;
            for (const datum of spectrumData) {
                attr_val_counts["C>A"] += datum.CtoA;
                attr_val_counts["C>G"] += datum.CtoG;
                attr_val_counts["C>T"] += datum.CtoT;
                attr_val_counts["T>A"] += datum.TtoA;
                attr_val_counts["T>C"] += datum.TtoC;
                attr_val_counts["T>G"] += datum.TtoG;
            }
            // if all 0, then NA
            if (attr_val_counts["C>A"] === 0 &&
                attr_val_counts["C>G"] === 0 &&
                attr_val_counts["C>T"] === 0 &&
                attr_val_counts["T>A"] === 0 &&
                attr_val_counts["T>C"] === 0 &&
                attr_val_counts["T>G"] === 0) {
                fillNoDataValue(trackDatum, attribute);
            }
            trackDatum.attr_val = trackDatum.attr_val_counts;
        }
    }
    return trackDatum;
}

function makeGetDataForCase(
    attribute: ClinicalAttribute,
    queryBy:"sample"|"patient",
    data: (ClinicalData|MutationCount|FractionGenomeAltered|MutationSpectrum)[]
):(case_:Sample|Patient)=>(ClinicalData|MutationCount|FractionGenomeAltered|MutationSpectrum)[] {
    if (attribute.patientAttribute) {
        const uniqueKeyToData = _.groupBy(data, datum=>datum.uniquePatientKey);
        return function(case_:Sample|Patient) {
            return uniqueKeyToData[case_.uniquePatientKey];
        };
    } else {
        const getKey = queryBy === "sample" ?
            (x:{uniqueSampleKey:string, uniquePatientKey:string})=>x.uniqueSampleKey :
            (x:{uniqueSampleKey:string, uniquePatientKey:string})=>x.uniquePatientKey;
        const uniqueKeyToData:any = _.groupBy(data, getKey);
        return function (case_:Sample|Patient) {
            return uniqueKeyToData[getKey(case_)];
        }
    }
}

export function makeClinicalTrackData(
    attribute:ClinicalAttribute,
    cases:Sample[]|Patient[],
    data: (ClinicalData|MutationCount|FractionGenomeAltered|MutationSpectrum)[],
):ClinicalTrackDatum[] {
    // First collect all the data by id
    const uniqueKeyToData:{[uniqueKey:string]:(ClinicalData|MutationCount|FractionGenomeAltered|MutationSpectrum)[]}
        = _.groupBy(data,
        isSampleList(cases) ?
            datum=>datum.uniqueSampleKey :
            datum=>datum.uniquePatientKey);

    // Create oncoprint data
    const getDataForCase = makeGetDataForCase(
        attribute, ((isSampleList(cases)) ? "sample" : "patient"), data
    );

    let ret:ClinicalTrackDatum[];
    if (isSampleList(cases)) {
        ret = cases.map(sample=>{
            const trackDatum:Partial<ClinicalTrackDatum> = {};
            trackDatum.uid = sample.uniqueSampleKey;
            trackDatum.sample = sample.sampleId;
            fillClinicalTrackDatum(
                trackDatum,
                attribute,
                sample,
                getDataForCase(sample)
            );
            return trackDatum as ClinicalTrackDatum;
        });
    } else {
        ret = cases.map(patient=>{
            const trackDatum:Partial<ClinicalTrackDatum> = {};
            trackDatum.uid = patient.uniquePatientKey;
            trackDatum.patient = patient.patientId;
            fillClinicalTrackDatum(
                trackDatum,
                attribute,
                patient,
                getDataForCase(patient)
            );
            return trackDatum as ClinicalTrackDatum;
        });
    }
    return ret;
}
