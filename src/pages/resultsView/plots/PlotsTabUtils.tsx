import {AxisMenuSelection, AxisType} from "./PlotsTab";
import {MobxPromise} from "mobxpromise";
import {
    ClinicalAttribute, ClinicalData, MolecularProfile, Mutation, NumericGeneMolecularData,
    Sample
} from "../../../shared/api/generated/CBioPortalAPI";
import {remoteData} from "../../../shared/api/remoteData";
import MobxPromiseCache from "../../../shared/lib/MobxPromiseCache";
import {IBaseScatterPlotData} from "../../../shared/components/scatterPlot/ScatterPlot";
import {getSampleViewUrl} from "../../../shared/api/urls";
import _ from "lodash";
import * as React from "react";

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
        uniqueCaseKey:string;
        value:string|number;
    }[];
    datatype:string;//"string" or "number"
};

export interface IStringAxisData {
    data:{
        uniqueCaseKey:string;
        value:string;
    }[];
    datatype:string;
};
export interface INumberAxisData {
    data:{
        uniqueCaseKey:string;
        value:number;
    }[];
    datatype:string;
}

export interface IScatterPlotData extends IBaseScatterPlotData {
    uniqueSampleKey:string;
    sampleId:string;
    studyId:string;
}

export function isStringData(d:IAxisData): d is IStringAxisData {
    return d.datatype === "string";
}
export function isNumberData(d:IAxisData): d is INumberAxisData {
    return d.datatype === "number";
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
                                uniqueCaseKey: sample.uniqueSampleKey,
                                value: d.value,
                            });
                        }
                    }
                } else {
                    // produce sample data from sample clinical data
                    for (const d of data) {
                        axisData_Data.push({
                            uniqueCaseKey: d.uniqueSampleKey,
                            value: d.value
                        });
                    }
                }
            } else {
                // we're only in patient mode if this (and the other axis too) is a patient clinical attribute
                for (const d of data) {
                    axisData_Data.push({
                        uniqueCaseKey: d.uniquePatientKey,
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
                    uniqueCaseKey: d.uniqueSampleKey,
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

export function scatterPlotTooltip(d:IScatterPlotData) {
    return (
        <div>
            <a href={getSampleViewUrl(d.studyId, d.sampleId)} target="_blank">{d.sampleId}</a>
            <div>Horizontal: <span style={{fontWeight:"bold"}}>{d.x}</span></div>
            <div>Vertical: <span style={{fontWeight:"bold"}}>{d.y}</span></div>
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
    mutations?:Mutation[],
    copyNumberAlterations?:NumericGeneMolecularData[]
):IScatterPlotData[] {
    const dataMap:{[caseKey:string]:Partial<IScatterPlotData>} = {};
    for (const d of horzData) {
        const sample = uniqueSampleKeyToSample[d.uniqueCaseKey];
        dataMap[d.uniqueCaseKey] = {
            uniqueSampleKey: d.uniqueCaseKey,
            sampleId: sample.sampleId,
            studyId: sample.studyId,
            x: d.value,
        };
    }
    const data:IScatterPlotData[] = [];
    for (const d of vertData) {
        const datum = dataMap[d.uniqueCaseKey];
        if (datum) {
            // we only care about cases with both x and y data
            datum.y = d.value;
            data.push(datum as IScatterPlotData);
        }
    }
    return data;
}