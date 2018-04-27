import {AxisMenuSelection, AxisType} from "./PlotsTab";
import {MobxPromise} from "mobxpromise";
import {ClinicalAttribute, ClinicalData, MolecularProfile, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import {remoteData} from "../../../shared/api/remoteData";
import MobxPromiseCache from "../../../shared/lib/MobxPromiseCache";
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
        value:string;
    }[];
    datatype:string;//"string" or "number"
};

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
            const axisData:IAxisData[] = { data:[], datatype:attribute.datatype.toLowerCase() };
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
            const data:GeneMolecularData = promise.result!;
            return data.map(d=>({
                uniqueCaseKey: d.uniqueSampleKey,
                value: d.value
            }));
        }
    });
}

export function makeAxisDataPromise(
    selection:AxisMenuSelection,
    makeSampleData:boolean,
    molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>,
    patientKeyToSamples:MobxPromise<{[uniquePatientKey]:Sample[]}>,
    clinicalDataCache:MobxPromiseCache<ClinicalAttribute, ClinicalData[]>,
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>
):MobxPromise<IStringData[]> | MobxPromise<INumberData[]> {

    let ret = remoteData(()=>Promise.resolve([]));
    if (molecularProfileIdToMolecularProfile.isComplete && patientKeyToSamples.isComplete) {
        switch (selection.axisType) {
            case AxisType.clinicalAttribute:
                if (!selection.clinicalAttributeId) {
                    break;
                }
                const attribute = clinicalAttributeIdToClinicalAttribute[selection.clinicalAttributeId];
                ret = makeAxisDataPromise_Clinical(attribute, makeSampleData, clinicalDataCache, patientKeyToSamples);
                break;
            case AxisType.molecularProfile:
                if (!selection.entrezGeneId || !selection.molecularProfileId) {
                    break;
                }
                ret = makeAxisDataPromise_Molecular(
                    selection.entrezGeneId, selection.molecularProfileId, numericGeneMolecularDataCache
                );
                break;
        }
    }
    return ret;
}

export function tableCellTextColor(val:number, min:number, max:number) {
    if (val > (max+min)/2) {
        return "white";
    } else {
        return "black";
    }
}

/*export function makePlotsData:PlotsData(
) {
}*/