import {AxisMenuSelection, AxisType, ViewType} from "./PlotsTab";
import {MobxPromise} from "mobxpromise";
import {
    CancerStudy,
    ClinicalAttribute, ClinicalData, Gene, MolecularProfile, Mutation, NumericGeneMolecularData,
    Sample
} from "../../../shared/api/generated/CBioPortalAPI";
import {remoteData} from "../../../shared/api/remoteData";
import MobxPromiseCache from "../../../shared/lib/MobxPromiseCache";
import {IBaseScatterPlotData} from "../../../shared/components/scatterPlot/ScatterPlot";
import {getSampleViewUrl} from "../../../shared/api/urls";
import _ from "lodash";
import * as React from "react";
import {getSimplifiedMutationType, SimplifiedMutationType} from "../../../shared/lib/oql/accessors";
import {selectDisplayValue} from "../../../shared/components/oncoprint/DataUtils";
import {stringListToIndexSet} from "../../../shared/lib/StringUtils";

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
    datatype:string;//"string" or "number"
};

export interface IStringAxisData {
    data:{
        uniqueSampleKey:string;
        value:string;
    }[];
    datatype:string;
};
export interface INumberAxisData {
    data:{
        uniqueSampleKey:string;
        value:number;
    }[];
    datatype:string;
}

enum MutationSummary {
    Neither="Neither", Both="Both", One="One"
}

export interface IScatterPlotData extends IBaseScatterPlotData {
    uniqueSampleKey:string;
    sampleId:string;
    studyId:string;
    dispCna?:NumericGeneMolecularData;
    dispMutationType?:SimplifiedMutationType;
    dispMutationSummary?:MutationSummary;
    profiledCna:boolean;
    profiledMutations:boolean;
    mutations: Mutation[];
    copyNumberAlterations: NumericGeneMolecularData[];
}

export function isStringData(d:IAxisData): d is IStringAxisData {
    return d.datatype === "string";
}
export function isNumberData(d:IAxisData): d is INumberAxisData {
    return d.datatype === "number";
}

export function makeCNAPromise(
    entrezGeneId: number,
    studies: MobxPromise<CancerStudy[]>,
    molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>,
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>
) {
    let promises:MobxPromise<NumericGeneMolecularData[]>[] = [];
    return remoteData({
        await:()=>{
            if (!molecularProfileIdToMolecularProfile.isComplete || !studies.isComplete) {
                return [molecularProfileIdToMolecularProfile, studies];
            } else {
                const profileIds = studies.result!.map(s=>`${s.studyId}_gistic`).filter(id=>!!molecularProfileIdToMolecularProfile.result![id]);
                promises = numericGeneMolecularDataCache.getAll(
                    profileIds.map(molecularProfileId=>({entrezGeneId, molecularProfileId}))
                );
                return promises;
            }
        },
        invoke:()=>Promise.resolve(_.flatten(promises.map(p=>p.result!)))
    });
}

export function scatterPlotLegendData(
    data:IScatterPlotData[],
    viewType:ViewType
) {
    if (viewType === ViewType.CopyNumber) {
        return scatterPlotCnaLegendData(data);
    } else if (viewType === ViewType.MutationType) {
        return scatterPlotMutationLegendData(data);
    } else {
        return scatterPlotMutationSummaryLegendData(data);
    }
}

function scatterPlotMutationSummaryLegendData(
    data:IScatterPlotData[]
) {
    const unique = _.chain(data).map(d=>d.dispMutationSummary).uniq().filter(x=>!!x).value();
    console.log(unique);
    return mutationSummaryLegendOrder.filter(x=>(unique.indexOf(x) > -1)).map((x:MutationSummary)=>{
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
}

function scatterPlotMutationLegendData(
    data:IScatterPlotData[]
) {
    let showNoMutationElement = false;
    const uniqueMutations =
        _.chain(data)
            .map(d=>d.dispMutationType? d.dispMutationType : null)
            .uniq()
            .filter(x=>{
                const ret = !!x && (x !== "fusion");
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
            const appearance = simplifiedMutationTypeToAppearance[type as SimplifiedMutationType];
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
    return legendData;
}

function scatterPlotCnaLegendData(
    data:IScatterPlotData[]
) {
    let showNoCnaElement = false;
    const uniqueDispCna =
        _.chain(data)
        .map(d=>d.dispCna ? d.dispCna.value : null)
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

    const legendData = uniqueDispCna.map(v=>{
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
    return legendData;
}

function makeAxisDataPromise_Clinical(
    attribute:ClinicalAttribute,
    makeSampleData:boolean,
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
            const axisData_Data = axisData.data;
            if (makeSampleData) {
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
            } else {
                // we're only in patient mode if this (and the other axis too) is a patient clinical attribute
                for (const d of data) {
                    axisData_Data.push({
                        uniqueSampleKey: d.uniquePatientKey,
                        value: d.value
                    });
                }
            }
            return Promise.resolve(axisData);
        }
    });
}

function makeAxisDataPromise_Molecular(
    entrezGeneId:number,
    molecularProfileId:string,
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>
):MobxPromise<IAxisData> {
    const promise = numericGeneMolecularDataCache.get({
        entrezGeneId: entrezGeneId,
        molecularProfileId: molecularProfileId
    });
    return remoteData({
        await:()=>[promise],
        invoke:()=>{
            const data:NumericGeneMolecularData[] = promise.result!;
            return Promise.resolve({
                data: data.map(d=>({
                    uniqueSampleKey: d.uniqueSampleKey,
                    value: d.value
                })),
                datatype: "number" // TODO: how to know when its CNA profile to use categories/string?
            });
        }
    });
}

export function makeAxisDataPromise(
    selection:AxisMenuSelection,
    makeSampleData:boolean,
    clinicalAttributeIdToClinicalAttribute:{[clinicalAttributeId:string]:ClinicalAttribute},
    patientKeyToSamples:MobxPromise<{[uniquePatientKey:string]:Sample[]}>,
    clinicalDataCache:MobxPromiseCache<ClinicalAttribute, ClinicalData[]>,
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>
):MobxPromise<IAxisData> {

    let ret:MobxPromise<IAxisData> = remoteData(()=>new Promise<IAxisData>(()=>0)); // always isPending
    switch (selection.axisType) {
        case AxisType.clinicalAttribute:
            const attribute = clinicalAttributeIdToClinicalAttribute[selection.clinicalAttributeId!];
            ret = makeAxisDataPromise_Clinical(attribute, makeSampleData, clinicalDataCache, patientKeyToSamples);
            break;
        case AxisType.molecularProfile:
            ret = makeAxisDataPromise_Molecular(
                selection.entrezGeneId!, selection.molecularProfileId!, numericGeneMolecularDataCache
            );
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
            if (profile) {
                ret = profile.name;
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

const simplifiedMutationTypeToAppearance:{[type in SimplifiedMutationType]:{symbol:string, fill:string, stroke:string, legendLabel:string}}
= {
    "frameshift":{
        symbol : "triangleDown",
        fill : "#1C1C1C",
        stroke : "#B40404",
        legendLabel : "Frameshift"
    },
    "nonsense":{
        symbol : "diamond",
        fill : "#1C1C1C",
        stroke : "#B40404",
        legendLabel : "Nonsense"
    },
    "splice":{
        symbol : "triangleUp",
        fill : "#A4A4A4",
        stroke : "#B40404",
        legendLabel : "Splice"
    },
    "inframe": {
        symbol : "square",
        fill : "#DF7401",
        stroke : "#B40404",
        legendLabel : "Inframe"
    },
    "nonstart":{
        symbol : "plus",
        fill : "#DF7401",
        stroke : "#B40404",
        legendLabel : "Nonstart"
    },
    "nonstop":{
        symbol : "triangleUp",
        fill : "#1C1C1C",
        stroke : "#B40404",
        legendLabel : "Nonstop"
    },
    "missense":{
        symbol : "circle",
        fill : "#DF7401",
        stroke : "#B40404",
        legendLabel : "Missense"
    },
    "other":{
        symbol: "square",
        fill : "#1C1C1C",
        stroke : "#B40404",
        legendLabel : "Other"
    },
    "fusion":{
        symbol: "not implemented",
        fill: "not implemented",
        stroke: "not implemented",
        legendLabel: "Fusion"
    }
};

const notProfiledAppearance = {
    symbol: "circle",
    fill: "#ffffff",
    stroke: "d3d3d3", // TODO: right grey?,
    legendLabel: "Not profiled"
};

const mutationLegendOrder = ["frameshift", "nonsense", "splice", "inframe", "nonstart", "nonstop", "missense", "other"];
const mutationRenderPriority = stringListToIndexSet(mutationLegendOrder);

const noMutationAppearance = {
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
const mutationSummaryLegendOrder = [MutationSummary.Neither, MutationSummary.One, MutationSummary.Both];

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

export function makeScatterPlotPointAppearance(viewType: ViewType):(d:IScatterPlotData)=>{ stroke:string, fill?:string, symbol?:string} {
    switch (viewType) {
        case ViewType.CopyNumber:
            return (d:IScatterPlotData)=>{
                if (!d.profiledCna) {
                    return notProfiledAppearance;
                } else if (!d.dispCna) {
                    return noCnaAppearance;
                } else {
                    return cnaToAppearance[d.dispCna.value as -2 | -1 | 0 | 1 | 2];
                }
            };
        case ViewType.MutationType:
            return (d:IScatterPlotData)=>{
                if (!d.profiledMutations) {
                    return notProfiledAppearance;
                } else if (!d.dispMutationType) {
                    return noMutationAppearance;
                } else {
                    return simplifiedMutationTypeToAppearance[d.dispMutationType];
                }
            };
        case ViewType.None:
            return (d:IScatterPlotData)=>{
                if (!d.profiledMutations) {
                    return notProfiledAppearance;
                } else if (!d.dispMutationSummary) {
                    return noMutationAppearance;
                } else {
                    return mutationSummaryToAppearance[d.dispMutationSummary];
                }
            };
    }
}

export function scatterPlotTooltip(d:IScatterPlotData, entrezGeneIdToGene:MobxPromise<{[entrezGeneId:number]:Gene}>) {
    let mutationsSection:JSX.Element[]|null = null;
    if (entrezGeneIdToGene.isComplete && d.mutations && d.mutations.length) {
        const mutationsByGene = _.groupBy(d.mutations || [], m=>entrezGeneIdToGene.result![m.entrezGeneId].hugoGeneSymbol);
        const sorted = _.chain(mutationsByGene).entries().sortBy(x=>x[0]).value();
        mutationsSection = sorted.map(entry=>(
            <div>
                {entry[0]}: {entry[1].filter(m=>!!m.proteinChange).map(m=>m.proteinChange).join(", ")}
            </div>
        ));
    }
    return (
        <div>
            <a href={getSampleViewUrl(d.studyId, d.sampleId)} target="_blank">{d.sampleId}</a>
            <div>Horizontal: <span style={{fontWeight:"bold"}}>{d.x}</span></div>
            <div>Vertical: <span style={{fontWeight:"bold"}}>{d.y}</span></div>
            {mutationsSection}
        </div>
    );
}

export function logScalePossible(
    molecularProfileId: string
) {
    return (molecularProfileId.indexOf("zscore") === -1) && (molecularProfileId.indexOf("rna_seq") > -1);
}

export function makeScatterPlotData(
    horzData: INumberAxisData["data"],
    vertData: INumberAxisData["data"],
    uniqueSampleKeyToSample:{[uniqueSampleKey:string]:Sample},
    viewType:ViewType,
    mutations?:Mutation[],
    copyNumberAlterations?:NumericGeneMolecularData[]
):IScatterPlotData[] {
    const mutationsMap:{[uniqueSampleKey:string]:Mutation[]} = _.groupBy(mutations || [], m=>m.uniqueSampleKey);
    const cnaMap:{[uniqueSampleKey:string]:NumericGeneMolecularData[]} = _.groupBy(copyNumberAlterations || ([] as NumericGeneMolecularData[]), d=>d.uniqueSampleKey);
    const dataMap:{[uniqueSampleKey:string]:Partial<IScatterPlotData>} = {};
    for (const d of horzData) {
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
        let dispMutationType:SimplifiedMutationType | undefined = undefined;
        const sampleMutations:Mutation[] | undefined = mutationsMap[d.uniqueSampleKey];
        if (viewType === ViewType.MutationType) {
            if (sampleMutations && sampleMutations.length) {
                const counts =
                    _.chain(sampleMutations)
                    .groupBy(mutation=>getSimplifiedMutationType(mutation.mutationType))
                    .mapValues(muts=>muts.length)
                    .value();
                dispMutationType = selectDisplayValue(counts, mutationRenderPriority) as SimplifiedMutationType;
            }
        }
        const profiledMutations = true; // TODO
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
            x: d.value,
            mutations: sampleMutations || [],
            copyNumberAlterations:sampleCopyNumberAlterations || [],
            dispCna,
            dispMutationType,
            dispMutationSummary,
            profiledCna: true, // TODO
            profiledMutations
        };
    }
    const data:IScatterPlotData[] = [];
    for (const d of vertData) {
        const datum = dataMap[d.uniqueSampleKey];
        if (datum) {
            // we only care about cases with both x and y data
            datum.y = d.value;
            data.push(datum as IScatterPlotData);
        }
    }
    return data;
}