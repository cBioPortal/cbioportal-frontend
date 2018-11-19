import {AxisMenuSelection, MutationCountBy, ViewType} from "./PlotsTab";
import {MobxPromise} from "mobxpromise";
import {
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
    CNA_COLOR_HOMDEL,
    DEFAULT_GREY,
    MUT_COLOR_FUSION, MUT_COLOR_INFRAME, MUT_COLOR_INFRAME_PASSENGER,
    MUT_COLOR_MISSENSE, MUT_COLOR_MISSENSE_PASSENGER, MUT_COLOR_OTHER, MUT_COLOR_PROMOTER, MUT_COLOR_TRUNC,
    MUT_COLOR_TRUNC_PASSENGER
} from "../../../shared/components/oncoprint/geneticrules";
import {CoverageInformation} from "../ResultsViewPageStoreUtils";
import {IBoxScatterPlotData} from "../../../shared/components/plots/BoxScatterPlot";
import {AlterationTypeConstants, AnnotatedMutation, AnnotatedNumericGeneMolecularData} from "../ResultsViewPageStore";
import numeral from "numeral";
import {getJitterForCase} from "../../../shared/components/plots/PlotUtils";
import {isSampleProfiled} from "../../../shared/lib/isSampleProfiled";
import GenesetMolecularDataCache from "../../../shared/cache/GenesetMolecularDataCache";
import {GenesetMolecularData} from "../../../shared/api/generated/CBioPortalAPIInternal";
import {MUTATION_COUNT} from "../../studyView/StudyViewPageStore";

export const CLIN_ATTR_DATA_TYPE = "clinical_attribute";
export const GENESET_DATA_TYPE = "GENESET_SCORE";
export const dataTypeToDisplayType:{[s:string]:string} = {
    [AlterationTypeConstants.MUTATION_EXTENDED]: "Mutation",
    [AlterationTypeConstants.COPY_NUMBER_ALTERATION]: "Copy Number",
    [AlterationTypeConstants.MRNA_EXPRESSION]: "mRNA",
    [AlterationTypeConstants.PROTEIN_LEVEL]: "Protein Level",
    [AlterationTypeConstants.METHYLATION]: "DNA Methylation",
    [CLIN_ATTR_DATA_TYPE]:"Clinical Attribute",
    [GENESET_DATA_TYPE]:"Gene Sets"
};

export const mutationTypeToDisplayName:{[oncoprintMutationType:string]:string} = {
    "missense":"Missense",
    "inframe":"Inframe",
    "fusion":"Fusion",
    "promoter":"Promoter",
    "trunc":"Truncating",
    "other":"Other"
};

export const dataTypeDisplayOrder = [
    CLIN_ATTR_DATA_TYPE, AlterationTypeConstants.MUTATION_EXTENDED, AlterationTypeConstants.COPY_NUMBER_ALTERATION,
    AlterationTypeConstants.MRNA_EXPRESSION, GENESET_DATA_TYPE, AlterationTypeConstants.PROTEIN_LEVEL, AlterationTypeConstants.METHYLATION
];
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
        value:string|number|(string[])|(number[]); // if theres a list, then we'll make one data point per value
    }[];
    hugoGeneSymbol?:string;
    datatype:string;//"string" or "number"
};

export interface IStringAxisData {
    data:{
        uniqueSampleKey:string;
        value:string | (string[]);
    }[];
    categoryOrder?:string[];
    hugoGeneSymbol?:string;
    datatype:string;
};
export interface INumberAxisData {
    data:{
        uniqueSampleKey:string;
        value:number | (number[]);
    }[];
    hugoGeneSymbol?:string;
    datatype:string;
}

export enum MutationSummary {
    Neither="Neither", Both="Both", One="One"
}

const NOT_PROFILED_MUTATION_LEGEND_LABEL = ["Not profiled","for mutations"];
const NOT_PROFILED_CNA_LEGEND_LABEL = ["Not profiled", "for CNA"];
const MUTATION_TYPE_NOT_PROFILED = "not_profiled_mutation";
const MUTATION_TYPE_NOT_MUTATED = "not_mutated";
const CNA_TYPE_NOT_PROFILED = "not_profiled_cna";
const CNA_TYPE_NO_DATA = "not_profiled_cna";

export interface IScatterPlotSampleData {
    uniqueSampleKey:string;
    sampleId:string;
    studyId:string;
    dispCna?:AnnotatedNumericGeneMolecularData;
    dispMutationType?:OncoprintMutationType;
    dispMutationSummary?:MutationSummary;
    profiledCna?:boolean;
    profiledMutations?:boolean;
    mutations: AnnotatedMutation[];
    copyNumberAlterations: AnnotatedNumericGeneMolecularData[];
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

export function scatterPlotZIndexSortBy<D extends Pick<IScatterPlotSampleData, "dispMutationType" | "dispMutationSummary" | "profiledMutations" | "dispCna" | "profiledCna">>(
    viewType:ViewType,
    highlight?: (d:D)=>boolean
) {
    // sort by render priority
    const sortByHighlight = highlight ? ((d:D)=>(highlight(d) ? 1 : 0)) : ((d:D)=>0);

    const sortByMutation = (d:D)=>{
        if (!d.profiledMutations) {
            return -mutationRenderPriority[MUTATION_TYPE_NOT_PROFILED];
        } else if (!d.dispMutationType) {
            return -mutationRenderPriority[MUTATION_TYPE_NOT_MUTATED];
        } else if (d.dispMutationType in mutationRenderPriority) {
            return -mutationRenderPriority[d.dispMutationType!];
        } else {
            return Number.NEGATIVE_INFINITY;
        }
    };

    const sortByCna = (d:D)=>{
        if (!d.profiledCna) {
            return -cnaRenderPriority[CNA_TYPE_NOT_PROFILED];
        } else if (!d.dispCna) {
            return -cnaRenderPriority[CNA_TYPE_NO_DATA];
        } else if (d.dispCna.value in cnaRenderPriority) {
            return -cnaRenderPriority[d.dispCna.value]
        } else {
            return Number.NEGATIVE_INFINITY;
        }
    };

    let sortBy;
    switch (viewType) {
        case ViewType.MutationTypeAndCopyNumber:
            sortBy = [sortByHighlight, sortByMutation, sortByCna];
            break;
        case ViewType.MutationType:
            sortBy = [sortByHighlight, sortByMutation];
            break;
        case ViewType.CopyNumber:
            sortBy = [sortByHighlight, sortByCna];
            break;
        case ViewType.MutationSummary:
            sortBy = [sortByHighlight, (d:D)=>{
                if (d.dispMutationSummary! in mutationSummaryRenderPriority) {
                    return -mutationSummaryRenderPriority[d.dispMutationSummary!]        ;
                } else if (!d.profiledMutations) {
                    return -mutationSummaryRenderPriority[MUTATION_TYPE_NOT_PROFILED];
                } else {
                    return Number.NEGATIVE_INFINITY;
                }
            }];
            break;
    }
    return sortBy;
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
                stroke: notProfiledMutationsAppearance.stroke,
                strokeOpacity: notProfiledMutationsAppearance.strokeOpacity,
                fill: notProfiledMutationsAppearance.fill,
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
                stroke: notProfiledMutationsAppearance.stroke,
                strokeOpacity: notProfiledMutationsAppearance.strokeOpacity, // always show because its white
                fill: notProfiledMutationsAppearance.fill,
                type: "circle"
            }
        });
    }
    return legendData;
}

function scatterPlotCnaLegendData(
    data:IScatterPlotSampleData[]
) {
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
            if (x === null) {
                showNotProfiledElement = true;
            }
            return x !== null;
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
    if (showNotProfiledElement) {
        legendData.push({
            name: NOT_PROFILED_CNA_LEGEND_LABEL,
            symbol: {
                stroke: notProfiledCnaAppearance.stroke,
                fillOpacity:0,
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
    let ret:MobxPromise<IAxisData> = remoteData({
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

    return ret;
}

function makeAxisDataPromise_Molecular(
    entrezGeneId:number,
    molecularProfileId:string,
    mutationCache:MobxPromiseCache<{entrezGeneId:number}, Mutation[]>,
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>,
    entrezGeneIdToGene:MobxPromise<{[entrezGeneId:number]:Gene}>,
    molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>,
    mutationCountBy: MutationCountBy,
    coverageInformation:MobxPromise<CoverageInformation>,
    samples:MobxPromise<Sample[]>
):MobxPromise<IAxisData> {
    let promise:MobxPromise<any>;/* = ;*/
    return remoteData({
        await:()=>{
            const ret:MobxPromise<any>[] = [];
            if (molecularProfileIdToMolecularProfile.isComplete) {
                if (molecularProfileIdToMolecularProfile.result![molecularProfileId].molecularAlterationType ===
                        AlterationTypeConstants.MUTATION_EXTENDED) {
                    // mutation profile
                    promise = mutationCache.get({ entrezGeneId });
                    ret.push(coverageInformation);
                    ret.push(samples);
                } else {
                    // non-mutation profile
                    promise = numericGeneMolecularDataCache.get({ entrezGeneId, molecularProfileId });
                }
                ret.push(promise);
            } else {
                ret.push(molecularProfileIdToMolecularProfile);
            }
            ret.push(entrezGeneIdToGene);
            return ret;
        },
        invoke:()=>{
            const profile = molecularProfileIdToMolecularProfile.result![molecularProfileId];
            const hugoGeneSymbol = entrezGeneIdToGene.result![entrezGeneId].hugoGeneSymbol;

            if (profile.molecularAlterationType === AlterationTypeConstants.MUTATION_EXTENDED) {
                // mutation profile
                const mutations:Mutation[] = promise.result!;
                return Promise.resolve(
                    makeAxisDataPromise_Molecular_MakeMutationData(
                        molecularProfileId, hugoGeneSymbol, mutations, coverageInformation.result!, mutationCountBy, samples.result!
                    )
                );
            } else {
                // non-mutation profile
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
                    hugoGeneSymbol,
                    datatype: isDiscreteCna ? "string" : "number",
                    categoryOrder: isDiscreteCna ? cnaCategoryOrder : undefined
                } as IAxisData);
            }
        }
    });
}

export function makeAxisDataPromise_Molecular_MakeMutationData(
    molecularProfileId:string,
    hugoGeneSymbol:string,
    mutations:Pick<Mutation,"uniqueSampleKey"|"proteinChange"|"mutationType">[],
    coverageInformation:CoverageInformation,
    mutationCountBy: MutationCountBy,
    samples:Pick<Sample, "uniqueSampleKey">[]
) {
    // collect mutations by sample by type
    const sampleToMutationTypes = _.mapValues(
        _.groupBy(mutations, m=>m.uniqueSampleKey),
        sampleMuts=>_.uniq(sampleMuts.map(m=>mutationTypeToDisplayName[getOncoprintMutationType(m)]))
    );

    const data = samples.map(s=>{
        const sampleMutTypes = sampleToMutationTypes[s.uniqueSampleKey];
        let value:string|string[];
        if (!sampleMutTypes) {
            // sampleMutTypes would never be an empty array because its generated by _.groupBy,
            //  so we need only check if it exists
            if (!isSampleProfiled(s.uniqueSampleKey, molecularProfileId, hugoGeneSymbol, coverageInformation)) {
                // its not profiled
                value = MUT_PROFILE_COUNT_NOT_PROFILED;
            } else {
                // otherwise, its profiled, so not mutated
                value = MUT_PROFILE_COUNT_NOT_MUTATED;
            }
        } else {
            // we have mutations
            switch (mutationCountBy) {
                case MutationCountBy.MutationType:
                    // if more than one type, its "Multiple"
                    if (sampleMutTypes.length > 1) {
                        value = MUT_PROFILE_COUNT_MULTIPLE;
                    } else {
                        value = sampleMutTypes;
                    }
                    break;
                case MutationCountBy.MutatedVsWildType:
                default:
                    value = MUT_PROFILE_COUNT_MUTATED;
                    break;
            }
        }
        return {
            uniqueSampleKey: s.uniqueSampleKey,
            value
        };
    });
    let categoryOrder:string[] = [];
    switch (mutationCountBy) {
        case MutationCountBy.MutationType:
            categoryOrder = mutTypeCategoryOrder;
            break;
        case MutationCountBy.MutatedVsWildType:
        default:
            categoryOrder = mutVsWildCategoryOrder;
            break;
    }
    return {
        data,
        hugoGeneSymbol,
        datatype: "string",
        categoryOrder
    } as IStringAxisData;
}

function makeAxisDataPromise_Geneset(
    genesetId:string,
    molecularProfileId:string,
    genesetMolecularDataCachePromise:MobxPromise<GenesetMolecularDataCache>,
    molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>
):MobxPromise<IAxisData> {
    return remoteData({
        await:()=>[genesetMolecularDataCachePromise, molecularProfileIdToMolecularProfile],
        invoke: async () => {
            const profile = molecularProfileIdToMolecularProfile.result![molecularProfileId];
            // const isDiscreteCna = (profile.molecularAlterationType === AlterationTypeConstants.COPY_NUMBER_ALTERATION
            //                         && profile.datatype === "DISCRETE");
            const makeRequest = true;
            await genesetMolecularDataCachePromise.result!.getPromise(
                 {genesetId, molecularProfileId}, makeRequest);
            const data:GenesetMolecularData[] = genesetMolecularDataCachePromise.result!.get({molecularProfileId, genesetId})!.data!;
            return Promise.resolve({
                data: data.map(d=>{
                    const value = d.value;
                    return {
                        uniqueSampleKey: d.uniqueSampleKey,
                        value: Number(value)
                    };
                }),
                genesetId: genesetId,
                datatype: "number"
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
    mutationCache:MobxPromiseCache<{entrezGeneId:number}, Mutation[]>,
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>,
    studyToMutationMolecularProfile: MobxPromise<{[studyId: string]: MolecularProfile}>,
    coverageInformation:MobxPromise<CoverageInformation>,
    samples:MobxPromise<Sample[]>,
    genesetMolecularDataCachePromise: MobxPromise<GenesetMolecularDataCache>
):MobxPromise<IAxisData> {

    let ret:MobxPromise<IAxisData> = remoteData(()=>new Promise<IAxisData>(()=>0)); // always isPending
    switch (selection.dataType) {
        case CLIN_ATTR_DATA_TYPE:
            if (selection.dataSourceId !== undefined && clinicalAttributeIdToClinicalAttribute.isComplete) {
                const attribute = clinicalAttributeIdToClinicalAttribute.result![selection.dataSourceId];
                ret = makeAxisDataPromise_Clinical(attribute, clinicalDataCache, patientKeyToSamples, studyToMutationMolecularProfile);
            }
            break;
        case GENESET_DATA_TYPE:
            if (selection.genesetId !== undefined && selection.dataSourceId !== undefined) {
                ret = makeAxisDataPromise_Geneset(
                    selection.genesetId, selection.dataSourceId, genesetMolecularDataCachePromise,
                    molecularProfileIdToMolecularProfile);
            }
            break;
        default:
            // molecular profile
            if (selection.entrezGeneId !== undefined && selection.dataSourceId !== undefined) {
                ret = makeAxisDataPromise_Molecular(
                    selection.entrezGeneId, selection.dataSourceId, mutationCache, numericGeneMolecularDataCache,
                    entrezGeneIdToGene, molecularProfileIdToMolecularProfile, selection.mutationCountBy,
                    coverageInformation, samples
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
    const profile = molecularProfileIdToMolecularProfile[selection.dataSourceId!];
    switch (selection.dataType) {
        case CLIN_ATTR_DATA_TYPE:
            const attribute = clinicalAttributeIdToClinicalAttribute[selection.dataSourceId!];
            if (attribute) {
                ret = attribute.displayName;
            }
            break;
        case GENESET_DATA_TYPE:
            if (profile && selection.genesetId !== undefined) {
                ret = `${selection.genesetId}: ${profile.name}`;
            }
            break;
        default:
            // molecular profile
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
    },
    "other":{
        symbol: "circle",
        fill: MUT_COLOR_OTHER,
        stroke: "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel: "Other"
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
    },
    "other":{
        symbol: "circle",
        fill: MUT_COLOR_OTHER,
        stroke: "#000000",
        strokeOpacity:NON_CNA_STROKE_OPACITY,
        legendLabel: "Other"
    }
};

export const notProfiledCnaAppearance = {
    symbol: "circle",
    stroke: "#000000",
    strokeOpacity:0.3,
};
export const notProfiledMutationsAppearance = Object.assign({}, {fill: "#ffffff"}, notProfiledCnaAppearance);

export const mutationLegendOrder = [
    "fusion",
    "promoter.driver", "promoter",
    "trunc.driver", "trunc",
    "inframe.driver", "inframe",
    "missense.driver", "missense", "other"
];
export const mutationRenderPriority = stringListToIndexSet([
    "fusion", "promoter.driver", "trunc.driver", "inframe.driver", "missense.driver",
    "promoter", "trunc", "inframe", "missense", "other", MUTATION_TYPE_NOT_MUTATED, MUTATION_TYPE_NOT_PROFILED
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

const cnaCategoryOrder = ["-2", "-1", "0", "1", "2"].map(x=>(cnaToAppearance as any)[x].legendLabel);
export const MUT_PROFILE_COUNT_MUTATED = "Mutated";
export const MUT_PROFILE_COUNT_MULTIPLE = "Multiple";
export const MUT_PROFILE_COUNT_NOT_MUTATED = "Wild type";
export const MUT_PROFILE_COUNT_NOT_PROFILED = "Not profiled";
export const mutTypeCategoryOrder = [
    mutationTypeToDisplayName.missense,
    mutationTypeToDisplayName.inframe,
    mutationTypeToDisplayName.trunc,
    mutationTypeToDisplayName.fusion,
    mutationTypeToDisplayName.promoter,
    mutationTypeToDisplayName.other,
    MUT_PROFILE_COUNT_MULTIPLE,
    MUT_PROFILE_COUNT_NOT_MUTATED, MUT_PROFILE_COUNT_NOT_PROFILED
];
export const mutVsWildCategoryOrder = [MUT_PROFILE_COUNT_MUTATED, MUT_PROFILE_COUNT_NOT_MUTATED, MUT_PROFILE_COUNT_NOT_PROFILED];

export const cnaRenderPriority = stringListToIndexSet([
    "-2", "2", "-1", "1", "0", CNA_TYPE_NOT_PROFILED
]);

function getMutationTypeAppearance(d:IScatterPlotSampleData, oncoprintMutationTypeToAppearance:{[mutType:string]:{symbol:string, fill:string, stroke:string, strokeOpacity:number, legendLabel:string}}) {
    if (!d.profiledMutations) {
        return notProfiledMutationsAppearance;
    } else if (!d.dispMutationType) {
        return noMutationAppearance;
    } else {
        return oncoprintMutationTypeToAppearance[d.dispMutationType];
    }
}
function getCopyNumberAppearance(d:IScatterPlotSampleData) {
    if (!d.profiledCna || !d.dispCna) {
        return notProfiledCnaAppearance;
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
                        return notProfiledMutationsAppearance;
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

export function tooltipMutationsSection(
    mutations:AnnotatedMutation[],
) {
    const oncoKbIcon = (mutation:AnnotatedMutation)=>(<img src={require("../../../rootImages/oncokb-oncogenic-1.svg")} title={mutation.oncoKbOncogenic} style={{height:11, width:11, marginLeft:2, marginBottom: 2}}/>);
    const hotspotIcon = <img src={require("../../../rootImages/cancer-hotspots.svg")} title="Hotspot" style={{height:11, width:11, marginLeft:2, marginBottom:3}}/>;
    const mutationsByGene = _.groupBy(mutations.filter(m=>!!m.proteinChange), m=>m.hugoGeneSymbol);
    const sorted = _.chain(mutationsByGene).entries().sortBy(x=>x[0]).value();
    return (
        <span>
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
        </span>
    );
}

export function tooltipCnaSection(
    data:AnnotatedNumericGeneMolecularData[],
) {
    const oncoKbIcon = (alt:AnnotatedNumericGeneMolecularData)=>(<img src={require("../../../rootImages/oncokb-oncogenic-1.svg")} title={alt.oncoKbOncogenic} style={{height:11, width:11, marginLeft:2, marginBottom: 2}}/>);
    const altsByGene = _.groupBy(data, alt=>alt.hugoGeneSymbol);
    const sorted = _.chain(altsByGene).entries().sortBy(x=>x[0]).value();
    return (
        <span>
            {sorted.map(entry=>{
                const alterationComponents = [];
                for (const alt of entry[1]) {
                    if (alt.value in cnaToAppearance) {
                        alterationComponents.push(
                            <span key={alt.value}>
                                {(cnaToAppearance as any)[alt.value].legendLabel}<span style={{marginLeft:1}}>{alt.oncoKbOncogenic ? oncoKbIcon(alt) : null}</span>
                            </span>
                        );
                        alterationComponents.push(<span>, </span>);
                    }
                }
                alterationComponents.pop(); // remove last comma
                return (
                    <span>
                        {entry[0]}: {alterationComponents}
                    </span>
                );
            })}
        </span>
    );
}

function generalScatterPlotTooltip<D extends IScatterPlotSampleData>(
    d:D,
    horizontalKey:keyof D,
    verticalKey:keyof D
) {
    let mutationsSection:any = null;
    if (d.mutations.length > 0) {
        mutationsSection = tooltipMutationsSection(d.mutations);
    }
    let cnaSection:any = null;
    if (d.copyNumberAlterations.length > 0) {
        cnaSection = tooltipCnaSection(d.copyNumberAlterations);
    }
    return (
        <div>
            <a href={getSampleViewUrl(d.studyId, d.sampleId)} target="_blank">{d.sampleId}</a>
            <div>Horizontal: <span style={{fontWeight:"bold"}}>{d[horizontalKey] as any}</span></div>
            <div>Vertical: <span style={{fontWeight:"bold"}}>{d[verticalKey] as any}</span></div>
            {mutationsSection}
            {!!mutationsSection && <br/>}
            {cnaSection}
        </div>
    );
}

export function scatterPlotTooltip(d:IScatterPlotData) {
    return generalScatterPlotTooltip(d, "x", "y");
}

export function boxPlotTooltip(
    d:IBoxScatterPlotPoint,
    horizontal:boolean
) {
    return generalScatterPlotTooltip(d, horizontal ? "value" : "category", horizontal ? "category" : "value");
}

export function logScalePossible(
    axisSelection: AxisMenuSelection
) {
    if (axisSelection.dataType !== CLIN_ATTR_DATA_TYPE) {
        // molecular profile
        return !!(
            axisSelection.dataSourceId &&
            !(/zscore/i.test(axisSelection.dataSourceId)) &&
            /rna_seq/i.test(axisSelection.dataSourceId)
        );
    } else {
        // clinical attribute
        return axisSelection.dataSourceId === MUTATION_COUNT;
    }

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
        data:AnnotatedNumericGeneMolecularData[]
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
        data:AnnotatedNumericGeneMolecularData[]
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
        data:AnnotatedNumericGeneMolecularData[]
    }
):IScatterPlotData[];

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
        data:AnnotatedNumericGeneMolecularData[]
    }
):IScatterPlotData[]|IBoxScatterPlotPoint[] {
    const mutationsMap:{[uniqueSampleKey:string]:AnnotatedMutation[]} =
        mutations ? _.groupBy(mutations.data, m=>m.uniqueSampleKey) : {};
    const cnaMap:{[uniqueSampleKey:string]:AnnotatedNumericGeneMolecularData[]} =
        copyNumberAlterations? _.groupBy(copyNumberAlterations.data, d=>d.uniqueSampleKey) : {};
    const dataMap:{[uniqueSampleKey:string]:Partial<IScatterPlotSampleData & { horzValues:string[]|number[], vertValues:number[], jitter:number }>} = {};
    for (const d of horzData.data) {
        const sample = uniqueSampleKeyToSample[d.uniqueSampleKey];
        const sampleCopyNumberAlterations:AnnotatedNumericGeneMolecularData[] | undefined = cnaMap[d.uniqueSampleKey];
        let dispCna:AnnotatedNumericGeneMolecularData | undefined = undefined;
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
                    const driverSuffix = (mutationType !== "fusion" && mutationType !== "promoter" && mutationType !== "other" && mutation.putativeDriver) ? ".driver" : "";
                    return `${mutationType}${driverSuffix}`;
                })
                .mapValues(muts=>muts.length)
                .value();
            dispMutationType = selectDisplayValue(counts, mutationRenderPriority) as OncoprintMutationType;
        }
        const sampleCoverageInfo = coverageInformation[d.uniqueSampleKey];
        let profiledMutations = undefined;
        let profiledCna = undefined;
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
            horzValues: ([] as string[]).concat(d.value as string),
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
            datum.vertValues = ([] as number[]).concat(d.value);
            datum.jitter = getJitterForCase(d.uniqueSampleKey);
            data.push(datum);
        }
    }
    // expand horz and vert values in case theres multiple
    const expandedData:any[] = [];
    for (const d of data) {
        for (const horzValue of d.horzValues) {
            for (const vertValue of d.vertValues) {
                // filter out NaN number values
                if (!Number.isNaN(horzValue as any) && !Number.isNaN(vertValue as any)) {
                    expandedData.push(
                        Object.assign({}, d, {
                            x: horzValue as string,
                            category: horzValue as string,
                            y: vertValue as number,
                            value: vertValue as number
                        })
                    );
                }
            }
        }
    }
    return expandedData;
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
    horzSelection:AxisMenuSelection,
    vertSelection:AxisMenuSelection,
    cnaDataShown:boolean
) {
    if (!cnaDataShown) {
        return [];
    }
    const queries:{entrezGeneId:number}[] = [];
    if (horzSelection.dataType !== CLIN_ATTR_DATA_TYPE && horzSelection.entrezGeneId !== undefined) {
        queries.push({entrezGeneId: horzSelection.entrezGeneId});
    }
    if (vertSelection.dataType !== CLIN_ATTR_DATA_TYPE && vertSelection.entrezGeneId !== undefined &&
            vertSelection.entrezGeneId !== horzSelection.entrezGeneId) {
        queries.push({entrezGeneId: vertSelection.entrezGeneId});
    }
    return queries;
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

export function getMutationProfileDuplicateSamplesReport(
    horzAxisData:Pick<IAxisData,"data">,
    vertAxisData:Pick<IAxisData,"data">,
    horzSelection:Pick<AxisMenuSelection,"dataType">,
    vertSelection:Pick<AxisMenuSelection,"dataType">
) {
    // sampleToNumPoints maps a sample key to the number of points in the plot
    //  which are due to this sample. only samples with more than one point are
    //  entered.
    const sampleToNumPoints:{[uniqueSampleKey:string]:number} = {};

    if (horzSelection.dataType === AlterationTypeConstants.MUTATION_EXTENDED) {
        for (const d of horzAxisData.data) {
            if (Array.isArray(d.value) && d.value.length > 1) {
                // only samples with more than one point are entered

                // for the contribution from horz data, the sample is associated with this many points
                sampleToNumPoints[d.uniqueSampleKey] = d.value.length;
            }
        }
    }

    if (vertSelection.dataType === AlterationTypeConstants.MUTATION_EXTENDED) {
        for (const d of vertAxisData.data) {
            if (Array.isArray(d.value) && d.value.length > 1) {
                // only samples with more than one point are entered

                // we combine the contribution from horz and vert data - we multiply them, bc a point is created
                //  for each horz value for each vert value
                sampleToNumPoints[d.uniqueSampleKey] = (sampleToNumPoints[d.uniqueSampleKey] || 1)*d.value.length;
            }
        }
    }

    const numSamples = Object.keys(sampleToNumPoints).length;
    const numPointsForTheseSamples = _.reduce(sampleToNumPoints, (sum, nextNumPoints)=>sum+nextNumPoints, 0);
    const numSurplusPoints = numPointsForTheseSamples - numSamples;

    return {
        showMessage: numSamples > 0,
        numSamples, numSurplusPoints
    };
}