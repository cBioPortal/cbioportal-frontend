import {
    AnnotatedExtendedAlteration,
    AnnotatedMutation,
    CaseAggregatedData, ExtendedAlteration,
    GenePanelInformation
} from "../../../pages/resultsView/ResultsViewPageStore";
import {
    ClinicalAttribute,
    ClinicalData,
    GeneMolecularData, GenePanelData, MolecularProfile, Mutation, MutationCount, Patient,
    Sample
} from "../../api/generated/CBioPortalAPI";
import {ClinicalTrackDatum, GeneticTrackDatum, HeatmapTrackDatum} from "./Oncoprint";
import {isMutationCount, isSample, isSampleList} from "../../lib/CBioPortalAPIUtils";
import {getSimplifiedMutationType, SimplifiedMutationType} from "../../lib/oql/accessors";
import _ from "lodash";
import {FractionGenomeAltered, MutationSpectrum} from "../../api/generated/CBioPortalAPIInternal";
import {SpecialAttribute} from "../../cache/ClinicalDataCache";

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

export type OncoprintMutationType = "missense" | "inframe" | "fusion" | "trunc";

export function getOncoprintMutationType(type:SimplifiedMutationType):OncoprintMutationType {
    if (type === "missense" || type === "inframe" || type === "fusion") {
        return type;
    } else {
        return "trunc";
    }
}

function selectDisplayValue(counts:{[value:string]:number}, priority:{[value:string]:number}) {
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
};

function fillGeneticTrackDatum(
    newDatum:Partial<GeneticTrackDatum>,
    hugoGeneSymbol:string,
    data:AnnotatedExtendedAlteration[]
):void {
    newDatum.gene = hugoGeneSymbol;
    newDatum.data = data;

    let dispFusion = false;
    const dispCnaCounts:{[cnaEvent:string]:number} = {};
    const dispMrnaCounts:{[mrnaEvent:string]:number} = {};
    const dispProtCounts:{[protEvent:string]:number} = {};
    const dispMutCounts:{[mutType:string]:number} = {};

    for (const event of data) {
        const molecularAlterationType = event.molecularProfileAlterationType;
        switch (molecularAlterationType) {
            case "COPY_NUMBER_ALTERATION":
                const cnaEvent = cnaDataToString[(event as GeneMolecularData).value];
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
                let oncoprintMutationType = getOncoprintMutationType(getSimplifiedMutationType(event.mutationType)!);
                if (oncoprintMutationType === "fusion") {
                    dispFusion = true;
                } else {
                    if (event.putativeDriver) {
                        oncoprintMutationType += "_rec";
                    }
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
}

export function makeGeneticTrackData(
    caseAggregatedAlterationData:CaseAggregatedData<AnnotatedExtendedAlteration>["samples"],
    hugoGeneSymbol:string,
    samples:Sample[],
    genePanelInformation:GenePanelInformation
):GeneticTrackDatum[];

export function makeGeneticTrackData(
    caseAggregatedAlterationData:CaseAggregatedData<AnnotatedExtendedAlteration>["patients"],
    hugoGeneSymbol:string,
    patients:Patient[],
    genePanelInformation:GenePanelInformation
):GeneticTrackDatum[];

export function makeGeneticTrackData(
    caseAggregatedAlterationData:CaseAggregatedData<AnnotatedExtendedAlteration>["samples"]|CaseAggregatedData<AnnotatedExtendedAlteration>["patients"],
    hugoGeneSymbol:string,
    cases:Sample[]|Patient[],
    genePanelInformation:GenePanelInformation
):GeneticTrackDatum[] {
    if (!cases.length) {
        return [];
    }
    const ret:GeneticTrackDatum[] = [];
    if (isSampleList(cases)) {
        // case: Samples
        for (const sample of cases) {
            const newDatum:Partial<GeneticTrackDatum> = {};
            newDatum.sample = sample.sampleId;
            newDatum.study_id = sample.studyId;
            newDatum.uid = sample.uniqueSampleKey;

            const sampleSequencingInfo = genePanelInformation.samples[sample.uniqueSampleKey];
            if (!sampleSequencingInfo.wholeExomeSequenced && !sampleSequencingInfo.sequencedGenes.hasOwnProperty(hugoGeneSymbol)) {
                newDatum.na = true;
            } else {
                if (sampleSequencingInfo.sequencedGenes[hugoGeneSymbol]) {
                    newDatum.coverage = sampleSequencingInfo.sequencedGenes[hugoGeneSymbol];
                }
                if (sampleSequencingInfo.wholeExomeSequenced) {
                    newDatum.wholeExomeSequenced = true;
                }
            }
            fillGeneticTrackDatum(
                newDatum, hugoGeneSymbol,
                caseAggregatedAlterationData[sample.uniqueSampleKey]
            );
            ret.push(newDatum as GeneticTrackDatum);
        }
    } else {
        // case: Patients
        for (const patient of cases) {
            const newDatum:Partial<GeneticTrackDatum> = {};
            newDatum.patient = patient.patientId;
            newDatum.study_id = patient.studyId;
            newDatum.uid = patient.uniquePatientKey;

            const patientSequencingInfo = genePanelInformation.patients[patient.uniquePatientKey];
            if (!patientSequencingInfo.wholeExomeSequenced && !patientSequencingInfo.sequencedGenes.hasOwnProperty(hugoGeneSymbol)) {
                newDatum.na = true;
            } else {
                if (patientSequencingInfo.sequencedGenes[hugoGeneSymbol]) {
                    newDatum.coverage = patientSequencingInfo.sequencedGenes[hugoGeneSymbol];
                }
                if (patientSequencingInfo.wholeExomeSequenced) {
                    newDatum.wholeExomeSequenced = true;
                }
            }
            fillGeneticTrackDatum(
                newDatum, hugoGeneSymbol,
                caseAggregatedAlterationData[patient.uniquePatientKey]
            );
            ret.push(newDatum as GeneticTrackDatum);
        }
    }
    return ret;
}


function fillHeatmapTrackDatum(
    trackDatum: Partial<HeatmapTrackDatum>,
    hugoGeneSymbol: string,
    case_:Sample|Patient,
    data?:GeneMolecularData[]
) {
    trackDatum.hugo_gene_symbol = hugoGeneSymbol;
    trackDatum.study = case_.studyId;
    if (!data || !data.length) {
        trackDatum.profile_data = null;
        trackDatum.na = true;
    } else if (data.length === 1) {
        trackDatum.profile_data = parseFloat(data[0].value);
    } else {
        if (isSample(case_)) {
            throw Error("Unexpectedly received multiple heatmap profile data for one sample");
        } else {
            // aggregate samples for this patient by selecting the highest absolute (Z-)score
            trackDatum.profile_data = data.reduce((maxInAbsVal:number, next:GeneMolecularData)=>{
                const val = parseFloat(next.value);
                if (Math.abs(val) > Math.abs(maxInAbsVal)) {
                    return val;
                } else {
                    return maxInAbsVal;
                }
            }, 0);
        }
    }
    return trackDatum;
}

export function makeHeatmapTrackData(
    hugoGeneSymbol: string,
    cases:Sample[]|Patient[],
    data: GeneMolecularData[]
):HeatmapTrackDatum[] {
    if (!cases.length) {
        return [];
    }
    const sampleData = isSampleList(cases);
    let keyToData:{[uniqueKey:string]:GeneMolecularData[]};
    let ret:HeatmapTrackDatum[];
    if (isSampleList(cases)) {
        keyToData = _.groupBy(data, d=>d.uniqueSampleKey);
        ret = cases.map(c=>{
            const trackDatum:Partial<HeatmapTrackDatum> = {};
            trackDatum.sample = c.sampleId;
            trackDatum.uid = c.uniqueSampleKey;
            const data = keyToData[c.uniqueSampleKey];
            fillHeatmapTrackDatum(trackDatum, hugoGeneSymbol, c, data);
            return trackDatum as HeatmapTrackDatum;
        });
    } else {
        keyToData = _.groupBy(data, d=>d.uniquePatientKey);
        ret = cases.map(c=>{
            const trackDatum:Partial<HeatmapTrackDatum> = {};
            trackDatum.patient = c.patientId;
            trackDatum.uid = c.uniquePatientKey;
            const data = keyToData[c.uniquePatientKey];
            fillHeatmapTrackDatum(trackDatum, hugoGeneSymbol, c, data);
            return trackDatum as HeatmapTrackDatum;
        });
    }
    return ret;
}

function fillNoDataValue(
    trackDatum:Partial<ClinicalTrackDatum>,
    attribute:ClinicalAttribute,
) {
    if (attribute.clinicalAttributeId === SpecialAttribute.MutationCount) {
        trackDatum.attr_val = 0;
    } else {
        trackDatum.na = true;
    }
}
function fillClinicalTrackDatum(
    trackDatum:Partial<ClinicalTrackDatum>,
    attribute:ClinicalAttribute,
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
            datum=>datum.uniquePatientKey);// TS error will be gone when ersin updates API

    // Create oncoprint data
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
                uniqueKeyToData[sample.uniqueSampleKey]
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
                uniqueKeyToData[patient.uniquePatientKey]
            );
            return trackDatum as ClinicalTrackDatum;
        });
    }
    return ret;
}