import {
    AnnotatedExtendedAlteration,
    AnnotatedMutation,
    CaseAggregatedData, ExtendedAlteration
} from "../../../pages/resultsView/ResultsViewPageStore";
import {
    ClinicalAttribute,
    ClinicalData,
    NumericGeneMolecularData, GenePanelData, MolecularProfile, Mutation, Patient,
    Sample
} from "../../api/generated/CBioPortalAPI";
import {
    ClinicalTrackDatum,
    GeneticTrackDatum, GeneticTrackDatum_Data,
    IBaseHeatmapTrackDatum,
    IGeneHeatmapTrackDatum,
} from "./Oncoprint";
import {isSample, isSampleList} from "../../lib/CBioPortalAPIUtils";
import {getSimplifiedMutationType, SimplifiedMutationType} from "../../lib/oql/AccessorsForOqlFilter";
import _ from "lodash";
import {MutationSpectrum} from "../../api/generated/CBioPortalAPIInternal";
import {CoverageInformation, ExtendedClinicalAttribute} from "../../../pages/resultsView/ResultsViewPageStoreUtils";
import { MUTATION_STATUS_GERMLINE } from "shared/constants";
import {SpecialAttribute} from "../../cache/ClinicalDataCache";
import {stringListToIndexSet} from "../../../public-lib/lib/StringUtils";
import {isNotGermlineMutation} from "../../lib/MutationUtils";
import { alphabeticalDefault } from "./SortUtils";

const cnaDataToString:{[integerCNA:string]:string|undefined} = {
    "-2": "homdel",
    "-1": "hetloss",
    "0": undefined,
    "1": "gain",
    "2": "amp"
};
const mutRenderPriority = stringListToIndexSet([
    'trunc_rec',
    'inframe_rec',
    'promoter_rec',
    'missense_rec',
    'other_rec',
    'trunc',
    'inframe',
    'promoter',
    'missense',
    'other'
]);
const cnaRenderPriority = {
    'amp': 0,
    'homdel': 0,
    'gain': 1,
    'hetloss': 1
};
const mrnaRenderPriority = {
    'high': 0,
    'low': 0
};
const protRenderPriority = {
    'high': 0,
    'low': 0
};

type HeatmapCaseDatum = {
    value:number;
    thresholdType?: '<'|'>';
};

export type OncoprintMutationType = "missense" | "inframe" | "fusion" | "promoter" | "trunc" | "other";

export function getOncoprintMutationType(d:Pick<Mutation, "proteinChange"|"mutationType">):OncoprintMutationType {
    if ((d.proteinChange || "").toLowerCase() === "promoter") {
        // promoter mutations aren't labeled as such in mutationType, but in proteinChange, so we must detect it there
        return "promoter";
    } else {
        const simplifiedMutationType = getSimplifiedMutationType(d.mutationType);
        switch (simplifiedMutationType) {
            case "missense":
            case "inframe":
            case "fusion":
            case "other":
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
    data:GeneticTrackDatum_Data[]
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
                const cnaEvent = cnaDataToString[event.value as NumericGeneMolecularData["value"]];
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
                let oncoprintMutationType = getOncoprintMutationType(event as Pick<Mutation, "proteinChange"|"mutationType">);
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
    selectedMolecularProfiles:MolecularProfile[],
):GeneticTrackDatum[];

export function makeGeneticTrackData(
    caseAggregatedAlterationData:CaseAggregatedData<AnnotatedExtendedAlteration>["patients"],
    hugoGeneSymbols:string|string[],
    patients:Patient[],
    genePanelInformation:CoverageInformation,
    selectedMolecularProfiles:MolecularProfile[],
):GeneticTrackDatum[];

export function makeGeneticTrackData(
    caseAggregatedAlterationData:CaseAggregatedData<AnnotatedExtendedAlteration>["samples"]|CaseAggregatedData<AnnotatedExtendedAlteration>["patients"],
    hugoGeneSymbols:string|string[],
    cases:Sample[]|Patient[],
    genePanelInformation:CoverageInformation,
    selectedMolecularProfiles:MolecularProfile[],
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
            newDatum.patient = sample.patientId;
            newDatum.study_id = sample.studyId;
            newDatum.uid = sample.uniqueSampleKey;

            const sampleSequencingInfo = genePanelInformation.samples[sample.uniqueSampleKey];
            newDatum.profiled_in = _.flatMap(
                geneSymbolArray,
                hugoGeneSymbol => sampleSequencingInfo.byGene[hugoGeneSymbol] || []
            );
            newDatum.profiled_in = newDatum.profiled_in.concat(sampleSequencingInfo.allGenes).filter(p=>!!_selectedMolecularProfiles[p.molecularProfileId]); // filter out coverage information about non-selected profiles
            if (!newDatum.profiled_in!.length) {
                newDatum.na = true;
            }
            newDatum.not_profiled_in = _.flatMap(
                geneSymbolArray,
                hugoGeneSymbol => sampleSequencingInfo.notProfiledByGene[hugoGeneSymbol] || []
            );
            newDatum.not_profiled_in = newDatum.not_profiled_in.concat(sampleSequencingInfo.notProfiledAllGenes).filter(p=>!!_selectedMolecularProfiles[p.molecularProfileId]); // filter out coverage information about non-selected profiles

            let sampleData = caseAggregatedAlterationData[sample.uniqueSampleKey];
            ret.push(fillGeneticTrackDatum(
                newDatum,
                geneSymbolArray.join(' / '),
                sampleData
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
            if (!newDatum.profiled_in!.length) {
                newDatum.na = true;
            }
            newDatum.not_profiled_in = _.flatMap(
                geneSymbolArray,
                hugoGeneSymbol => patientSequencingInfo.notProfiledByGene[hugoGeneSymbol] || []
            );
            newDatum.not_profiled_in = newDatum.not_profiled_in.concat(patientSequencingInfo.notProfiledAllGenes).filter(p=>!!_selectedMolecularProfiles[p.molecularProfileId]); // filter out coverage information about non-selected profiles

            let patientData = caseAggregatedAlterationData[patient.uniquePatientKey];
            ret.push(fillGeneticTrackDatum(
                newDatum,
                geneSymbolArray.join(' / '),
                patientData
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
    data?:HeatmapCaseDatum[],
    sortOrder?: string
) {
    trackDatum[featureKey] = featureId;
    trackDatum.study_id = case_.studyId;

    // remove data points of which `value` is NaN
    const dataWithValue =  _.filter(data, (d) => !isNaN(d.value));

    if (!dataWithValue || !dataWithValue.length) {
        trackDatum.profile_data = null;
        trackDatum.na = true;
    } else if (dataWithValue.length === 1) {
        trackDatum.profile_data = dataWithValue[0].value;
        if (dataWithValue[0].thresholdType) {
            trackDatum.thresholdType = dataWithValue[0].thresholdType;
            trackDatum.category = trackDatum.profile_data && trackDatum.thresholdType? `${trackDatum.thresholdType}${trackDatum.profile_data.toFixed(2)}` : undefined;
        }
    } else {
        if (isSample(case_)) {
            throw Error("Unexpectedly received multiple heatmap profile data for one sample");
        } else {

            // aggregate samples for this patient by selecting the highest absolute (Z-)score
            // default: the most extreme value (pos. or neg.) is shown for data
            // sortOrder=ASC: the smallest value is shown for data
            // sortOrder=DESC: the largest value is shown for data
            let representingDatum;
            switch (sortOrder) {
                case "ASC":
                    let bestValue = _(dataWithValue).map((d:HeatmapCaseDatum)=>d.value).min();
                    representingDatum = selectRepresentingDataPoint(bestValue!, dataWithValue, false);
                    break;
                case "DESC":
                    bestValue = _(dataWithValue).map((d:HeatmapCaseDatum)=>d.value).max();
                    representingDatum = selectRepresentingDataPoint(bestValue!, dataWithValue, false);
                    break;
                default:
                    bestValue = _.maxBy(dataWithValue,(d:HeatmapCaseDatum) => Math.abs(d.value))!.value;
                    representingDatum = selectRepresentingDataPoint(bestValue, dataWithValue, true);
                    break;
            }
            
            // `data` can contain data points with only NaN values
            // this is detected by `representingDatum` to be undefined
            // in that case select the first element as representing datum
            if (representingDatum === undefined) {
                representingDatum = dataWithValue[0];
            }

            trackDatum.profile_data = representingDatum!.value;
            if (representingDatum!.thresholdType) {
                trackDatum.thresholdType = representingDatum!.thresholdType;
                trackDatum.category = trackDatum.thresholdType? `${trackDatum.thresholdType}${trackDatum.profile_data.toFixed(2)}` : undefined;
            }

        }
    }
    return trackDatum;
}

function selectRepresentingDataPoint(bestValue:number, data:HeatmapCaseDatum[], useAbsolute:boolean):HeatmapCaseDatum {

    const fFilter = useAbsolute? (d:HeatmapCaseDatum) => Math.abs(d.value) === bestValue : (d:HeatmapCaseDatum) => d.value === bestValue;
    const selData = _.filter(data, fFilter);
    const selDataNoTreshold = _.filter(selData, (d:HeatmapCaseDatum) => !d.thresholdType);
    if (selDataNoTreshold.length > 0) {
        return selDataNoTreshold[0];
    } else {
        return selData[0];
    }
}

export function makeHeatmapTrackData<T extends IBaseHeatmapTrackDatum, K extends keyof T>(
    featureKey: K,
    featureId: T[K],
    cases:Sample[]|Patient[],
    data: {value: number, uniquePatientKey: string, uniqueSampleKey: string, thresholdType?: ">"|"<"}[],
    sortOrder?: string
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
            fillHeatmapTrackDatum(trackDatum, featureKey, featureId, c, caseData, sortOrder);
            return trackDatum as T;
        });
    }
    return ret;
}

function fillNoDataValue(
    trackDatum:Partial<ClinicalTrackDatum>,
    attribute:ExtendedClinicalAttribute,
) {
    if (attribute.clinicalAttributeId === "MUTATION_COUNT") {
        trackDatum.attr_val = 0;
    } else {
        trackDatum.na = true;
    }
}
export function fillClinicalTrackDatum(
    trackDatum:Partial<ClinicalTrackDatum>,
    attribute:ExtendedClinicalAttribute,
    case_:Sample|Patient,
    data?:(ClinicalData|MutationSpectrum)[],
) {
    trackDatum.attr_id = attribute.clinicalAttributeId;
    trackDatum.study_id = case_.studyId;
    trackDatum.attr_val_counts = {};

    if (!data || !data.length) {
        fillNoDataValue(trackDatum, attribute);
    } else {
        if (attribute.datatype.toLowerCase() === "number") {
            let values = [];
            for (const x of data) {
                const newVal = parseFloat((x as ClinicalData).value+"");
                if (!isNaN(newVal)) {
                    values.push(newVal);
                }
            }
            if (values.length === 0) {
                fillNoDataValue(trackDatum, attribute);
            } else {
                switch (attribute.clinicalAttributeId) {
                    case "MUTATION_COUNT":
                        // max
                        trackDatum.attr_val = values.reduce((max, nextVal)=>Math.max(max, nextVal), Number.NEGATIVE_INFINITY);
                        break;
                    default:
                        // average
                        trackDatum.attr_val = values.reduce((sum, nextVal)=>sum+nextVal, 0) / values.length;
                        break;
                }
                trackDatum.attr_val_counts[trackDatum.attr_val!] = 1;
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
    data: (ClinicalData|MutationSpectrum)[]
):(case_:Sample|Patient)=>(ClinicalData|MutationSpectrum)[] {
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
    data: (ClinicalData|MutationSpectrum)[],
):ClinicalTrackDatum[] {
    // First collect all the data by id
    const uniqueKeyToData:{[uniqueKey:string]:(ClinicalData|MutationSpectrum)[]}
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
