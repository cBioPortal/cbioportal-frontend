import {AxisMenuSelection, ViewType} from "./PlotsTab";
import {MobxPromise} from "mobxpromise";
import {
    CancerStudy,
    ClinicalAttribute, ClinicalData, Gene, MolecularProfile, Mutation, NumericGeneMolecularData,
    Sample
} from "../../../shared/api/generated/CBioPortalAPI";
import {remoteData} from "../../../shared/api/remoteData";
import MobxPromiseCache from "../../../shared/lib/MobxPromiseCache";
import {IBaseScatterPlotData} from "../../../shared/components/plots/ScatterPlot";
import {getSampleViewUrl} from "../../../shared/api/urls";
import _ from "lodash";
import * as React from "react";
import {
    getOncoprintMutationType, OncoprintMutationType,
    selectDisplayValue
} from "../../../shared/components/oncoprint/DataUtils";
import {stringListToIndexSet} from "../../../shared/lib/StringUtils";
import {
    CNA_COLOR_AMP,
    CNA_COLOR_GAIN,
    CNA_COLOR_HETLOSS,
    CNA_COLOR_HOMDEL,
    DEFAULT_GREY,
    MUT_COLOR_FUSION, MUT_COLOR_INFRAME, MUT_COLOR_INFRAME_PASSENGER,
    MUT_COLOR_MISSENSE, MUT_COLOR_MISSENSE_PASSENGER, MUT_COLOR_PROMOTER, MUT_COLOR_TRUNC, MUT_COLOR_TRUNC_PASSENGER
} from "../../../shared/components/oncoprint/geneticrules";
import {CoverageInformation} from "../ResultsViewPageStoreUtils";
import {IBoxScatterPlotData} from "../../../shared/components/plots/BoxScatterPlot";
import {AlterationTypeConstants, AnnotatedMutation} from "../ResultsViewPageStore";
import numeral from "numeral";
import {getUniqueSampleKeyToCategories} from "../../../shared/components/plots/TablePlotUtils";
import client from "../../../shared/api/cbioportalClientInstance";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";
import { FractionGenomeAlteredFilter } from "shared/api/generated/CBioPortalAPIInternal";
import {SpecialAttribute} from "../../../shared/cache/OncoprintClinicalDataCache";
import {getDeterministicRandomNumber, getJitterForCase} from "../../../shared/components/plots/PlotUtils";

export const CLIN_ATTR_DATA_TYPE = "clinical_attribute";
export const dataTypeToDisplayType:{[s:string]:string} = {
    "COPY_NUMBER_ALTERATION": "Copy Number",
    "MRNA_EXPRESSION": "mRNA",
    "PROTEIN_LEVEL": "Protein Level",
    "METHYLATION": "DNA Methylation",
    [CLIN_ATTR_DATA_TYPE]:"Clinical Attribute"
};

export const dataTypeDisplayOrder = [CLIN_ATTR_DATA_TYPE, "MRNA_EXPRESSION", "COPY_NUMBER_ALTERATION", "PROTEIN_LEVEL", "METHYLATION"];
export function sortMolecularProfilesForDisplay(profiles:MolecularProfile[]) {
    if (!profiles.length) {
        return [];
    }

    const type = profiles[0].molecularAlterationType;
    let sortBy:(p:MolecularProfile)=>any;
    switch (type) {
        case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
            sortBy = p=>(p.datatype === "DISCRETE" ? 0 : 1);
            break;
        default:
            sortBy = p=>p.name;
            break;
    }
    return _.sortBy<MolecularProfile>(profiles, sortBy);
}

export const CNA_STROKE_WIDTH = 1.8;
export const PLOT_SIDELENGTH = 650;


export interface IAxisData {
    data:{
        uniqueSampleKey:string;
        value:string|number;
    }[];
    hugoGeneSymbol?:string;
    datatype:string;//"string" or "number"
};

export interface IStringAxisData {
    data:{
        uniqueSampleKey:string;
        value:string;
    }[];
    categoryOrder?:string[];
    hugoGeneSymbol?:string;
    datatype:string;
};
export interface INumberAxisData {
    data:{
        uniqueSampleKey:string;
        value:number;
    }[];
    hugoGeneSymbol?:string;
    datatype:string;
}

export enum MutationSummary {
    Neither="Neither", Both="Both", One="One"
}

const NOT_PROFILED_MUTATION_LEGEND_LABEL = ["Not profiled","for mutations"];
const NOT_PROFILED_CNA_LEGEND_LABEL = ["Not profiled", "for copy number", "alterations"];
const MUTATION_TYPE_NOT_PROFILED = "not_profiled_mutation";
const MUTATION_TYPE_NOT_MUTATED = "not_mutated";

export interface IScatterPlotSampleData {
    uniqueSampleKey:string;
    sampleId:string;
    studyId:string;
    dispCna?:NumericGeneMolecularData;
    dispMutationType?:OncoprintMutationType;
    dispMutationSummary?:MutationSummary;
    profiledCna?:boolean;
    profiledMutations?:boolean;
    mutations: AnnotatedMutation[];
    copyNumberAlterations: NumericGeneMolecularData[];
}

export interface IScatterPlotData extends IScatterPlotSampleData, IBaseScatterPlotData {};

export interface IBoxScatterPlotPoint extends IScatterPlotSampleData {
    category:string;
    value:number;
    jitter:number;
}

export function isStringData(d:IAxisData): d is IStringAxisData {
    return d.datatype === "string";
}
export function isNumberData(d:IAxisData): d is INumberAxisData {
    return d.datatype === "number";
}

export function sortScatterPlotDataForZIndex<D extends Pick<IScatterPlotSampleData, "dispMutationType" | "dispMutationSummary" | "profiledMutations">>(
    data: D[],
    viewType:ViewType,
    highlight: (d:D)=>boolean
) {
    // sort by render priority
    switch (viewType) {
        case ViewType.MutationTypeAndCopyNumber:
        case ViewType.MutationType:
            data = _.sortBy<D>(data, d=>{
                if (d.dispMutationType! in mutationRenderPriority) {
                    return -mutationRenderPriority[d.dispMutationType!]
                } else if (!d.dispMutationType) {
                    return -mutationRenderPriority[MUTATION_TYPE_NOT_MUTATED];
                } else if (!d.profiledMutations) {
                    return -mutationRenderPriority[MUTATION_TYPE_NOT_PROFILED];
                } else {
                    return Number.NEGATIVE_INFINITY;
                }
            });
            break;
        case ViewType.MutationSummary:
            data = _.sortBy<D>(data, d=>{
                if (d.dispMutationSummary! in mutationSummaryRenderPriority) {
                    return -mutationSummaryRenderPriority[d.dispMutationSummary!]        ;
                } else if (!d.profiledMutations) {
                    return -mutationSummaryRenderPriority[MUTATION_TYPE_NOT_PROFILED];
                } else {
                    return Number.NEGATIVE_INFINITY;
                }
            });
            break;
    }
    // Now that we've sorted by render order, put highlighted data on top
    const highlighted = [];
    const unhighlighted = [];
    for (const d of data) {
        if (highlight(d)) {
            highlighted.push(d);
        } else {
            unhighlighted.push(d);
        }
    }
    return unhighlighted.concat(highlighted);
}

export function scatterPlotSize(
    d:IScatterPlotSampleData,
    active:boolean,
    isHighlighted:boolean
) {
    if (isHighlighted) {
        return 8;
    } else if (active) {
        return 6;
    } else {
        return 4;
    }
}

export function scatterPlotLegendData(
    data:IScatterPlotSampleData[],
    viewType:ViewType,
    mutationDataExists: MobxPromise<boolean>,
    cnaDataExists: MobxPromise<boolean>,
    driversAnnotated: boolean
) {
    const _mutationDataExists = mutationDataExists.isComplete && mutationDataExists.result;
    const _cnaDataExists = cnaDataExists.isComplete && cnaDataExists.result;
    if (viewType === ViewType.CopyNumber && _cnaDataExists) {
        return scatterPlotCnaLegendData(data);
    } else if (viewType === ViewType.MutationType && _mutationDataExists) {
        return scatterPlotMutationLegendData(data, driversAnnotated, true);
    } else if (viewType === ViewType.MutationSummary && _mutationDataExists) {
        return scatterPlotMutationSummaryLegendData(data);
    } else if (viewType === ViewType.MutationTypeAndCopyNumber && _mutationDataExists && _cnaDataExists) {
        return scatterPlotMutationLegendData(data, driversAnnotated, false).concat(scatterPlotCnaLegendData(data));
    }
    return [];
}

function scatterPlotMutationSummaryLegendData(
    data:IScatterPlotSampleData[]
) {
    let showNotProfiledElement = false;
    const unique =
        _.chain(data)
        .map(d=>{
            const ret = d.dispMutationSummary;
            if (!d.profiledMutations) {
                showNotProfiledElement = true;
            }
            return ret;
        }).uniq().filter(x=>!!x).value();
    // no data, not profiled

    const legendData:any[] = mutationSummaryLegendOrder.filter(x=>(unique.indexOf(x) > -1)).map((x:MutationSummary)=>{
        const appearance = mutationSummaryToAppearance[x];
        return {
            name: appearance.legendLabel,
            symbol: {
                stroke: appearance.stroke,
                strokeOpacity: appearance.strokeOpacity,
                fill: appearance.fill,
                type: "circle"
            }
        };
    });
    if (showNotProfiledElement) {
        legendData.push({
            name: NOT_PROFILED_MUTATION_LEGEND_LABEL,
            symbol: {
                stroke: notProfiledAppearance.stroke,
                strokeOpacity: notProfiledAppearance.strokeOpacity,
                fill: notProfiledAppearance.fill,
                type: "circle"
            }
        });
    }
    return legendData;
}

function scatterPlotMutationLegendData(
    data:IScatterPlotSampleData[],
    driversAnnotated:boolean,
    showStroke:boolean
) {
    const oncoprintMutationTypeToAppearance = driversAnnotated ? oncoprintMutationTypeToAppearanceDrivers: oncoprintMutationTypeToAppearanceDefault;
    let showNoMutationElement = false;
    let showNotProfiledElement = false;
    const uniqueMutations =
        _.chain(data)
            .map(d=>{
                const ret = d.dispMutationType? d.dispMutationType : null;
                if (!d.profiledMutations) {
                    showNotProfiledElement = true;
                }
                return ret;
            })
            .uniq()
            .filter(x=>{
                const ret = !!x;
                if (!ret) {
                    showNoMutationElement = true;
                }
                return ret;
            })
            .keyBy(x=>x)
            .value();

    const legendData:any[] =
        _.chain(mutationLegendOrder)
        .filter(type=>!!uniqueMutations[type])
        .map(type=>{
            const appearance = oncoprintMutationTypeToAppearance[type];
            return {
                name: appearance.legendLabel,
                symbol: {
                    stroke: appearance.stroke,
                    strokeOpacity: (showStroke ? appearance.strokeOpacity : 0),
                    fill: appearance.fill,
                    type: appearance.symbol
                }
            };
        })
        .value();
    if (showNoMutationElement) {
        legendData.push({
            name: noMutationAppearance.legendLabel,
            symbol: {
                stroke: noMutationAppearance.stroke,
                strokeOpacity: (showStroke ? noMutationAppearance.strokeOpacity : 0),
                fill: noMutationAppearance.fill,
                type: noMutationAppearance.symbol
            }
        });
    }
    if (showNotProfiledElement) {
        legendData.push({
            name: NOT_PROFILED_MUTATION_LEGEND_LABEL,
            symbol: {
                stroke: notProfiledAppearance.stroke,
                strokeOpacity: notProfiledAppearance.strokeOpacity, // always show because its white
                fill: notProfiledAppearance.fill,
                type: "circle"
            }
        });
    }
    return legendData;
}

function scatterPlotCnaLegendData(
    data:IScatterPlotSampleData[]
) {
    let showNoCnaElement = false;
    let showNotProfiledElement = false;
    const uniqueDispCna =
        _.chain(data)
        .map(d=>{
            const ret = d.dispCna ? d.dispCna.value : null;
            if (!d.profiledCna) {
                showNotProfiledElement = true;
            }
            return ret;
        })
        .uniq()
        .filter(x=>{
            const ret = x !== null;
            if (!ret) {
                showNoCnaElement = true;
            }
            return ret;
        })
        .sortBy((v:number)=>-v) // sorted descending
        .value();

    const legendData:any[] = uniqueDispCna.map(v=>{
        const appearance = cnaToAppearance[v as -2|-1|0|1|2];
        return {
            name: appearance.legendLabel,
            symbol: {
                stroke: appearance.stroke,
                fillOpacity: 0,
                type: "circle",
                strokeWidth: CNA_STROKE_WIDTH
            }
        };
    });
    if (showNoCnaElement) {
        legendData.push({
            name: noCnaAppearance.legendLabel,
            symbol: {
                stroke: noCnaAppearance.stroke,
                fillOpacity: 0,
                type: "circle",
                strokeWidth: CNA_STROKE_WIDTH
            }
        });
    }
    if (showNotProfiledElement) {
        legendData.push({
            name: NOT_PROFILED_CNA_LEGEND_LABEL,
            symbol: {
                stroke: notProfiledAppearance.stroke,
                fill: notProfiledAppearance.fill,
                type: "circle",
                strokeWidth: CNA_STROKE_WIDTH
            }
        });
    }
    return legendData;
}

function makeAxisDataPromise_Clinical(
    attribute:ClinicalAttribute,
    clinicalDataCache:MobxPromiseCache<ClinicalAttribute, ClinicalData[]>,
    patientKeyToSamples:MobxPromise<{[uniquePatientKey:string]:Sample[]}>,
    studyToMutationMolecularProfile: MobxPromise<{[studyId: string]: MolecularProfile}>
):MobxPromise<IAxisData> {
    const promise = clinicalDataCache.get(attribute);
    let ret:MobxPromise<IAxisData>;
    switch(attribute.clinicalAttributeId) {
        case SpecialAttribute.MutationCount:
            let mutationCounts = remoteData({
                await:()=>[patientKeyToSamples, studyToMutationMolecularProfile],
                invoke:()=>{
                    const _patientKeyToSamples = patientKeyToSamples.result!;
                    const _studyToMutationMolecularProfile = studyToMutationMolecularProfile.result!;
                    // get all samples
                    let samples = _.flatten(_.values(_patientKeyToSamples));
                    // produce sample data from patient clinical data
                    let mutationCounts = client.fetchMutationCountsInMolecularProfileUsingPOST({
                        molecularProfileId: _studyToMutationMolecularProfile[attribute.studyId].molecularProfileId,
                        sampleIds: samples.map(s=>s.sampleId)
                        });
                    return Promise.resolve(mutationCounts);
                }
            });
            ret = remoteData({
                await:()=>[mutationCounts],
                invoke:()=>{
                    const _mutationCounts = mutationCounts.result!;
                    const axisData:IAxisData = { data:[], datatype:attribute.datatype.toLowerCase() };
                    const axisData_Data = axisData.data;
                    for (const mutationCount of _mutationCounts) {
                        axisData_Data.push({
                            uniqueSampleKey: mutationCount.uniqueSampleKey,
                            value: mutationCount.mutationCount,
                        });
                    }
                    return Promise.resolve(axisData);
                }
            });
            break;
        case SpecialAttribute.FractionGenomeAltered:
            let fractionGenomeAltered = remoteData({
                await:()=>[patientKeyToSamples, studyToMutationMolecularProfile],
                invoke:()=>{
                    const _patientKeyToSamples = patientKeyToSamples.result!;
                    const _studyToMutationMolecularProfile = studyToMutationMolecularProfile.result!;
                    const _studyId = attribute.studyId;
                    // get all samples
                    let samples = _.flatten(_.values(_patientKeyToSamples));
                    let sampleIds = samples.map(s=>s.sampleId);
                    // produce sample data from patient clinical data
                    let fractionGenomeAltered = internalClient.fetchFractionGenomeAlteredUsingPOST({
                        studyId: _studyId,
                        fractionGenomeAlteredFilter: {
                            sampleIds: sampleIds
                        } as FractionGenomeAlteredFilter
                    });
                    return Promise.resolve(fractionGenomeAltered);
                }
            });
            ret = remoteData({
                await:()=>[fractionGenomeAltered],
                invoke:()=>{
                    const _fractionGenomeAltered = fractionGenomeAltered.result!;
                    const axisData:IAxisData = { data:[], datatype:attribute.datatype.toLowerCase() };
                    const axisData_Data = axisData.data;
                    for (const fractionGenomeAlteredItems of _fractionGenomeAltered) {
                        axisData_Data.push({
                            uniqueSampleKey: fractionGenomeAlteredItems.uniqueSampleKey,
                            value: fractionGenomeAlteredItems.value,
                        });
                    }
                    return Promise.resolve(axisData);
                }
            });
            break;
        default:
            ret = remoteData({
                await:()=>[promise, patientKeyToSamples],
                invoke:()=>{
                    const _patientKeyToSamples = patientKeyToSamples.result!;
                    const data:ClinicalData[] = promise.result!;
                    const axisData:IAxisData = { data:[], datatype:attribute.datatype.toLowerCase() };
                    const shouldParseFloat = attribute.datatype.toLowerCase() === "number";
                    const axisData_Data = axisData.data;
                    if (attribute.patientAttribute) {
                        // produce sample data from patient clinical data
                        for (const d of data) {
                            const samples = _patientKeyToSamples[d.uniquePatientKey];
                            for (const sample of samples) {
                                axisData_Data.push({
                                    uniqueSampleKey: sample.uniqueSampleKey,
                                    value: d.value,
                                });
                            }
                        }
                    } else {
                        // produce sample data from sample clinical data
                        for (const d of data) {
                            axisData_Data.push({
                                uniqueSampleKey: d.uniqueSampleKey,
                                value: d.value
                            });
                        }
                    }
                    if (shouldParseFloat) {
                        for (const d of axisData_Data) {
                            d.value = parseFloat(d.value as string); // we know its a string bc all clinical data comes back as string
                        }
                    }
                    return Promise.resolve(axisData);
                }
            });
        break;
    }
    return ret;
}

function makeAxisDataPromise_Molecular(
    entrezGeneId:number,
    molecularProfileId:string,
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>,
    entrezGeneIdToGene:MobxPromise<{[entrezGeneId:number]:Gene}>,
    molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>
):MobxPromise<IAxisData> {
    const promise = numericGeneMolecularDataCache.get({
        entrezGeneId: entrezGeneId,
        molecularProfileId: molecularProfileId
    });
    return remoteData({
        await:()=>[promise, entrezGeneIdToGene, molecularProfileIdToMolecularProfile],
        invoke:()=>{
            const profile = molecularProfileIdToMolecularProfile.result![molecularProfileId];
            const isDiscreteCna = (profile.molecularAlterationType === AlterationTypeConstants.COPY_NUMBER_ALTERATION
                                    && profile.datatype === "DISCRETE");
            const data:NumericGeneMolecularData[] = promise.result!;
            return Promise.resolve({
                data: data.map(d=>{
                    let value = d.value;
                    if (isDiscreteCna) {
                        const appearance = (cnaToAppearance as any)[d.value];
                        if (appearance) {
                            value = appearance.legendLabel;
                        }
                    }
                    return {
                        uniqueSampleKey: d.uniqueSampleKey,
                        value
                    }
                }),
                hugoGeneSymbol: entrezGeneIdToGene.result![entrezGeneId].hugoGeneSymbol,
                datatype: isDiscreteCna ? "string" : "number",
                categoryOrder: isDiscreteCna ? cnaCategoryOrder : undefined
            });
        }
    });
}

export function makeAxisDataPromise(
    selection:AxisMenuSelection,
    clinicalAttributeIdToClinicalAttribute:MobxPromise<{[clinicalAttributeId:string]:ClinicalAttribute}>,
    molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>,
    patientKeyToSamples:MobxPromise<{[uniquePatientKey:string]:Sample[]}>,
    entrezGeneIdToGene:MobxPromise<{[entrezGeneId:number]:Gene}>,
    clinicalDataCache:MobxPromiseCache<ClinicalAttribute, ClinicalData[]>,
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>,
    studyToMutationMolecularProfile: MobxPromise<{[studyId: string]: MolecularProfile}>
):MobxPromise<IAxisData> {

    let ret:MobxPromise<IAxisData> = remoteData(()=>new Promise<IAxisData>(()=>0)); // always isPending
    switch (selection.dataType) {
        case CLIN_ATTR_DATA_TYPE:
            if (selection.dataSourceId !== undefined && clinicalAttributeIdToClinicalAttribute.isComplete) {
                const attribute = clinicalAttributeIdToClinicalAttribute.result![selection.dataSourceId];
                ret = makeAxisDataPromise_Clinical(attribute, clinicalDataCache, patientKeyToSamples, studyToMutationMolecularProfile);
            }
            break;
        default:
            // molecular profile
            if (selection.entrezGeneId !== undefined && selection.dataSourceId !== undefined) {
                ret = makeAxisDataPromise_Molecular(
                    selection.entrezGeneId, selection.dataSourceId, numericGeneMolecularDataCache,
                    entrezGeneIdToGene, molecularProfileIdToMolecularProfile
                );
            }
            break;
    }
    return ret;
}

export function tableCellTextColor(val:number, min:number, max:number) {
    if (val > (max+min)/2) {
        return "rgb(255,255,255)";
    } else {
        return "rgb(0,0,0)";
    }
}

export function getAxisLabel(
    selection:AxisMenuSelection,
    molecularProfileIdToMolecularProfile:{[molecularProfileId:string]:MolecularProfile},
    entrezGeneIdToGene:{[entrezGeneId:number]:Gene},
    clinicalAttributeIdToClinicalAttribute:{[clinicalAttributeId:string]:ClinicalAttribute}
) {
    let ret = "";
    switch (selection.dataType) {
        case CLIN_ATTR_DATA_TYPE:
            const attribute = clinicalAttributeIdToClinicalAttribute[selection.dataSourceId!];
            if (attribute) {
                ret = attribute.displayName;
            }
            break;
        default:
            // molecular profile
            const profile = molecularProfileIdToMolecularProfile[selection.dataSourceId!];
            if (profile && selection.entrezGeneId !== undefined) {
                ret = `${entrezGeneIdToGene[selection.entrezGeneId].hugoGeneSymbol}: ${profile.name}`;
            }
            break;
    }
    return ret;
}

export function getAxisDescription(
    selection:AxisMenuSelection,
    molecularProfileIdToMolecularProfile:{[molecularProfileId:string]:MolecularProfile},
    clinicalAttributeIdToClinicalAttribute:{[clinicalAttributeId:string]:ClinicalAttribute}
) {
    let ret = "";
    switch (selection.dataType) {
        case CLIN_ATTR_DATA_TYPE:
            const attribute = clinicalAttributeIdToClinicalAttribute[selection.dataSourceId!];
            if (attribute) {
                ret = attribute.description;
            }
            break;
        default:
            // molecular profile
            const profile = molecularProfileIdToMolecularProfile[selection.dataSourceId!];
            if (profile) {
                ret = profile.description;
            }
            break;
    }
    return ret;
}

const NON_CNA_STROKE_OPACITY = 0.5;

export const oncoprintMutationTypeToAppearanceDrivers:{[mutType:string]:{symbol:string, fill:string, stroke:string, strokeOpacity:number, legendLabel:string}}
= {
    "inframe": {
        symbol : "circle",
        fill : MUT_COLOR_INFRAME_PASSENGER,
        stroke : "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel : "Inframe (VUS)"
    },
    "inframe.driver": {
        symbol : "circle",
        fill: MUT_COLOR_INFRAME,
        stroke : "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel : "Inframe (Driver)"
    },
    "missense":{
        symbol : "circle",
        fill : MUT_COLOR_MISSENSE_PASSENGER,
        stroke : "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel : "Missense (VUS)"
    },
    "missense.driver":{
        symbol : "circle",
        fill : MUT_COLOR_MISSENSE,
        stroke : "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel : "Missense (Driver)"
    },
    "fusion":{
        symbol: "circle",
        fill: MUT_COLOR_FUSION,
        stroke: "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel: "Fusion"
    },
    "trunc":{
        symbol: "circle",
        fill: MUT_COLOR_TRUNC_PASSENGER,
        stroke: "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel: "Truncating (VUS)"
    },
    "trunc.driver":{
        symbol: "circle",
        fill: MUT_COLOR_TRUNC,
        stroke: "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel: "Truncating (Driver)"
    },
    "promoter":{
        symbol: "circle",
        fill: MUT_COLOR_PROMOTER,
        stroke: "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel: "Promoter"
    }
};

export const oncoprintMutationTypeToAppearanceDefault:{[mutType:string]:{symbol:string, fill:string, stroke:string, strokeOpacity:number, legendLabel:string}}
    = {
    "inframe": {
        symbol : "circle",
        fill: MUT_COLOR_INFRAME,
        stroke : "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel : "Inframe"
    },
    "missense":{
        symbol : "circle",
        fill : MUT_COLOR_MISSENSE,
        stroke : "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel : "Missense"
    },
    "fusion":{
        symbol: "circle",
        fill: MUT_COLOR_FUSION,
        stroke: "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel: "Fusion"
    },
    "trunc":{
        symbol: "circle",
        fill: MUT_COLOR_TRUNC,
        stroke: "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel: "Truncating"
    },
    "promoter":{
        symbol: "circle",
        fill: MUT_COLOR_PROMOTER,
        stroke: "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel: "Promoter"
    }
};

export const notProfiledAppearance = {
    symbol: "circle",
    fill: "#ffffff",
    stroke: "#000000",
    strokeOpacity:0.3,
};

export const mutationLegendOrder = [
    "fusion",
    "promoter.driver", "promoter",
    "trunc.driver", "trunc",
    "inframe.driver", "inframe",
    "missense.driver", "missense"
];
export const mutationRenderPriority = stringListToIndexSet([
    "fusion", "promoter.driver", "trunc.driver", "inframe.driver", "missense.driver",
    "promoter", "trunc", "inframe", "missense", MUTATION_TYPE_NOT_MUTATED, MUTATION_TYPE_NOT_PROFILED
]);

export const noMutationAppearance = {
    symbol : "circle",
    fill: "#c4e5f5",
    stroke : "#000000",
    strokeOpacity:0.3,
    legendLabel : "Not mutated"
};

export const mutationSummaryToAppearance = {
    "Neither":{
        fill: "#00AAF8",
        stroke: "#0089C6",
        strokeOpacity:1,
        legendLabel: "Neither mutated"
    },
    "One":{
        fill : "#DBA901",
        stroke : "#886A08",
        strokeOpacity:1,
        legendLabel : "One Gene mutated"
    },
    "Both":{
        fill : "#FF0000",
        stroke : "#B40404",
        strokeOpacity:1,
        legendLabel: "Both mutated"
    }
};
export const mutationSummaryLegendOrder = [MutationSummary.Both, MutationSummary.One, MutationSummary.Neither];
export const mutationSummaryRenderPriority = stringListToIndexSet((mutationSummaryLegendOrder as any[]).concat(MUTATION_TYPE_NOT_PROFILED));

const cnaToAppearance = {
    "-2":{
        legendLabel: "Deep Deletion",
        stroke:CNA_COLOR_HOMDEL,
        strokeOpacity:1,
    },
    "-1":{
        legendLabel: "Shallow Deletion",
        stroke:"#2aced4",
        strokeOpacity:1,
    },
    "0":{
        legendLabel: "Diploid",
        stroke:DEFAULT_GREY,
        strokeOpacity:1,
    },
    "1":{
        legendLabel: "Gain",
        stroke: "#ff8c9f",
        strokeOpacity:1,
    },
    "2":{
        legendLabel: "Amplification",
        stroke: CNA_COLOR_AMP,
        strokeOpacity:1,
    }
};

const noCnaAppearance = {
    stroke: "#333333",
    strokeOpacity:1,
    legendLabel: "No CNA data",
};

const cnaCategoryOrder = ["-2", "-1", "0", "1", "2"].map(x=>(cnaToAppearance as any)[x].legendLabel);

function getMutationTypeAppearance(d:IScatterPlotSampleData, oncoprintMutationTypeToAppearance:{[mutType:string]:{symbol:string, fill:string, stroke:string, strokeOpacity:number, legendLabel:string}}) {
    if (!d.profiledMutations) {
        return notProfiledAppearance;
    } else if (!d.dispMutationType) {
        return noMutationAppearance;
    } else {
        return oncoprintMutationTypeToAppearance[d.dispMutationType];
    }
}
function getCopyNumberAppearance(d:IScatterPlotSampleData) {
    if (!d.profiledCna) {
        return notProfiledAppearance;
    } else if (!d.dispCna) {
        return noCnaAppearance;
    } else {
        return cnaToAppearance[d.dispCna.value as -2 | -1 | 0 | 1 | 2];
    }
}

export function makeScatterPlotPointAppearance(
    viewType: ViewType,
    mutationDataExists: MobxPromise<boolean>,
    cnaDataExists: MobxPromise<boolean>,
    driversAnnotated: boolean
):(d:IScatterPlotSampleData)=>{ stroke:string, strokeOpacity:number, fill?:string, symbol?:string} {
    const oncoprintMutationTypeToAppearance = driversAnnotated ? oncoprintMutationTypeToAppearanceDrivers: oncoprintMutationTypeToAppearanceDefault;
    switch (viewType) {
        case ViewType.MutationTypeAndCopyNumber:
            if (cnaDataExists.isComplete && cnaDataExists.result && mutationDataExists.isComplete && mutationDataExists.result) {
                return (d:IScatterPlotSampleData)=>{
                    const cnaAppearance = getCopyNumberAppearance(d);
                    const mutAppearance = getMutationTypeAppearance(d, oncoprintMutationTypeToAppearance);
                    return Object.assign({}, mutAppearance, cnaAppearance); // overwrite with cna stroke
                };
            }
            break;
        case ViewType.CopyNumber:
            if (cnaDataExists.isComplete && cnaDataExists.result) {
                return getCopyNumberAppearance;
            }
            break;
        case ViewType.MutationType:
            if (mutationDataExists.isComplete && mutationDataExists.result) {
                return (d:IScatterPlotSampleData)=>getMutationTypeAppearance(d, oncoprintMutationTypeToAppearance);
            }
            break;
        case ViewType.MutationSummary:
            if (mutationDataExists.isComplete && mutationDataExists.result) {
                return (d:IScatterPlotSampleData)=>{
                    if (!d.profiledMutations) {
                        return notProfiledAppearance;
                    } else if (!d.dispMutationSummary) {
                        return noMutationAppearance;
                    } else {
                        return mutationSummaryToAppearance[d.dispMutationSummary];
                    }
                };
            }
            break;
    }
    // By default, return same circle as mutation summary "Neither"
    return ()=>mutationSummaryToAppearance[MutationSummary.Neither];
}

function mutationsProteinChanges(
    mutations:Mutation[],
    entrezGeneIdToGene:{[entrezGeneId:number]:Gene}
) {
    const mutationsByGene = _.groupBy(mutations, m=>entrezGeneIdToGene[m.entrezGeneId].hugoGeneSymbol);
    const sorted = _.chain(mutationsByGene).entries().sortBy(x=>x[0]).value();
    return sorted.map(entry=>`${entry[0]}: ${entry[1].filter(m=>!!m.proteinChange).map(m=>m.proteinChange).join(", ")}`);
}

function tooltipMutationsSection(
    mutations:AnnotatedMutation[],
    entrezGeneIdToGene:{[entrezGeneId:number]:Gene}
) {
    const oncoKbIcon = (mutation:AnnotatedMutation)=>(<img src="images/oncokb-oncogenic-1.svg" title={mutation.oncoKbOncogenic} style={{height:11, width:11, marginLeft:2, marginBottom: 2}}/>);
    const hotspotIcon = <img src="images/cancer-hotspots.svg" title="Hotspot" style={{height:11, width:11, marginLeft:2, marginBottom:3}}/>;
    const mutationsByGene = _.groupBy(mutations.filter(m=>!!m.proteinChange), m=>entrezGeneIdToGene[m.entrezGeneId].hugoGeneSymbol);
    const sorted = _.chain(mutationsByGene).entries().sortBy(x=>x[0]).value();
    return (
        <div>
            {sorted.map(entry=>{
                const proteinChangeComponents = [];
                for (const mutation of entry[1]) {
                    proteinChangeComponents.push(
                        <span key={mutation.proteinChange}>
                            {mutation.proteinChange}<span style={{marginLeft:1}}>{mutation.isHotspot ? hotspotIcon : null}{mutation.oncoKbOncogenic ? oncoKbIcon(mutation) : null}</span>
                        </span>
                    );
                    proteinChangeComponents.push(<span>, </span>);
                }
                proteinChangeComponents.pop(); // remove last comma
                return (
                    <span>
                        {entry[0]}: {proteinChangeComponents}
                    </span>
                );
            })}
        </div>
    );
}

function generalScatterPlotTooltip<D extends IScatterPlotSampleData>(
    d:D,
    entrezGeneIdToGene:MobxPromise<{[entrezGeneId:number]:Gene}>,
    horizontalKey:keyof D,
    verticalKey:keyof D
) {
    let mutationsSection:any = null;
    if (entrezGeneIdToGene.isComplete && d.mutations.length) {
        mutationsSection = tooltipMutationsSection(d.mutations, entrezGeneIdToGene.result!);
    }
    return (
        <div>
            <a href={getSampleViewUrl(d.studyId, d.sampleId)} target="_blank">{d.sampleId}</a>
            <div>Horizontal: <span style={{fontWeight:"bold"}}>{d[horizontalKey] as any}</span></div>
            <div>Vertical: <span style={{fontWeight:"bold"}}>{d[verticalKey] as any}</span></div>
            {mutationsSection}
        </div>
    );
}

export function scatterPlotTooltip(d:IScatterPlotData, entrezGeneIdToGene:MobxPromise<{[entrezGeneId:number]:Gene}>) {
    return generalScatterPlotTooltip(d, entrezGeneIdToGene, "x", "y");
}

export function boxPlotTooltip(
    d:IBoxScatterPlotPoint,
    entrezGeneIdToGene:MobxPromise<{[entrezGeneId:number]:Gene}>,
    horizontal:boolean
) {
    return generalScatterPlotTooltip(d, entrezGeneIdToGene, horizontal ? "value" : "category", horizontal ? "category" : "value");
}

export function logScalePossible(
    axisSelection: AxisMenuSelection
) {
    return !!(axisSelection.dataType !== CLIN_ATTR_DATA_TYPE &&
         axisSelection.dataSourceId &&
        !(/zscore/i.test(axisSelection.dataSourceId)) &&
        /rna_seq/i.test(axisSelection.dataSourceId));
}

export function makeBoxScatterPlotData(
    horzData: IStringAxisData,
    vertData: INumberAxisData,
    uniqueSampleKeyToSample:{[uniqueSampleKey:string]:Sample},
    coverageInformation:CoverageInformation["samples"],
    mutations?:{
        molecularProfileIds:string[],
        data: AnnotatedMutation[]
    },
    copyNumberAlterations?:{
        molecularProfileIds:string[],
        data:NumericGeneMolecularData[]
    }
):IBoxScatterPlotData<IBoxScatterPlotPoint>[] {
    const boxScatterPlotPoints = makeScatterPlotData(
        horzData, vertData, uniqueSampleKeyToSample, coverageInformation, mutations, copyNumberAlterations
    );
    const categoryToData = _.groupBy(boxScatterPlotPoints, p=>p.category);
    let ret = _.entries(categoryToData).map(entry=>({
        label: entry[0],
        data: entry[1]
    }));
    const categoryOrder = horzData.categoryOrder;
    if (categoryOrder) {
        ret = _.sortBy(ret, datum=>categoryOrder.indexOf(datum.label));
    }
    return ret;
}


export function makeScatterPlotData(
    horzData: IStringAxisData,
    vertData: INumberAxisData,
    uniqueSampleKeyToSample:{[uniqueSampleKey:string]:Sample},
    coverageInformation:CoverageInformation["samples"],
    mutations?:{
        molecularProfileIds:string[],
        data: AnnotatedMutation[]
    },
    copyNumberAlterations?:{
        molecularProfileIds:string[],
        data:NumericGeneMolecularData[]
    }
):IBoxScatterPlotPoint[];

export function makeScatterPlotData(
    horzData: INumberAxisData,
    vertData: INumberAxisData,
    uniqueSampleKeyToSample:{[uniqueSampleKey:string]:Sample},
    coverageInformation:CoverageInformation["samples"],
    mutations?:{
        molecularProfileIds:string[],
        data: AnnotatedMutation[]
    },
    copyNumberAlterations?:{
        molecularProfileIds:string[],
        data:NumericGeneMolecularData[]
    }
):IScatterPlotData[]

export function makeScatterPlotData(
    horzData: INumberAxisData|IStringAxisData,
    vertData: INumberAxisData,
    uniqueSampleKeyToSample:{[uniqueSampleKey:string]:Sample},
    coverageInformation:CoverageInformation["samples"],
    mutations?:{
        molecularProfileIds:string[],
        data: AnnotatedMutation[]
    },
    copyNumberAlterations?:{
        molecularProfileIds:string[],
        data:NumericGeneMolecularData[]
    }
):IScatterPlotData[]|IBoxScatterPlotPoint[] {
    const mutationsMap:{[uniqueSampleKey:string]:AnnotatedMutation[]} =
        mutations ? _.groupBy(mutations.data, m=>m.uniqueSampleKey) : {};
    const cnaMap:{[uniqueSampleKey:string]:NumericGeneMolecularData[]} =
        copyNumberAlterations? _.groupBy(copyNumberAlterations.data, d=>d.uniqueSampleKey) : {};
    const dataMap:{[uniqueSampleKey:string]:Partial<IScatterPlotSampleData & { x:string|number, y:number, category:string, value:number, jitter:number }>} = {};
    for (const d of horzData.data) {
        const sample = uniqueSampleKeyToSample[d.uniqueSampleKey];
        const sampleCopyNumberAlterations:NumericGeneMolecularData[] | undefined = cnaMap[d.uniqueSampleKey];
        let dispCna:NumericGeneMolecularData | undefined = undefined;
        if (sampleCopyNumberAlterations && sampleCopyNumberAlterations.length) {
            dispCna = sampleCopyNumberAlterations[0];
            for (const alt of sampleCopyNumberAlterations) {
                if (Math.abs(alt.value) > Math.abs(dispCna.value)) {
                    dispCna = alt;
                }
            }
        }
        let dispMutationType:OncoprintMutationType | undefined = undefined;
        const sampleMutations:AnnotatedMutation[] | undefined = mutationsMap[d.uniqueSampleKey];
        if (sampleMutations && sampleMutations.length) {
            const counts =
                _.chain(sampleMutations)
                .groupBy(mutation=>{
                    const mutationType = getOncoprintMutationType(mutation);
                    const driverSuffix = (mutationType !== "fusion" && mutationType !== "promoter" && mutation.putativeDriver) ? ".driver" : "";
                    return `${mutationType}${driverSuffix}`;
                })
                .mapValues(muts=>muts.length)
                .value();
            dispMutationType = selectDisplayValue(counts, mutationRenderPriority) as OncoprintMutationType;
        }
        const sampleCoverageInfo = coverageInformation[d.uniqueSampleKey];
        let profiledMutations = true;
        let profiledCna = true;
        if (mutations || copyNumberAlterations) {
            const profiledReport = makeScatterPlotData_profiledReport(
                horzData.hugoGeneSymbol,
                vertData.hugoGeneSymbol,
                sampleCoverageInfo
            );
            if (mutations) {
                profiledMutations = false;
                for (const molecularProfileId of mutations.molecularProfileIds) {
                    profiledMutations = profiledMutations || !!profiledReport[molecularProfileId];
                }
            }
            if (copyNumberAlterations) {
                profiledCna = false;
                for (const molecularProfileId of copyNumberAlterations.molecularProfileIds) {
                    profiledCna = profiledCna || !!profiledReport[molecularProfileId];
                }
            }
        }
        let dispMutationSummary:MutationSummary | undefined = undefined;
        if (profiledMutations) {
            const genesMutatedCount = _.uniqBy(sampleMutations, m=>m.entrezGeneId).length;
            if (genesMutatedCount === 0) {
                dispMutationSummary = MutationSummary.Neither;
            } else if (genesMutatedCount === 1) {
                dispMutationSummary = MutationSummary.One;
            } else {
                dispMutationSummary = MutationSummary.Both;
            }
        }
        dataMap[d.uniqueSampleKey] = {
            uniqueSampleKey: d.uniqueSampleKey,
            sampleId: sample.sampleId,
            studyId: sample.studyId,
            x: d.value as string,
            category: d.value as string,
            mutations: sampleMutations || [],
            copyNumberAlterations:sampleCopyNumberAlterations || [],
            dispCna,
            dispMutationType,
            dispMutationSummary,
            profiledCna,
            profiledMutations
        };
    }
    const data:any[] = [];
    for (const d of vertData.data) {
        const datum = dataMap[d.uniqueSampleKey];
        if (datum) {
            // we only care about cases with both x and y data
            datum.y = d.value;
            datum.value = d.value;
            datum.jitter = getJitterForCase(d.uniqueSampleKey);
            data.push(datum);
        }
    }
    return data;
}

function makeScatterPlotData_profiledReport(
    horzHugoSymbol:string|undefined,
    vertHugoSymbol:string|undefined,
    sampleCoverageInfo: CoverageInformation["samples"][""]
):{[molecularProfileId:string]:boolean} {
    // returns a map from molecular profile id to boolean, which is undefined iff both genes not profiled
    const ret:{[molecularProfileId:string]:boolean} = {};
    if (horzHugoSymbol) {
        for (const gpData of (sampleCoverageInfo.byGene[horzHugoSymbol] || [])) {
            ret[gpData.molecularProfileId] = true;
        }
    }
    if (vertHugoSymbol) {
        for (const gpData of (sampleCoverageInfo.byGene[vertHugoSymbol] || [])) {
            ret[gpData.molecularProfileId] = true;
        }
    }
    for (const gpData of sampleCoverageInfo.allGenes) {
        ret[gpData.molecularProfileId] = true;
    }
    return ret;
}

export function getCnaQueries(
    entrezGeneId:number,
    studyToMolecularProfileDiscrete:{[studyId:string]:MolecularProfile},
    cnaDataShown:boolean
) {
    if (!cnaDataShown) {
        return [];
    }
    return _.values(studyToMolecularProfileDiscrete)
        .map(p=>({molecularProfileId: p.molecularProfileId, entrezGeneId}));
}

export function getMutationQueries(
    horzSelection:AxisMenuSelection,
    vertSelection:AxisMenuSelection
) {
    const queries:{entrezGeneId:number}[] = [];
    let horzEntrezGeneId:number | undefined = undefined;
    if (horzSelection.dataType !== CLIN_ATTR_DATA_TYPE &&
            horzSelection.entrezGeneId !== undefined) {
        horzEntrezGeneId = horzSelection.entrezGeneId;
        queries.push({ entrezGeneId: horzEntrezGeneId });
    }
    if (vertSelection.dataType !== CLIN_ATTR_DATA_TYPE &&
            vertSelection.entrezGeneId !== undefined &&
            vertSelection.entrezGeneId !== horzEntrezGeneId) {
        queries.push({ entrezGeneId: vertSelection.entrezGeneId });
    }
    return queries;
}

export function getScatterPlotDownloadData(
    data:IScatterPlotData[],
    xAxisLabel:string,
    yAxisLabel:string,
    entrezGeneIdToGene:{[entrezGeneId:number]:Gene}
) {
    const dataRows:string[] = [];
    let hasMutations = false;
    for (const datum of data) {
        const row:string[] = [];
        row.push(datum.sampleId);
        row.push(numeral(datum.x).format('0[.][000000]'));
        row.push(numeral(datum.y).format('0[.][000000]'));
        if (datum.mutations.length) {
            row.push(mutationsProteinChanges(datum.mutations, entrezGeneIdToGene).join("; "));
            hasMutations = true;
        } else if (datum.profiledMutations === false) {
            row.push("Not Profiled");
            hasMutations = true;
        }
        dataRows.push(row.join("\t"));
    }
    const header = ["Sample Id", xAxisLabel, yAxisLabel];
    if (hasMutations) {
        header.push("Mutations");
    }
    return header.join("\t")+"\n"+dataRows.join("\n");
}

export function getBoxPlotDownloadData(
    data:IBoxScatterPlotData<IBoxScatterPlotPoint>[],
    categoryLabel:string,
    valueLabel:string,
    entrezGeneIdToGene:{[entrezGeneId:number]:Gene}
) {
    const dataRows:string[] = [];
    let hasMutations = false;
    for (const categoryDatum of data) {
        const category = categoryDatum.label;
        for (const datum of categoryDatum.data) {
            const row:string[] = [];
            row.push(datum.sampleId);
            row.push(category);
            row.push(numeral(datum.value).format('0[.][000000]'));
            if (datum.mutations.length) {
                row.push(mutationsProteinChanges(datum.mutations, entrezGeneIdToGene).join("; "));
                hasMutations = true;
            } else if (datum.profiledMutations === false) {
                row.push("Not Profiled");
                hasMutations = true;
            }
            dataRows.push(row.join("\t"));
        }
    }
    const header = ["Sample Id", categoryLabel, valueLabel];
    if (hasMutations) {
        header.push("Mutations");
    }
    return header.join("\t")+"\n"+dataRows.join("\n");
}

export function getTablePlotDownloadData(
    horzData:IStringAxisData["data"],
    vertData:IStringAxisData["data"],
    uniqueSampleKeyToSample:{[uniqueSampleKey:string]:Sample},
    horzLabel:string,
    vertLabel:string
) {
    const dataRows:string[] = [];
    const sampleKeyToCategories = getUniqueSampleKeyToCategories(horzData, vertData);
    for (const sampleKey of Object.keys(sampleKeyToCategories)) {
        const row:string[] = [];
        row.push(uniqueSampleKeyToSample[sampleKey].sampleId);
        const categories = sampleKeyToCategories[sampleKey];
        row.push(categories.horz || "n/a");
        row.push(categories.vert || "n/a");
        dataRows.push(row.join("\t"));
    }
    const header = ["Sample Id", horzLabel, vertLabel];
    return header.join("\t")+"\n"+dataRows.join("\n");
}