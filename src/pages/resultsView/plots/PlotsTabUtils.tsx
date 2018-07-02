import {AxisMenuSelection, AxisType, ViewType} from "./PlotsTab";
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
    MUT_COLOR_FUSION, MUT_COLOR_INFRAME, MUT_COLOR_INFRAME_PASSENGER,
    MUT_COLOR_MISSENSE, MUT_COLOR_MISSENSE_PASSENGER, MUT_COLOR_PROMOTER, MUT_COLOR_TRUNC, MUT_COLOR_TRUNC_PASSENGER
} from "../../../shared/components/oncoprint/geneticrules";
import {CoverageInformation} from "../ResultsViewPageStoreUtils";
import {IBoxScatterPlotData} from "../../../shared/components/plots/BoxScatterPlot";
import {AlterationTypeConstants} from "../ResultsViewPageStore";
import numeral from "numeral";
import {getUniqueSampleKeyToCategories} from "../../../shared/components/plots/TablePlotUtils";

export const molecularProfileTypeToDisplayType:{[s:string]:string} = {
    "COPY_NUMBER_ALTERATION": "Copy Number",
    "MRNA_EXPRESSION": "mRNA",
    "PROTEIN_LEVEL": "Protein Level",
    "METHYLATION": "DNA Methylation"
};

export const molecularProfileTypeDisplayOrder = ["MRNA_EXPRESSION", "COPY_NUMBER_ALTERATION", "PROTEIN_LEVEL", "METHYLATION"];

export type PlotsData = {
    [uniqueSampleKey:string]:{
        caseId: string, // stable sample id
        cna_anno: string,
        mutation: {
            [hugoSymbol:string]:{
                details: string, // protein code
                type: string // mutation type
            }
        },
        xVal: string, // float representing [WHAT??]
        yVal: string // float representing [WHAT??]
    }
}

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

enum MutationSummary {
    Neither="Neither", Both="Both", One="One"
}

const NOT_PROFILED_MUTATION_LEGEND_LABEL = "Not profiled for mutations";
const NOT_PROFILED_CNA_LEGEND_LABEL = "Not profiled for copy number alterations";

export interface IScatterPlotSampleData {
    uniqueSampleKey:string;
    sampleId:string;
    studyId:string;
    dispCna?:NumericGeneMolecularData;
    dispMutationType?:OncoprintMutationType;
    dispMutationSummary?:MutationSummary;
    profiledCna?:boolean;
    profiledMutations?:boolean;
    mutations: Mutation[];
    copyNumberAlterations: NumericGeneMolecularData[];
}

export interface IScatterPlotData extends IScatterPlotSampleData, IBaseScatterPlotData {};

export interface IBoxScatterPlotPoint extends IScatterPlotSampleData {
    category:string;
    value:number;
}

export function isStringData(d:IAxisData): d is IStringAxisData {
    return d.datatype === "string";
}
export function isNumberData(d:IAxisData): d is INumberAxisData {
    return d.datatype === "number";
}

export function scatterPlotLegendData(
    data:IScatterPlotSampleData[],
    viewType:ViewType,
    mutationDataExists: MobxPromise<boolean>,
    cnaDataExists: MobxPromise<boolean>
) {
    const _mutationDataExists = mutationDataExists.isComplete && mutationDataExists.result
    if (viewType === ViewType.CopyNumber &&
        cnaDataExists.isComplete && cnaDataExists.result) {
        return scatterPlotCnaLegendData(data);
    } else if (viewType === ViewType.MutationType && _mutationDataExists) {
        return scatterPlotMutationLegendData(data);
    } else if (viewType === ViewType.MutationSummary && _mutationDataExists) {
        return scatterPlotMutationSummaryLegendData(data);
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

    const legendData = mutationSummaryLegendOrder.filter(x=>(unique.indexOf(x) > -1)).map((x:MutationSummary)=>{
        const appearance = mutationSummaryToAppearance[x];
        return {
            name: appearance.legendLabel,
            symbol: {
                stroke: appearance.stroke,
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
                fill: notProfiledAppearance.fill,
                type: "circle"
            }
        });
    }
    return legendData;
}

function scatterPlotMutationLegendData(
    data:IScatterPlotSampleData[]
) {
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

    const legendData =
        _.chain(mutationLegendOrder)
        .filter(type=>!!uniqueMutations[type])
        .map(type=>{
            const appearance = oncoprintMutationTypeToAppearance[type as OncoprintMutationType];
            return {
                name: appearance.legendLabel,
                symbol: {
                    stroke: appearance.stroke,
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
                type: "circle"
            }
        };
    });
    if (showNoCnaElement) {
        legendData.push({
            name: noCnaAppearance.legendLabel,
            symbol: {
                stroke: noCnaAppearance.stroke,
                fillOpacity: 0,
                type: "circle"
            }
        });
    }
    if (showNotProfiledElement) {
        legendData.push({
            name: NOT_PROFILED_CNA_LEGEND_LABEL,
            symbol: {
                stroke: notProfiledAppearance.stroke,
                fill: notProfiledAppearance.fill,
                type: "circle"
            }
        });
    }
    return legendData;
}

function makeAxisDataPromise_Clinical(
    attribute:ClinicalAttribute,
    clinicalDataCache:MobxPromiseCache<ClinicalAttribute, ClinicalData[]>,
    patientKeyToSamples:MobxPromise<{[uniquePatientKey:string]:Sample[]}>,
):MobxPromise<IAxisData> {
    const promise = clinicalDataCache.get(attribute);
    return remoteData({
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
    clinicalAttributeIdToClinicalAttribute:{[clinicalAttributeId:string]:ClinicalAttribute},
    molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>,
    patientKeyToSamples:MobxPromise<{[uniquePatientKey:string]:Sample[]}>,
    entrezGeneIdToGene:MobxPromise<{[entrezGeneId:number]:Gene}>,
    clinicalDataCache:MobxPromiseCache<ClinicalAttribute, ClinicalData[]>,
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>
):MobxPromise<IAxisData> {

    let ret:MobxPromise<IAxisData> = remoteData(()=>new Promise<IAxisData>(()=>0)); // always isPending
    switch (selection.axisType) {
        case AxisType.clinicalAttribute:
            if (selection.clinicalAttributeId !== undefined) {
                const attribute = clinicalAttributeIdToClinicalAttribute[selection.clinicalAttributeId];
                ret = makeAxisDataPromise_Clinical(attribute, clinicalDataCache, patientKeyToSamples);
            }
            break;
        case AxisType.molecularProfile:
            if (selection.entrezGeneId !== undefined && selection.molecularProfileId !== undefined) {
                ret = makeAxisDataPromise_Molecular(
                    selection.entrezGeneId, selection.molecularProfileId, numericGeneMolecularDataCache,
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
    switch (selection.axisType) {
        case AxisType.clinicalAttribute:
            const attribute = clinicalAttributeIdToClinicalAttribute[selection.clinicalAttributeId!];
            if (attribute) {
                ret = attribute.displayName;
            }
            break;
        case AxisType.molecularProfile:
            const profile = molecularProfileIdToMolecularProfile[selection.molecularProfileId!];
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
    switch (selection.axisType) {
        case AxisType.clinicalAttribute:
            const attribute = clinicalAttributeIdToClinicalAttribute[selection.clinicalAttributeId!];
            if (attribute) {
                ret = attribute.description;
            }
            break;
        case AxisType.molecularProfile:
            const profile = molecularProfileIdToMolecularProfile[selection.molecularProfileId!];
            if (profile) {
                ret = profile.description;
            }
            break;
    }
    return ret;
}

const oncoprintMutationTypeToAppearance:{[type in OncoprintMutationType]:{symbol:string, fill:string, stroke:string, legendLabel:string}}
= {
    "inframe": {
        symbol : "circle",
        fill : MUT_COLOR_INFRAME_PASSENGER,
        stroke : "#000000",
        legendLabel : "Inframe"
    },
    "missense":{
        symbol : "circle",
        fill : MUT_COLOR_MISSENSE_PASSENGER,
        stroke : "#000000",
        legendLabel : "Missense"
    },
    "fusion":{
        symbol: "circle",
        fill: MUT_COLOR_FUSION,
        stroke: "#000000",
        legendLabel: "Fusion"
    },
    "trunc":{
        symbol: "circle",
        fill: MUT_COLOR_TRUNC_PASSENGER,
        stroke: "#000000",
        legendLabel: "Truncating"
    },
    "promoter":{
        symbol: "circle",
        fill: MUT_COLOR_PROMOTER,
        stroke: "#000000",
        legendLabel: "Promoter"
    }
};

const notProfiledAppearance = {
    symbol: "circle",
    fill: "#ffffff",
    stroke: "d3d3d3", // TODO: right grey?
};

const mutationLegendOrder = ["fusion", "promoter", "trunc", "inframe", "missense"];
const mutationRenderPriority = stringListToIndexSet(mutationLegendOrder);

export const noMutationAppearance = {
    symbol : "circle",
    fill : "#00AAF8",
    stroke : "#0089C6",
    legendLabel : "Not mutated"
};

const mutationSummaryToAppearance = {
    "Neither":{
        fill: "#00AAF8",
        stroke: "#0089C6",
        legendLabel: "Neither mutated"
    },
    "One":{
        fill : "#DBA901",
        stroke : "#886A08",
        legendLabel : "One Gene mutated"
    },
    "Both":{
        fill : "#FF0000",
        stroke : "#B40404",
        legendLabel: "Both mutated"
    }
};
const mutationSummaryLegendOrder = [MutationSummary.Both, MutationSummary.One, MutationSummary.Neither];

const cnaToAppearance = {
    "-2":{
        legendLabel: "Deep Deletion",
        stroke:"#00008B",
    },
    "-1":{
        legendLabel: "Shallow Deletion",
        stroke:"#00BFFF",
    },
    "0":{
        legendLabel: "Diploid",
        stroke:"#000000",
    },
    "1":{
        legendLabel: "Gain",
        stroke: "#FF69B4",
    },
    "2":{
        legendLabel: "Amplification",
        stroke: "#FF0000",
    }
};

const noCnaAppearance = {
    stroke: "#333333",
    legendLabel: "No CNA data",
};

const cnaCategoryOrder = ["-2", "-1", "0", "1", "2"].map(x=>(cnaToAppearance as any)[x].legendLabel);

export function makeScatterPlotPointAppearance(
    viewType: ViewType,
    mutationDataExists: MobxPromise<boolean>,
    cnaDataExists: MobxPromise<boolean>
):(d:IScatterPlotSampleData)=>{ stroke:string, fill?:string, symbol?:string} {
    switch (viewType) {
        case ViewType.CopyNumber:
            if (cnaDataExists.isComplete && cnaDataExists.result) {
                return (d:IScatterPlotSampleData)=>{
                    if (!d.profiledCna) {
                        return notProfiledAppearance;
                    } else if (!d.dispCna) {
                        return noCnaAppearance;
                    } else {
                        return cnaToAppearance[d.dispCna.value as -2 | -1 | 0 | 1 | 2];
                    }
                };
            }
        case ViewType.MutationType:
            if (mutationDataExists.isComplete && mutationDataExists.result) {
                return (d:IScatterPlotSampleData)=>{
                    if (!d.profiledMutations) {
                        return notProfiledAppearance;
                    } else if (!d.dispMutationType) {
                        return noMutationAppearance;
                    } else {
                        return oncoprintMutationTypeToAppearance[d.dispMutationType];
                    }
                };
            }
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
        default:
            // By default, return same circle as "not mutated"
            return ()=>noMutationAppearance;
    }
}

function mutationsProteinChanges(
    mutations:Mutation[],
    entrezGeneIdToGene:{[entrezGeneId:number]:Gene}
) {
    const mutationsByGene = _.groupBy(mutations, m=>entrezGeneIdToGene[m.entrezGeneId].hugoGeneSymbol);
    const sorted = _.chain(mutationsByGene).entries().sortBy(x=>x[0]).value();
    return sorted.map(entry=>`${entry[0]}: ${entry[1].filter(m=>!!m.proteinChange).map(m=>m.proteinChange).join(", ")}`);
}

function generalScatterPlotTooltip<D extends IScatterPlotSampleData>(
    d:D,
    entrezGeneIdToGene:MobxPromise<{[entrezGeneId:number]:Gene}>,
    horizontalKey:keyof D,
    verticalKey:keyof D
) {
    let mutationsSection:JSX.Element[]|null = null;
    if (entrezGeneIdToGene.isComplete && d.mutations.length) {
        const proteinChanges = mutationsProteinChanges(d.mutations, entrezGeneIdToGene.result!);
        mutationsSection = proteinChanges.map(geneLine=>(
            <div key={geneLine}>
                {geneLine}
            </div>
        ));
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
    return !!(axisSelection.axisType === AxisType.molecularProfile &&
        axisSelection.molecularProfileId &&
        !(/zscore/i.test(axisSelection.molecularProfileId)) &&
        /rna_seq/i.test(axisSelection.molecularProfileId));
}

export function makeBoxScatterPlotData(
    horzData: IStringAxisData,
    vertData: INumberAxisData,
    uniqueSampleKeyToSample:{[uniqueSampleKey:string]:Sample},
    coverageInformation:CoverageInformation["samples"],
    mutations?:{
        molecularProfileIds:string[],
        data: Mutation[]
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
        data: Mutation[]
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
        data: Mutation[]
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
        data: Mutation[]
    },
    copyNumberAlterations?:{
        molecularProfileIds:string[],
        data:NumericGeneMolecularData[]
    }
):IScatterPlotData[]|IBoxScatterPlotPoint[] {
    const mutationsMap:{[uniqueSampleKey:string]:Mutation[]} =
        mutations ? _.groupBy(mutations.data, m=>m.uniqueSampleKey) : {};
    const cnaMap:{[uniqueSampleKey:string]:NumericGeneMolecularData[]} =
        copyNumberAlterations? _.groupBy(copyNumberAlterations.data, d=>d.uniqueSampleKey) : {};
    const dataMap:{[uniqueSampleKey:string]:Partial<IScatterPlotSampleData & { x:string|number, y:number, category:string, value:number }>} = {};
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
        const sampleMutations:Mutation[] | undefined = mutationsMap[d.uniqueSampleKey];
        if (sampleMutations && sampleMutations.length) {
            const counts =
                _.chain(sampleMutations)
                .groupBy(mutation=>getOncoprintMutationType(mutation))
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
    studyToMolecularProfileDiscrete:{[studyId:string]:MolecularProfile}
) {
    return _.values(studyToMolecularProfileDiscrete)
        .map(p=>({molecularProfileId: p.molecularProfileId, entrezGeneId}));
}

export function getMutationQueries(
    horzSelection:AxisMenuSelection,
    vertSelection:AxisMenuSelection
) {
    const queries:{entrezGeneId:number}[] = [];
    let horzEntrezGeneId:number | undefined = undefined;
    if (horzSelection.axisType === AxisType.molecularProfile &&
            horzSelection.entrezGeneId !== undefined) {
        horzEntrezGeneId = horzSelection.entrezGeneId;
        queries.push({ entrezGeneId: horzEntrezGeneId });
    }
    if (vertSelection.axisType === AxisType.molecularProfile &&
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