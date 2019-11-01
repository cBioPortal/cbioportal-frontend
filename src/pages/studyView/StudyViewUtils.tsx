import _ from "lodash";
import {SingleGeneQuery} from "shared/lib/oql/oql-parser";
import {unparseOQLQueryLine} from "shared/lib/oql/oqlfilter";
import {
    ClinicalDataCount,
    ClinicalDataIntervalFilterValue,
    DataBin,
    SampleIdentifier,
    StudyViewFilter,
    ClinicalDataBinFilter
} from "shared/api/generated/CBioPortalAPIInternal";
import {CancerStudy, ClinicalAttribute, Gene, PatientIdentifier, Sample, ClinicalData} from "shared/api/generated/CBioPortalAPI";
import * as React from "react";
import {buildCBioPortalPageUrl} from "../../shared/api/urls";
import {IStudyViewScatterPlotData} from "./charts/scatterPlot/StudyViewScatterPlot";
import {BarDatum} from "./charts/barChart/BarChart";
import {
    StudyViewPageTabKeyEnum, ChartUserSetting, CustomChart
} from "./StudyViewPageStore";
import {Layout} from 'react-grid-layout';
import internalClient from "shared/api/cbioportalInternalClientInstance";
import {VirtualStudy} from "shared/model/VirtualStudy";
import defaultClient from "shared/api/cbioportalClientInstance";
import {ChartDimension, ChartTypeEnum, Position, STUDY_VIEW_CONFIG} from "./StudyViewConfig";
import {IStudyViewDensityScatterPlotDatum} from "./charts/scatterPlot/StudyViewDensityScatterPlot";
import MobxPromise from 'mobxpromise';
import {getTextWidth} from "../../public-lib/lib/TextTruncationUtils";
import {CNA_COLOR_AMP, CNA_COLOR_HOMDEL, DEFAULT_NA_COLOR, getClinicalValueColor} from "shared/lib/Colors";
import {StudyViewComparisonGroup} from "../groupComparison/GroupComparisonUtils";
import styles from './styles.module.scss';
import { getGroupParameters, getStudiesAttr } from "pages/groupComparison/comparisonGroupManager/ComparisonGroupManagerUtils";
import { SessionGroupData } from "shared/api/ComparisonGroupClient";
import { stringListToIndexSet } from "public-lib";

// Cannot use ClinicalDataTypeEnum here for the strong type. The model in the type is not strongly typed
export enum ClinicalDataTypeEnum {
    SAMPLE = 'SAMPLE',
    PATIENT = 'PATIENT',
}

export enum NumericalGroupComparisonType {
    QUARTILES = 'QUARTILES',
    MEDIAN='MEDIAN',
    BINS = 'BINS'
}

export type ClinicalDataType = 'SAMPLE' | 'PATIENT';
export type ChartType =
    'PIE_CHART'
    | 'BAR_CHART'
    | 'SURVIVAL'
    | 'TABLE'
    | 'SCATTER'
    | 'MUTATED_GENES_TABLE'
    | 'FUSION_GENES_TABLE'
    | 'CNA_GENES_TABLE'
    | 'NONE';

export enum UniqueKey {
    MUTATED_GENES_TABLE = 'MUTATED_GENES_TABLE',
    FUSION_GENES_TABLE = 'FUSION_GENES_TABLE',
    CNA_GENES_TABLE = 'CNA_GENES_TABLE',
    CUSTOM_SELECT = 'CUSTOM_SELECT',
    SELECTED_COMPARISON_GROUPS = 'SELECTED_COMPARISON_GROUPS',
    MUTATION_COUNT_CNA_FRACTION = 'MUTATION_COUNT_CNA_FRACTION',
    DISEASE_FREE_SURVIVAL = 'DFS_SURVIVAL',
    OVERALL_SURVIVAL = 'OS_SURVIVAL',
    CANCER_STUDIES = 'CANCER_STUDIES',
    MUTATION_COUNT = "SAMPLE_MUTATION_COUNT",
    FRACTION_GENOME_ALTERED = "SAMPLE_FRACTION_GENOME_ALTERED",
    WITH_MUTATION_DATA = "WITH_MUTATION_DATA",
    WITH_FUSION_DATA = "WITH_FUSION_DATA",
    WITH_CNA_DATA = "WITH_CNA_DATA"
}

export type AnalysisGroup = { name?:string, value: string, color: string, legendText?: string };

export enum ChartMetaDataTypeEnum {
    CLINICAL = 'CLINICAL',
    GENOMIC = 'GENOMIC'
}

export type ChartMetaDataType = ChartMetaDataTypeEnum.CLINICAL | ChartMetaDataTypeEnum.GENOMIC;
export type ChartMeta = {
    clinicalAttribute?: ClinicalAttribute,
    uniqueKey: string,
    displayName: string,
    description: string,
    priority: number,
    dataType: ChartMetaDataType,
    patientAttribute: boolean,
    renderWhenDataChange: boolean
}
export type ChartMetaWithDimensionAndChartType = ChartMeta & {
    dimension: ChartDimension,
    chartType: ChartType,
}
export type ClinicalDataCountSet = { [attrId: string]: number };
export type StudyWithSamples = CancerStudy & {
    uniqueSampleKeys: string[]
}
export type StudyViewFilterWithSampleIdentifierFilters = StudyViewFilter & {
    sampleIdentifiersSet: { [id: string]: SampleIdentifier[] }
}

export enum Datalabel {
    YES = 'YES',
    NO = 'NO',
    NA = "NA"
}

export const SPECIAL_CHARTS: ChartMetaWithDimensionAndChartType[] = [{
    uniqueKey: UniqueKey.CANCER_STUDIES,
    displayName: 'Cancer Studies',
    description: 'Cancer Studies',
    dataType: ChartMetaDataTypeEnum.CLINICAL,
    patientAttribute: false,
    chartType: ChartTypeEnum.PIE_CHART,
    dimension: {
        w: 1,
        h: 1
    },
    renderWhenDataChange: false,
    priority: 70
},
    {
        uniqueKey: UniqueKey.WITH_MUTATION_DATA,
        displayName: 'With Mutation Data',
        description: 'With Mutation Data',
        chartType: ChartTypeEnum.PIE_CHART,
        dataType: ChartMetaDataTypeEnum.GENOMIC,
        patientAttribute: false,
        dimension: {
            w: 1,
            h: 1
        },
        priority: 0,
        renderWhenDataChange: false
    },
    {
        uniqueKey: UniqueKey.WITH_FUSION_DATA,
        displayName: 'With Fusion Data',
        description: 'With Fusion Data',
        chartType: ChartTypeEnum.PIE_CHART,
        dataType: ChartMetaDataTypeEnum.GENOMIC,
        patientAttribute: false,
        dimension: {
            w: 1,
            h: 1
        },
        priority: 0,
        renderWhenDataChange: false
    },
    {
        uniqueKey: UniqueKey.WITH_CNA_DATA,
        displayName: 'With CNA Data',
        description: 'With CNA Data',
        chartType: ChartTypeEnum.PIE_CHART,
        dataType: ChartMetaDataTypeEnum.GENOMIC,
        patientAttribute: false,
        dimension: {
            w: 1,
            h: 1
        },
        priority: 0,
        renderWhenDataChange: false
    }];

export const COLORS = [
    STUDY_VIEW_CONFIG.colors.theme.primary, STUDY_VIEW_CONFIG.colors.theme.secondary,
    STUDY_VIEW_CONFIG.colors.theme.tertiary, STUDY_VIEW_CONFIG.colors.theme.quaternary,
    '#990099', '#0099c6', '#dd4477', '#66aa00',
    '#b82e2e', '#316395', '#994499', '#22aa99',
    '#aaaa11', '#6633cc', '#e67300', '#8b0707',
    '#651067', '#329262', '#5574a6', '#3b3eac',
    '#b77322', '#16d620', '#b91383', '#f4359e',
    '#9c5935', '#a9c413', '#2a778d', '#668d1c',
    '#bea413', '#0c5922', '#743411', '#743440',
    '#9986e2', '#6c3912', '#788508', '#609618',
    '#790099', '#5099c6', '#2d4477', '#76aa00',
    '#882e2e', '#916395', '#794499', '#92aa99',
    '#2aaa11', '#5633cc', '#667300', '#100707',
    '#751067', '#229262', '#4574a6', '#103eac',
    '#177322', '#66d620', '#291383', '#94359e',
    '#5c5935', '#29c413', '#6a778d', '#868d1c',
    '#5ea413', '#6c5922', '#243411', '#103440',
    '#2886e2', '#d93912', '#f28508', '#110618',
    '#970099', '#0109c6', '#d10477', '#68aa00',
    '#b12e2e', '#310395', '#944499', '#24aa99',
    '#a4aa11', '#6333cc', '#e77300', '#820707',
    '#610067', '#339262', '#5874a6', '#313eac',
    '#b67322', '#13d620', '#b81383', '#f8359e',
    '#935935', '#a10413', '#29778d', '#678d1c',
    '#b2a413', '#075922', '#763411', '#773440',
    '#2996e2', '#dc4912', '#f81508', '#104618',
    '#991099', '#0049c6', '#dd2477', '#663a00',
    '#b84e2e', '#312395', '#993499', '#223a99',
    '#aa1a11', '#6673cc', '#e66300', '#8b5707',
    '#656067', '#323262', '#5514a6', '#3b8eac',
    '#b71322', '#165620', '#b99383', '#f4859e',
    '#9c4935', '#a91413', '#2a978d', '#669d1c',
    '#be1413', '#0c8922', '#742411', '#744440',
    '#2983e2', '#dc3612', '#f88808', '#109518',
    '#990599', '#0092c6', '#dd4977', '#66a900',
    '#b8282e', '#316295', '#994199', '#22a499',
    '#aaa101', '#66310c', '#e67200', '#8b0907',
    '#651167', '#329962', '#5573a6', '#3b37ac',
    '#b77822', '#16d120', '#b91783', '#f4339e',
    '#9c5105', '#a9c713', '#2a710d', '#66841c',
    '#bea913', '#0c5822', '#743911', '#743740',
    '#298632', '#dc3922', '#f88588', '#109658',
    '#990010', '#009916', '#dd4447', '#66aa60',
    '#b82e9e', '#316365', '#994489', '#22aa69',
    '#aaaa51', '#66332c', '#e67390', '#8b0777',
    '#651037', '#329232', '#557486', '#3b3e4c',
    '#b77372', '#16d690', '#b91310', '#f4358e',
    '#9c5910', '#a9c493', '#2a773d', '#668d5c',
    '#bea463', '#0c5952', '#743471', '#743450',
    '#2986e3', '#dc3914', '#f88503', '#109614',
    '#990092', '#0099c8', '#dd4476', '#66aa04',
    '#b82e27', '#316397', '#994495', '#22aa93',
    '#aaaa14', '#6633c1', '#e67303', '#8b0705',
    '#651062', '#329267', '#5574a1', '#3b3ea5'
];

export const NA_DATA = "NA";
export const EXPONENTIAL_FRACTION_DIGITS = 3;

export const MutationCountVsCnaYBinsMin = 52; // calibrated so that the dots are right up against each other. needs to correspond with the width and height of the chart


const OPERATOR_MAP: {[op:string]: string} = {
    "<=": "≤",
    "<" : "<",
    ">=": "≥",
    ">": ">"
};

export function getClinicalAttributeOverlay(displayName: string, description: string, clinicalAttributeId?: string): JSX.Element {
    const comparisonDisplayName = displayName.toLowerCase().trim();
    let comparisonDescription = description.toLowerCase().trim().replace(/.&/, '');
    return <div style={{maxWidth: '300px'}}>
        <div><b>{displayName}</b> {!!clinicalAttributeId &&
        <span className={styles.titleMeta}>ID: {clinicalAttributeId}</span>}</div>
        {comparisonDescription !== comparisonDisplayName && <div>{description}</div>}
    </div>;
}

export function updateGeneQuery(geneQueries: SingleGeneQuery[], selectedGene: string): SingleGeneQuery[] {

    let updatedQueries = _.filter(geneQueries,query=> query.gene !== selectedGene)
    if(updatedQueries.length === geneQueries.length){
        updatedQueries.push({
            gene: selectedGene,
            alterations: false
        })
    }
    return updatedQueries;

}

function translateSpecialText(text: string | undefined): string {
    if (!text) {
        return "";
    } else if (text === ">=") {
        return "≥";
    } else if (text === "<=") {
        return "≤";
    }

    return text;
}

export function formatRange(min: number | undefined, max: number | undefined, special: string | undefined): string {
    special = translateSpecialText(special);

    if(min === undefined) {
        if (max === undefined) {
            return special;
        } else {
            return `${special}${max.toLocaleString()}`;
        }
    } else {
        if (max === undefined) {
            return `${special}${min.toLocaleString()}`;
        } else if (min !== max) {
            return `${special}${min.toLocaleString()}-${max.toLocaleString()}`;
        } else {
            return `${special}${min.toLocaleString()}`
        }
    }
}

function getBinStatsForTooltip(d:IStudyViewDensityScatterPlotDatum) {
    let mutRange = formatRange(d.minY, d.maxY, undefined);
    let fgaRange = "";
    if (d.maxX.toFixed(2) !== d.minX.toFixed(2)) {
        fgaRange = `${d.minX.toFixed(2)}-${d.maxX.toFixed(2)}`;
    } else {
        fgaRange = d.minX.toFixed(2);
    }
    return {mutRange, fgaRange};
}

export function mutationCountVsCnaTooltip(d:IStudyViewDensityScatterPlotDatum) {
    const binStats = getBinStatsForTooltip(d);
    return (
        <div>
            <div>Number of Samples: <b>{d.count.toLocaleString()}</b></div>
            <div>Mutation Count: <b>{binStats.mutRange}</b></div>
            <div>Fraction Genome Altered: <b>{binStats.fgaRange}</b></div>
        </div>
    );
}

export function generateScatterPlotDownloadData(data: IStudyViewScatterPlotData[],
                                                sampleToAnalysisGroup?: {[sampleKey:string]:string},
                                                analysisClinicalAttribute?: ClinicalAttribute,
                                                analysisGroups?: AnalysisGroup[])
{
    const header = ["Cancer Study", "Patient ID", "Sample ID", "Mutation Count", "CNA Fraction"];
    let valueToGroup: {[value: string] : AnalysisGroup};

    if (analysisClinicalAttribute !== undefined && sampleToAnalysisGroup !== undefined) {
        header.push(analysisClinicalAttribute.displayName);

        if (analysisGroups !== undefined) {
            header.push("Color");
            valueToGroup = _.keyBy(analysisGroups, 'value');
        }
    }

    const rows = data.map(datum => {
        const row = [
            `${datum.studyId}`,
            `${datum.patientId}`,
            `${datum.sampleId}`,
            `${datum.y}`,
            `${datum.x}`
        ];

        if (analysisClinicalAttribute !== undefined && sampleToAnalysisGroup !== undefined) {
            const value = sampleToAnalysisGroup[datum.uniqueSampleKey];

            row.push(value !== undefined ? `${value}` : 'NA');

            if (analysisGroups !== undefined && value !== undefined) {
                row.push(valueToGroup[value] !== undefined ? valueToGroup[value].color : 'NA');
            }
        }

        return row;
    });

    return [header].concat(rows).map(row => row.join("\t")).join("\n");
}

export function isSelected(datum: { uniqueSampleKey: string }, selectedSamples: { [uniqueSampleKey: string]: any }) {
    return datum.uniqueSampleKey in selectedSamples;
}

export function getPriority(priorities: number[]): number {
    let priority = 0;
    _.some(priorities, _priority => {
        if (_priority === 0) {
            priority = 0;
            return true;
        }
        priority = (_priority + priority) / 2;
    });
    return priority;
}

export function getClinicalDataType(patientAttribute: boolean): ClinicalDataType {
    return patientAttribute ? ClinicalDataTypeEnum.PATIENT : ClinicalDataTypeEnum.SAMPLE;
}

export function getClinicalAttributeUniqueKey(attribute: ClinicalAttribute): string {
    const clinicalDataType = getClinicalDataType(attribute.patientAttribute);
    return getClinicalAttributeUniqueKeyByDataTypeAttrId(clinicalDataType, attribute.clinicalAttributeId);
}

export function getClinicalAttributeUniqueKeyByDataTypeAttrId(dataType: ClinicalDataType , attrId: string): string {
    return dataType + '_' + attrId;
}

export function getCurrentDate() {
    return new Date().toISOString().slice(0, 10);
}

export function getVirtualStudyDescription(
                                            previousDescription: string | undefined,
                                            studyWithSamples: StudyWithSamples[],
                                            filter: StudyViewFilterWithSampleIdentifierFilters,
                                            attributeNamesSet: { [id: string]: string },
                                            genes: Gene[],
                                            user?: string) {
    let descriptionLines: string[] = [];
    const createdOnStr = 'Created on';
    if (previousDescription) {
        // when the description is predefined, we just need to trim off anything after createdOnStr
        const regex = new RegExp(`${createdOnStr}.*`);
        descriptionLines.push(previousDescription.replace(regex, ''));
    } else {

        let entrezIdSet: { [id: string]: string } = _.reduce(genes, (acc: { [id: string]: string }, next) => {
            acc[next.entrezGeneId] = next.hugoGeneSymbol
            return acc
        }, {})
        //add to samples and studies count

        let uniqueSampleKeys = _.uniq(_.flatMap(studyWithSamples, study => study.uniqueSampleKeys))
        descriptionLines.push(`${uniqueSampleKeys.length} sample${uniqueSampleKeys.length > 1 ? 's' : ''} from ${studyWithSamples.length} ${studyWithSamples.length > 1 ? 'studies:' : 'study:'}`);
        //add individual studies sample count
        studyWithSamples.forEach(studyObj => {
            descriptionLines.push(`- ${studyObj.name} (${studyObj.uniqueSampleKeys.length} sample${uniqueSampleKeys.length > 1 ? 's' : ''})`);
        })
        //add filters
        let filterLines: string[] = [];
        if (!_.isEmpty(filter)) {
            if (filter.cnaGenes && filter.cnaGenes.length > 0) {
                filterLines.push('- CNA Genes:')
                filterLines = filterLines.concat(filter.cnaGenes.map(cnaGene => {
                    return cnaGene.alterations.map(alteration => {
                        let geneSymbol = entrezIdSet[alteration.entrezGeneId] || alteration.entrezGeneId
                        return geneSymbol + "-" + getCNAByAlteration(alteration.alteration)
                    }).join(', ').trim();
                }).map(line => '  - ' + line));
            }
            if (filter.mutatedGenes && filter.mutatedGenes.length > 0) {
                filterLines.push('- Mutated Genes:')
                filterLines = filterLines.concat(filter.mutatedGenes.map(mutatedGene => {
                    return mutatedGene.entrezGeneIds.map(entrezGeneId => {
                        return entrezIdSet[entrezGeneId] || entrezGeneId;
                    }).join(', ').trim();
                }).map(line => '  - ' + line));
            }
            if (filter.fusionGenes && filter.fusionGenes.length > 0) {
                filterLines.push('- Fusion Genes:')
                filterLines = filterLines.concat(filter.fusionGenes.map(fusionGene => {
                    return fusionGene.entrezGeneIds.map(entrezGeneId => {
                        return entrezIdSet[entrezGeneId] || entrezGeneId;
                    }).join(', ').trim();
                }).map(line => '  - ' + line));
            }

            if (filter.withMutationData !== undefined) {
                filterLines.push(`With Mutation data: ${filter.withMutationData ? 'YES' : 'NO'}`);
            }

            if (filter.withCNAData !== undefined) {
                filterLines.push(`With CNA data: ${filter.withCNAData ? 'YES' : 'NO'}`);
            }

            _.each(filter.clinicalDataEqualityFilters || [], (clinicalDataEqualityFilter) => {
                let name = attributeNamesSet[clinicalDataEqualityFilter.clinicalDataType + '_' + clinicalDataEqualityFilter.attributeId];
                filterLines.push(`- ${name}: ${clinicalDataEqualityFilter.values.join(', ')}`);
            });

            _.each(filter.clinicalDataIntervalFilters || [], (clinicalDataIntervalFilter) => {
                let name = attributeNamesSet[clinicalDataIntervalFilter.clinicalDataType + '_' + clinicalDataIntervalFilter.attributeId];
                filterLines.push(`- ${name}: ${intervalFiltersDisplayValue(clinicalDataIntervalFilter.values)}`);
            });

            _.each(filter.sampleIdentifiersSet || {}, (sampleIdentifiers, id) => {
                let name = attributeNamesSet[id] || id;
                filterLines.push(`- ${name}: ${sampleIdentifiers.length} samples`);
            })
        }
        if (filterLines.length > 0) {
            descriptionLines.push('');
            descriptionLines.push('Filters:');
            descriptionLines = descriptionLines.concat(filterLines);
        }
        descriptionLines.push('');
    }
    //add creation and user name
    descriptionLines.push(`${createdOnStr} ` + getCurrentDate() + (user ? ' by ' + user : ''));
    return descriptionLines.join('\n');
}

export function isFiltered(filter: Partial<StudyViewFilterWithSampleIdentifierFilters>) {
    const flag = !(_.isEmpty(filter) || (
            _.isEmpty(filter.clinicalDataEqualityFilters) &&
            _.isEmpty(filter.clinicalDataIntervalFilters) &&
            _.isEmpty(filter.cnaGenes) &&
            _.isEmpty(filter.mutatedGenes) &&
            _.isEmpty(filter.fusionGenes) &&
            filter.withMutationData === undefined &&
            filter.withCNAData === undefined &&
            !filter.mutationCountVsCNASelection)
    );

    if (filter.sampleIdentifiersSet) {
        return flag || !_.isEmpty(filter.sampleIdentifiersSet)
    } else {
        return flag;
    }
}

export function makePatientToClinicalAnalysisGroup(
    samples:Pick<Sample, "uniqueSampleKey"|"uniquePatientKey">[],
    sampleToAnalysisGroup:{[sampleKey:string]:string}
) {
    // only include a patient if all its samples are in the same analysis group
    const badPatients:{[patientKey:string]:boolean} = {};
    return _.reduce(samples, (map, sample)=>{
        const patientKey = sample.uniquePatientKey;
        if (!(patientKey in badPatients)) {
            // weve not already determined that not all this patients samples are in the same group

            const sampleGroup = sampleToAnalysisGroup[sample.uniqueSampleKey];
            if (patientKey in map) {
                if (map[patientKey] !== sampleGroup) {
                    // this means that weve seen another sample for this patient thats not
                    //  in the same group. therefore, not all this patients samples are in
                    //  the same group, so we're going to omit it
                    delete map[patientKey];
                    badPatients[patientKey] = true;
                } // otherwise, we already have the right group, so dont do anything
            } else {
                // this is the first sample weve seen from this patient
                map[patientKey] = sampleGroup;
            }
        }
        return map;
    }, {} as {[patientKey:string]:string});
}

export function toSvgDomNodeWithLegend(svgElement: SVGElement,
                                       params:{
                                           legendGroupSelector: string,
                                           selectorToHide?:string,
                                           chartGroupSelector?: string,
                                           centerLegend?: boolean
                                       })
{
    const svg = svgElement.cloneNode(true) as SVGElement;
    const legend = $(svgElement).find(params.legendGroupSelector).get(0);
    const legendBBox = legend.getBoundingClientRect();

    if (params.selectorToHide) {
        $(svg).find(params.selectorToHide).remove();
    }

    const height = + $(svgElement).height()! + legendBBox.height;
    const width = Math.max($(svgElement).width()!, legendBBox.width);

    // adjust width and height to make sure that the legend is fully visible
    $(svg).attr("height", height + 5);
    $(svg).attr("width", width);
    $(svg).css({height: height + 5, width});

    // center elements
    if (params.centerLegend) {
        const widthDiff = Math.abs($(svgElement).width()! - legendBBox.width);
        const shift = widthDiff / 2;
        const transform = `translate(${shift}, 0)`;

        if ($(svgElement).width()! > legendBBox.width) {
            // legend needs to be centered wrt the chart
            $(svg).find(params.legendGroupSelector).attr("transform", transform);
        }
        else if (params.chartGroupSelector) {
            // chart needs to be centered wrt the legend
            $(svg).find(params.chartGroupSelector).attr("transform", transform);
        }
    }

    return svg;
}

export function getClinicalDataIntervalFilterValues(data: DataBin[]): ClinicalDataIntervalFilterValue[]
{
    const values: Partial<ClinicalDataIntervalFilterValue>[] = data.map(dataBin => ({
        start: dataBin.start,
        end: dataBin.end,
        value: dataBin.start === undefined && dataBin.end === undefined ? dataBin.specialValue : undefined
    }));

    return values as ClinicalDataIntervalFilterValue[];
}

export function filterNumericalBins(data: DataBin[]) {
    return data.filter(dataBin => dataBin.start !== undefined || dataBin.end !== undefined);
}

export function filterCategoryBins(data: DataBin[]) {
    return data.filter(dataBin => dataBin.start === undefined && dataBin.end === undefined);
}

export function filterIntervalBins(numericalBins: DataBin[]) {
    return numericalBins.filter(dataBin => dataBin.start !== undefined && dataBin.end !== undefined);
}

export function calcIntervalBinValues(intervalBins: DataBin[]) {
    const values = intervalBins.map(dataBin => dataBin.start);

    if (intervalBins.length > 0) {
        const lastIntervalBin = intervalBins[intervalBins.length - 1];

        if (lastIntervalBin.start !== lastIntervalBin.end) {
            values.push(lastIntervalBin.end);
        }
    }

    return values;
}

export function needAdditionShiftForLogScaleBarChart(numericalBins: DataBin[]):boolean {
    return isLogScaleByDataBins(numericalBins) &&
        numericalBins[0].start !== undefined &&
        numericalBins[0].start !== 0 &&
        !isIntegerPowerOfTen(numericalBins[0].start);
}

export function generateNumericalData(numericalBins: DataBin[]): BarDatum[] {
    // by default shift all x values by 1 -- we do not want to show a value right on the origin (zero)
    // additional possible shift for log scale
    const xShift = needAdditionShiftForLogScaleBarChart(numericalBins) ? 2 : 1;

    return numericalBins.map((dataBin: DataBin, index: number) => {
        let x;

        // we want to show special values (< or <=) right on the tick
        if (index === 0 && dataBin.start === undefined) {
            x = index;
        }
        // we want to show special values (> or >=) right on the tick (or next tick depending on the prev bin end)
        else if (index === numericalBins.length - 1 && dataBin.end === undefined) {
            x = index;

            // in case the previous data bin is a single value data bin (i.e start === end),
            // no need to add 1 (no interval needed for the previous value)
            if (index - 1 > 0 &&
                numericalBins[index -1].start !== numericalBins[index -1].end)
            {
                x++;
            }
        }
        // we want to show single values right on the tick
        else if (dataBin.start === dataBin.end) {
            x = index;
        }
        // we want to show range values in between 2 ticks
        else {
            x = index + 0.5;
        }

        // x is not the actual data value, it is the normalized data for representation
        // y is the actual count value
        return {
            x: x + xShift,
            y: dataBin.count,
            dataBin
        };
    });
}

export function generateCategoricalData(categoryBins: DataBin[], startIndex: number): BarDatum[] {
    // x is not the actual data value, it is the normalized data for representation
    // y is the actual count value
    return categoryBins.map((dataBin: DataBin, index: number) => ({
        x: startIndex + index + 1,
        y: dataBin.count,
        dataBin
    }));
}

export function isLogScaleByValues(values: number[]) {
    return (
        // empty list is not considered log scale
        values.length > 0 &&
        values.find(value =>
            // any value between -1 and 1 (except 0) indicates that this is not a log scale
            (value !== 0 && -1 < value && value < 1) ||
            // any value not in the form of 10^0.5, 10^2, etc. also indicates that this is not a log scale
            (value !== 0 && getExponent(value) % 0.5 !== 0)
        ) === undefined
    );
}

export function shouldShowChart(filer: Partial<StudyViewFilterWithSampleIdentifierFilters>, uniqueDataSize: number, sizeOfAllSamples: number) {
    return isFiltered(filer) || uniqueDataSize >= 2 || sizeOfAllSamples === 1;
}

export function isEveryBinDistinct(data?: DataBin[]) {
    return (
        data && data.length > 0 &&
        data.find(dataBin => dataBin.start !== dataBin.end) === undefined
    );
}

export function isLogScaleByDataBins(data?: DataBin[]) {
    if (!data) {
        return false;
    }

    const numericalBins = filterNumericalBins(data);
    const intervalBins = filterIntervalBins(numericalBins);
    const values = calcIntervalBinValues(intervalBins);

    // use only interval bin values when determining logScale
    return !isEveryBinDistinct(intervalBins) && isLogScaleByValues(values);
}

export function isScientificSmallValue(value: number) {
    // value should be between -0.001 and 0.001 (except 0) to be considered as scientific small number
    return value !== 0 && -0.001 <= value && value <= 0.001;
}

export function formatNumericalTickValues(numericalBins: DataBin[]) {
    if (numericalBins.length === 0) {
        return [];
    }

    const firstBin = numericalBins[0];
    const lastBin = numericalBins[numericalBins.length - 1];
    const intervalBins = filterIntervalBins(numericalBins);
    let values = calcIntervalBinValues(intervalBins);

    // use only interval bin values when determining logScale
    const isLogScale = !isEveryBinDistinct(intervalBins) && isLogScaleByValues(values);

    if (firstBin.start === undefined) {
        values = [firstBin.end, ...values];
    }
    else if (isLogScale && firstBin.start !== 0)
    {
        // we don't want to start with a value like 10^0.5, -10^3.5, etc. we prefer integer powers of 10
        if (!isIntegerPowerOfTen(firstBin.start)) {
            values = [closestIntegerPowerOfTen(firstBin.start, DataBinPosition.LEADING), ...values];
        }
    }

    if (lastBin.end === undefined) {
        values.push(lastBin.start);
    }
    else if (isLogScale && lastBin.end !== 0)
    {
        // we don't want to end with a value like 10^3.5, -10^0.5, etc. we prefer integer powers of 10
        if (!isIntegerPowerOfTen(lastBin.end)) {
            values.push(closestIntegerPowerOfTen(lastBin.end, DataBinPosition.TRAILING));
        }
    }

    let formatted: string[];

    if (isLogScale) {
        formatted = formatLogScaleValues(values);
    }
    else if (intervalBins.length > 0 &&
        isScientificSmallValue(intervalBins[Math.floor(intervalBins.length / 2)].end))
    {
        // scientific notation
        formatted = values.map(value => value.toExponential(0));
    }
    else {
        formatted = formatLinearScaleValues(values);
    }

    if (firstBin.start === undefined) {
        formatted[0] = `${OPERATOR_MAP[firstBin.specialValue] || firstBin.specialValue}${formatted[0]}`;
    }

    if (lastBin.end === undefined) {
        formatted[formatted.length - 1] =
            `${OPERATOR_MAP[lastBin.specialValue] || lastBin.specialValue}${formatted[formatted.length - 1]}`;
    }

    return formatted;
}

export function formatLinearScaleValues(values: number[])
{
    return values.map(value => isScientificSmallValue(value) ?
        value.toExponential(0) : toFixedDigit(value));
}

export function formatLogScaleValues(values: number[]) {
    return values.map(value => {
        let displayValue;

        if (value === -10 || value === -1 || value === 0 || value === 1 || value === 10) {
            displayValue = `${value}`;
        }
        else {
            const exponent = getExponent(value);

            if (Number.isInteger(exponent)) {
                displayValue = `10^${exponent.toFixed(0)}`;
            }
            else if (exponent % 0.5 === 0) {
                // hide non integer powers of 10 (but we still show the tick itself)
                displayValue = "";
            }
            else {
                // show special outliers (if any) as is
                displayValue = `${value}`;
            }

            if (displayValue && value < 0) {
                displayValue = `-${displayValue}`;
            }
        }

        return displayValue;
    });
}

export function isIntegerPowerOfTen(value: number) {
    let result = false;

    if (value) {
        const absLogValue = Math.log10(Math.abs(value));

        if (Number.isInteger(absLogValue)) {
            result = true;
        }
    }

    return result;
}

export enum DataBinPosition {
    LEADING = 1,
    TRAILING = -1
}

export function closestIntegerPowerOfTen(value: number, dataBinPosition: DataBinPosition) {
    if (value) {
        const absLogValue = Math.log10(Math.abs(value));
        const power = value * dataBinPosition > 0 ? Math.floor(absLogValue) : Math.ceil(absLogValue);
        const integerPower = Math.pow(10, power);

        return Math.sign(value) * integerPower;
    }
    else {
        return 1;
    }
}

export function intervalFiltersDisplayValue(values: ClinicalDataIntervalFilterValue[]) {
    const categories = values
        .filter(value => value.start === undefined && value.end === undefined)
        .map(value => value.value);

    const numericals = values.filter(value => value.start !== undefined || value.end !== undefined);

    // merge numericals into one interval
    const start = numericals.length > 0 ? numericals[0].start : undefined;
    const end = numericals.length > 0 ? numericals[numericals.length - 1].end : undefined;

    let displayValues: string[] = [];

    if (numericals.length > 0) {
        // both ends open
        if (start === undefined && end === undefined) {
            displayValues.push("All Numbers");
        }
        else if (start === undefined) {
            displayValues.push(`≤ ${formatValue(end)}`);
        }
        else if (end === undefined) {
            displayValues.push(`> ${formatValue(start)}`);
        }
        else if (start === end) {
            displayValues.push(`${formatValue(start)}`);
        }
        else if (numericals[0].start === numericals[0].end) {
            displayValues.push(`${formatValue(start)} ≤ x ≤ ${formatValue(end)}`);
        }
        else {
            displayValues.push(`${formatValue(start)} < x ≤ ${formatValue(end)}`);
        }
    }

    // copy categories as is
    if (categories.length > 0) {
        displayValues = displayValues.concat(categories);
    }

    return displayValues.length > 0 ? displayValues.join(", ") : "";
}

export function formatValue(value: number|undefined) {
    let formatted;

    if (value !== undefined) {
        if (isScientificSmallValue(value)) {
            formatted = value.toExponential(0);
        }
        else {
            formatted = toFixedDigit(value);
        }
    }

    return formatted;
}

export function toFixedDigit(value: number, fractionDigits: number = 2)
{
    if (!value) {
        return `${value}`;
    }

    const absValue = Math.abs(value);

    // no need to format integers
    if (Number.isInteger(absValue)) {
        return `${value}`;
    }

    let digits = fractionDigits;

    // for small numbers we need to know the exact number of leading decimal zeroes
    if (value < 1 && value > -1) {
        const absLogValue = Math.abs(Math.log10(absValue % 1));
        const numberOfLeadingDecimalZeroes = Number.isInteger(absLogValue) ?
            Math.floor(absLogValue) - 1 : Math.floor(absLogValue);

        digits += numberOfLeadingDecimalZeroes;
    }

    return `${Number(value.toFixed(digits))}`;
}

export function getChartMetaDataType(uniqueKey: string): ChartMetaDataType {
    const GENOMIC_DATA_TYPES = [
        UniqueKey.MUTATION_COUNT_CNA_FRACTION, UniqueKey.CNA_GENES_TABLE, UniqueKey.MUTATED_GENES_TABLE,
        UniqueKey.MUTATION_COUNT, UniqueKey.FRACTION_GENOME_ALTERED, UniqueKey.WITH_MUTATION_DATA, UniqueKey.WITH_CNA_DATA
    ];
    return _.includes(GENOMIC_DATA_TYPES, uniqueKey) ? ChartMetaDataTypeEnum.GENOMIC : ChartMetaDataTypeEnum.CLINICAL;
}

// 10px is reserved by ReactVisualized library as margin right
export function getFixedHeaderNumberCellMargin(columnWidth: number, theLongestString:string) {
    return Math.floor((columnWidth - 10 - getFixedHeaderTableMaxLengthStringPixel(theLongestString)) / 2);
}

export function getFixedHeaderTableMaxLengthStringPixel(text:string) {
    // This is a very specified function to calculate the text length
    // For fixed header table used in study view only
    const FRONT_SIZE = '13px';
    const FRONT_FAMILY = 'Helvetica Neue';
    return Math.floor(getTextWidth(text, FRONT_FAMILY, FRONT_SIZE));
}

export function correctMargin(margin: number) {
    return margin > 0 ? margin : 0;
}

export function correctColumnWidth(columnWidth: number) {
    return Math.ceil(columnWidth);
}

export function getFrequencyStr(value: number) {
    let str = '';
    if (value < 0) {
        return 'NA';
    } else if (value === 0) {
        str = '0';
    } else if (value < 100 && value >= 99.9) {
        str = `99.9`;
    } else if (value >= 0.1) {
        str = value.toFixed(1).toString();
    } else {
        str = '<0.1';
    }
    return `${str}%`;
}

export function formatFrequency(value: number) {
    if (value < 0) {
        return -1;
    } else if (value === 0) {
        return 0;
    } else if (value < 100 && value >= 99.9) {
         return 99.9;
    } else if (value >= 0.1) {
        value = Math.round(value * 10) / 10;
    } else {
        // This is a default value for anything that lower than 0.1 since we only keep one digit.
        // This equals to <0.1 ain the getFrequencyStr function
        value = 0.05;
    }
    return value;
}

export function getExponent(value: number): number
{
    // less precision for values like 3 and 31
    const fractionDigits = Math.abs(value) < 50 ? 1 : 2;

    return Number(Math.log10(Math.abs(value)).toFixed(fractionDigits));
}


export function getCNAByAlteration(alteration: number) {
    if ([-2, 2].includes(alteration))
        return alteration === -2 ? 'DEL' : 'AMP';
    return '';
}

export function getCNAColorByAlteration(alteration: number):string|undefined {
    if ([-2, 2].includes(alteration))
        return alteration === -2 ? CNA_COLOR_HOMDEL : CNA_COLOR_AMP;
    return undefined;
}

export function getDefaultChartTypeByClinicalAttribute(clinicalAttribute: ClinicalAttribute): ChartType | undefined {
    if (STUDY_VIEW_CONFIG.tableAttrs.includes(getClinicalAttributeUniqueKey(clinicalAttribute))) {
        return ChartTypeEnum.TABLE;
    }

    // TODO: update logic when number of categories above PIE_TO_TABLE_LIMIT
    if (clinicalAttribute.datatype === 'STRING') {
        return ChartTypeEnum.PIE_CHART;
    }

    if (clinicalAttribute.datatype === 'NUMBER') {
        return ChartTypeEnum.BAR_CHART;
    }

    return undefined;
}

/**
 * Calculate the layout used by react-grid-layout
 *
 * @param {ChartMeta[]} visibleAttributes
 * @param {number} cols number of grids per row, 6 cols will be the stander when using 13 inch laptop
 * @param {[id: string]: ChartDimension} chartsDimension
 * @returns {ReactGridLayout.Layout[]}
 */


export function findSpot(matrix: string[][], chartDimension: ChartDimension): Position {
    if (matrix.length === 0) {
        return {
            x: 0,
            y: 0
        };
    }
    let found: Position | undefined = undefined;
    _.each(matrix, (row: string[], rowIndex: number) => {
        _.each(row, (item: string, columnIndex: number) => {
            if (!item && !isOccupied(matrix, {x: columnIndex, y: rowIndex}, chartDimension)) {
                found = {x: columnIndex, y: rowIndex};
                return false;
            }
        });
        if (found) {
            return false;
        }
    });

    if (!found) {
        return {
            x: 0,
            y: matrix.length
        }
    } else {
        return found;
    }
}

export function isOccupied(matrix: string[][], position: Position, chartDimension: ChartDimension) {
    let occupied = false;
    if (matrix.length === 0) {
        return false;
    }

    // For chart higher than 1 grid, or wider than 1 grid, we only plot them on the odd index
    if (chartDimension.w > 1 && position.x % 2 !== 0) {
        occupied = true;
    }
    if (chartDimension.h > 1 && position.y % 2 !== 0) {
        occupied = true;
    }
    if (!occupied) {
        const xMax = position.x + chartDimension.w;
        const yMax = position.y + chartDimension.h;
        for (let i = position.y; i < yMax; i++) {
            if (i >= matrix.length) {
                break;
            }
            for (let j = position.x; j < xMax; j++) {
                if (j >= matrix[0].length || matrix[i][j]) {
                    occupied = true;
                    break;
                }
            }
            if (occupied) {
                break;
            }
        }
    }
    return occupied;
}

export function getDefaultChartDimension(): ChartDimension {
    return {w: 1, h: 1};
}

export function calculateLayout(
    visibleAttributes: ChartMeta[],
    cols: number,
    chartsDimension: { [uniqueId: string]: ChartDimension },
    currentGridLayout: Layout[],
    currentFocusedChartByUser?: ChartMeta,
    currentFocusedChartByUserDimension?: ChartDimension): Layout[] {
    let layout: Layout[] = [];
    let availableChartLayoutsMap:{[chartId:string]:boolean} = {}
    let matrix = [new Array(cols).fill('')] as string[][];
    // sort the visibleAttributes by priority
    visibleAttributes.sort(chartMetaComparator);
    // look if we need to put the chart to a fixed position and add the position to the matrix
    if (currentGridLayout.length > 0) {
        if (currentFocusedChartByUser && currentFocusedChartByUserDimension) {
            const currentChartLayout = currentGridLayout.find((layout) => layout.i === currentFocusedChartByUser.uniqueKey)!;
            if (currentChartLayout) {
                const newChartLayout = calculateNewLayoutForFocusedChart(currentChartLayout, currentFocusedChartByUser, cols, currentFocusedChartByUserDimension);
                layout.push(newChartLayout);
                availableChartLayoutsMap[currentFocusedChartByUser.uniqueKey] = true;
                matrix = generateMatrixByLayout(newChartLayout, cols);
            }
            else {
                throw (new Error("cannot find matching unique key in the grid layout"));
            }
        } else {
            const chartOrderMap = _.keyBy(currentGridLayout, chartLayout => chartLayout.i);
            // order charts based on x and y (first order by y, if y is same for both then order by x)
            // push all undefined charts to last
            visibleAttributes.sort((a, b) => {
                const chart1 = chartOrderMap[a.uniqueKey];
                const chart2 = chartOrderMap[b.uniqueKey];
                if (chart1 || chart2) {
                    if (!chart2) {
                        return -1;
                    }
                    if (!chart1) {
                        return 1;
                    }
                    return (chart1.y === chart2.y ? chart1.x - chart2.x : chart1.y - chart2.y);
                }
                return 0;
            });
        }
    }

    // filter out the fixed position chart then calculate layout
    _.forEach(_.filter(visibleAttributes, (chart: ChartMeta) => !availableChartLayoutsMap[chart.uniqueKey]), (chart: ChartMeta) => {
        const dimension = chartsDimension[chart.uniqueKey] || getDefaultChartDimension();
        const position = findSpot(matrix, dimension);
        while ((position.y + dimension.h) >= matrix.length) {
            matrix.push(new Array(cols).fill(''));
        }
        layout.push({
            i: chart.uniqueKey,
            x: position.x,
            y: position.y,
            w: dimension.w,
            h: dimension.h,
            isResizable: false
        });
        const xMax = position.x + dimension.w;
        const yMax = position.y + dimension.h;
        for (let i = position.y; i < yMax; i++) {
            for (let j = position.x; j < xMax; j++) {
                matrix[i][j] = chart.uniqueKey;
            }
        }
    });
    return layout;
}

export function calculateNewLayoutForFocusedChart(previousLayout: Layout, currentFocusedChartByUser: ChartMeta, cols: number, currentFocusedChartByUserDimension:ChartDimension): Layout {
    const initialX = previousLayout.x;
    const initialY = previousLayout.y;
    const dimensionWidth = currentFocusedChartByUserDimension.w;
    let x = initialX;
    let y = initialY;

    if (isFocusedChartShrunk({w: previousLayout.w, h: previousLayout.h}, currentFocusedChartByUserDimension)) {
        x = initialX + previousLayout.w - dimensionWidth;
    }
    else if (initialX + dimensionWidth >= cols && initialX - dimensionWidth >= 0) {
        x = cols - dimensionWidth;
    }

    return {
        i: currentFocusedChartByUser.uniqueKey,
        x,
        y,
        w: currentFocusedChartByUserDimension.w,
        h: currentFocusedChartByUserDimension.h,
        isResizable: false
    };
}

export function generateMatrixByLayout(layout: Layout, cols: number) : string[][] {
    let matrix = [new Array(cols).fill('')] as string[][];
    const xMax = layout.x + layout.w;
    const yMax = layout.y + layout.h;
    while (yMax >= matrix.length) {
        matrix.push(new Array(cols).fill(''));
    }
    for (let i = layout.y; i < yMax; i++) {
        for (let j = layout.x; j < xMax; j++) {
            matrix[i][j] = layout.i!;
        }
    }
    return matrix;
}

export function isFocusedChartShrunk(oldDimension: ChartDimension, newDimension: ChartDimension): boolean {
    return (oldDimension.w + oldDimension.h) > (newDimension.w + newDimension.h);
}

export function getPositionXByUniqueKey(layouts: Layout[], uniqueKey: string): number | undefined {
    const findLayoutResult = _.find(layouts, (layout) => {
        if (layout.i === uniqueKey) {
            return layout;
        }
    });
    return findLayoutResult ? findLayoutResult.x : undefined;
}

export function getPositionYByUniqueKey(layouts: Layout[], uniqueKey: string): number | undefined {
    const findLayoutResult = _.find(layouts, (layout) => {
        if (layout.i === uniqueKey) {
            return layout;
        }
    });
    return findLayoutResult ? findLayoutResult.y : undefined;
}

export function getDefaultPriorityByUniqueKey(uniqueKey: string): number {
    return STUDY_VIEW_CONFIG.priority[uniqueKey] === undefined ? 1 : STUDY_VIEW_CONFIG.priority[uniqueKey];
}

export function getPriorityByClinicalAttribute(clinicalAttribute: ClinicalAttribute): number {
    // If the priority is the default which means the priority has not been manually modified, then we should check
    // the whether there are priorities predefined
    const priorityFromDB = Number(clinicalAttribute.priority);
    if (priorityFromDB === STUDY_VIEW_CONFIG.defaultPriority) {
        const uniqueKey = getClinicalAttributeUniqueKey(clinicalAttribute);
        return STUDY_VIEW_CONFIG.priority[uniqueKey] === undefined ? STUDY_VIEW_CONFIG.defaultPriority : STUDY_VIEW_CONFIG.priority[uniqueKey];
    } else {
        return priorityFromDB
    }
}

// Grid includes 10px margin
export function getWidthByDimension(chartDimension: ChartDimension, borderWidth: number) {
    return STUDY_VIEW_CONFIG.layout.grid.w * chartDimension.w + (chartDimension.w - 1) * STUDY_VIEW_CONFIG.layout.gridMargin.x - borderWidth * 2;
}

// Grid includes 15px header and 35px tool section
export function getHeightByDimension(chartDimension: ChartDimension, chartHeight: number) {
    return STUDY_VIEW_CONFIG.layout.grid.h * chartDimension.h + (chartDimension.h - 1) * STUDY_VIEW_CONFIG.layout.gridMargin.y - chartHeight;
}

// 30px tool section
export function getTableHeightByDimension(chartDimension: ChartDimension, chartHeight: number) {
    return getHeightByDimension(chartDimension, chartHeight) - 30;
}

export function getQValue(qvalue: number):string {
    if (qvalue === 0) {
        return '0';
    } else {
        return qvalue.toExponential(EXPONENTIAL_FRACTION_DIGITS)
    }
}

export function pickClinicalAttrFixedColors(data: ClinicalDataCount[]): {[attribute: string]: string}
{
    return _.reduce(data, (acc: { [id: string]: string }, slice) => {
        // pick a fixed color if predefined
        const fixed = isNAClinicalValue(slice.value) ? DEFAULT_NA_COLOR : getClinicalValueColor(slice.value);

        if (fixed) {
            // update the map
            acc[slice.value] = fixed;
        }

        return acc;
    }, {});
}

export type ClinicalDataCountSummary = ClinicalDataCount & { color: string , percentage: number, freq: string}

export function getClinicalDataCountWithColorByClinicalDataCount(counts:ClinicalDataCount[]):ClinicalDataCountSummary[] {
    counts.sort(clinicalDataCountComparator);
    const colors = pickClinicalDataColors(counts);
    const sum = _.sumBy(counts, count => count.count);
    return counts.map(slice => {
        const percentage = slice.count / sum;
        return {
            ...slice,
            color: colors[slice.value],
            percentage: percentage,
            freq: getFrequencyStr(percentage * 100)
        };
    });
}

export function pickClinicalAttrColorsByIndex(data: ClinicalDataCount[],
                                              availableColors: string[]): {[attribute: string]: string}
{
    let colorIndex = 0;

    return _.reduce(data, (acc: { [id: string]: string }, slice) => {
        if (!isNAClinicalValue(slice.value) && !getClinicalValueColor(slice.value)) {
            acc[slice.value] = availableColors[colorIndex % availableColors.length];
            colorIndex++;
        }
        return acc;
    }, {});
}

export function calculateClinicalDataCountFrequency(data: ClinicalDataCountSet, numOfSelectedSamples: number): ClinicalDataCountSet {
    return _.reduce(data, (acc, next, key) => {
        acc[key] = next * 100 / numOfSelectedSamples;
        return acc;
    }, {} as { [attrId: string]: number });
}


export function getOptionsByChartMetaDataType(type: ChartMetaDataType, allCharts: { [id: string]: ChartMeta }, selectedAttrs: string[], allChartTypes:{[id:string]:ChartType}) {
    return _.filter(allCharts, chartMeta => chartMeta.dataType === type)
        .map(chartMeta => {
            return {
                label: chartMeta.displayName,
                key: chartMeta.uniqueKey,
                chartType: allChartTypes[chartMeta.uniqueKey],
                disabled: false,
                selected: selectedAttrs.includes(chartMeta.uniqueKey),
                freq: 100
            }
        });
}

export function pickClinicalDataColors(data: ClinicalDataCount[],
                                       colors: string[] = COLORS): {[attribute: string]: string}
{
    let availableColors = _.cloneDeep(colors);

    // pick colors for the fixed clinical attribute values first
    const fixedColors = pickClinicalAttrFixedColors(data);

    // remove the picked color from the available colors list,
    // so that we won't pick it again for the same chart
    availableColors = _.difference(availableColors, _.values(fixedColors));

    // then pick colors for the remaining attributes
    return {...pickClinicalAttrColorsByIndex(data, availableColors), ...fixedColors};
}

export function isNAClinicalValue(value:string) {
    return value.toLowerCase().trim() === 'na';
}

export function getFilteredSampleIdentifiers(samples:Sample[], isFiltered?:(sample:Sample)=>boolean){
    return _.reduce(samples, (acc, sample) => {
        if (isFiltered === undefined || isFiltered(sample)) {
            acc.push({
                sampleId: sample.sampleId,
                studyId: sample.studyId
            });
        }
        return acc;
    }, [] as SampleIdentifier[])
}

/**
 * Get filtered samples by excluding filters for the selected chart
 */
export function getSamplesByExcludingFiltersOnChart(
    chartKey: string,
    filter: StudyViewFilter,
    sampleIdentiferFilterSet: { [id: string]: SampleIdentifier[] },
    queriedSampleIdentifiers: SampleIdentifier[],
    queriedStudyIds: string[]): Promise<Sample[]> {

    //create filter without study/sample identifiers
    let updatedFilter: StudyViewFilter = {
        clinicalDataEqualityFilters: filter.clinicalDataEqualityFilters,
        clinicalDataIntervalFilters: filter.clinicalDataIntervalFilters,
        cnaGenes: filter.cnaGenes,
        mutatedGenes: filter.mutatedGenes
    } as any;

    let _sampleIdentifiers = _.reduce(sampleIdentiferFilterSet, (acc, sampleIdentifiers, key) => {
        //exclude chart filters
        if (chartKey !== key) {
            if (acc.length === 0) {
                acc = sampleIdentifiers;
            } else {
                acc = _.intersectionWith(acc, sampleIdentifiers, _.isEqual) as SampleIdentifier[];
            }
        }
        return acc
    }, [] as SampleIdentifier[]);

    if (_sampleIdentifiers && _sampleIdentifiers.length > 0) {
        updatedFilter.sampleIdentifiers = _sampleIdentifiers;
    } else {
        if (_.isEmpty(queriedSampleIdentifiers)) {
            updatedFilter.studyIds = queriedStudyIds;
        } else {
            updatedFilter.sampleIdentifiers = queriedSampleIdentifiers;
        }
    }
    return internalClient.fetchFilteredSamplesUsingPOST({
        studyViewFilter: updatedFilter
    });
}

export function getRequestedAwaitPromisesForClinicalData(isDefaultVisibleAttribute:boolean, isInitialFilterState: boolean, chartsAreFiltered: boolean, chartIsFiltered: boolean, unfilteredPromise: MobxPromise<any>, newlyAddedUnfilteredPromise: MobxPromise<any>, initialVisibleAttributesPromise: MobxPromise<any>): MobxPromise<any>[] {
    if (isInitialFilterState && isDefaultVisibleAttribute && !chartIsFiltered) {
        return [initialVisibleAttributesPromise];
    } else if (!isDefaultVisibleAttribute && !chartsAreFiltered) {
        return [newlyAddedUnfilteredPromise];
    } else if (chartIsFiltered) {
        // It will get a new Promise assigned in the invoke function
        return [];
    } else {
        return [unfilteredPromise];
    }
}

export function customBinsAreValid(newBins: string[]): boolean {
    if (newBins.length === 0) {
        return false;
    }
    return !_.some(newBins, bin => {
        return isNaN(Number(bin));
    });
}

export async function getHugoSymbolByEntrezGeneId(entrezGeneId: number): Promise<string> {
    const gene: Gene = await defaultClient.getGeneUsingGET({
        geneId: entrezGeneId.toString()
    });
    return gene.hugoGeneSymbol;
}

// returns true when there is only one virtual study and no physical studies
export function showOriginStudiesInSummaryDescription(physicalStudies: CancerStudy[], virtualStudies: VirtualStudy[]) {
    return physicalStudies.length === 0 && virtualStudies.length === 1;
}

export function getFilteredStudiesWithSamples(
    samples: Sample[],
    physicalStudies: CancerStudy[],
    virtualStudies: VirtualStudy[]) {

    let queriedStudiesWithSamples: StudyWithSamples[] = [];
    const selectedStudySampleSet = _.groupBy(samples, sample => sample.studyId);

    _.each(physicalStudies, study => {
        const samples = selectedStudySampleSet[study.studyId];
        if (samples && samples.length > 0) {
            queriedStudiesWithSamples.push({ ...study, uniqueSampleKeys: _.map(samples, sample => sample.uniqueSampleKey) });
        }
    })

    _.each(virtualStudies, virtualStudy => {
        let selectedSamples: Sample[] = []
        virtualStudy.data.studies.forEach(study => {
            let samples = selectedStudySampleSet[study.id];
            if (samples && samples.length > 0) {
                selectedSamples = selectedSamples.concat(samples);
            }
        })

        if (selectedSamples.length > 0) {
            let study = {
                name: virtualStudy.data.name,
                description: virtualStudy.data.description,
                studyId: virtualStudy.id,
            } as CancerStudy
            queriedStudiesWithSamples.push({ ...study, uniqueSampleKeys: _.map(selectedSamples, sample => sample.uniqueSampleKey) });
        }
    });
    return queriedStudiesWithSamples;
}

export function clinicalDataCountComparator(a: ClinicalDataCount, b: ClinicalDataCount): number
{
    if (isNAClinicalValue(a.value)) {
        return isNAClinicalValue(b.value) ? 0 : 1;
    }
    else if (isNAClinicalValue(b.value)) {
        return -1;
    }
    else {
        return b.count - a.count;
    }
}

type ClinicalAttributeSorting = {
    priority: number,
    displayName: string
}

export function clinicalAttributeSortingComparator(a: ClinicalAttributeSorting, b: ClinicalAttributeSorting): number {
    return b.priority - a.priority || a.displayName.localeCompare(b.displayName);
}

export function clinicalAttributeComparator(a: ClinicalAttribute, b: ClinicalAttribute): number {
    return clinicalAttributeSortingComparator({
        priority: Number(a.priority),
        displayName: a.displayName
    }, {
        priority: Number(b.priority),
        displayName: b.displayName
    });
}

// Descent sort priority then ascent sort by display name
export function chartMetaComparator(a: ChartMeta, b: ChartMeta): number {
    return clinicalAttributeSortingComparator({
        priority: a.priority,
        displayName: a.displayName
    }, {
        priority: b.priority,
        displayName: b.displayName
    });
}


export function submitToPage(url:string, params: { [id: string]: string }, target?: string) {
    try {
        window.localStorage.setItem("legacyStudySubmission", JSON.stringify(params))
        window.open(buildCBioPortalPageUrl(url), target);
    } catch (e) {
        // try clearing localStorage
        window.localStorage.clear();
        try {
            window.localStorage.setItem("legacyStudySubmission", JSON.stringify(params));
            window.open(buildCBioPortalPageUrl(url), target);
        } catch (e) {
            // TODO - currenlty alerting user with message until we have a proper solution
            alert('Sorry, the query is too large to submit');
        }
    }
}

export function getClinicalEqualityFilterValuesByString(filterValues: string):string[] {
    return filterValues.replace(/\\,/g,'$@$').split(",").map(val=>val.trim().replace(/\$@\$/g,','));
}

export function getClinicalDataCountWithColorByCategoryCounts(yesCount:number, noCount: number):ClinicalDataCountSummary[] {

    let dataCountSet: { [id: string]: ClinicalDataCount } = {};
    if (yesCount > 0) {
        dataCountSet[Datalabel.YES] = {
            'count': yesCount,
            'value': Datalabel.YES
        }
    }
    if (noCount > 0) {
        dataCountSet[Datalabel.NO] = {
            'count': noCount,
            'value': Datalabel.NO
        }
    }
    return getClinicalDataCountWithColorByClinicalDataCount(_.values(dataCountSet));
}

export function getStudyViewTabId(pathname:string) {
    const match = pathname.match(/study\/([^\/]+)/);
    if (match) {
        return match[1] as StudyViewPageTabKeyEnum;
    } else {
        return undefined;
    }
}

export function getSelectedGroupNames(
    groups:Pick<StudyViewComparisonGroup, "name">[]
) {
    if (groups.length <= 2) {
        return groups.map(group=>group.name).join(" and ");
    } else {
        return `${groups[0].name} and ${groups.length-1} other groups`;
    }
}

export function getPatientIdentifiers(
    groups:Pick<StudyViewComparisonGroup, "studies">[]
) {
    return _.uniqWith(
        _.flattenDeep<PatientIdentifier>(
            groups.map(group=>group.studies.map(study=>{
                const studyId = study.id;
                return study.patients.map(patientId=>({ studyId, patientId }));
            }))
        ),
        (id1, id2)=>((id1.patientId === id2.patientId) && (id1.studyId === id2.studyId))
    );
}

export function isSpecialChart(chartMeta: ChartMeta) {
    return SPECIAL_CHARTS.findIndex(
        cm => cm.uniqueKey === chartMeta.uniqueKey
    ) > -1;
}


export function getChartSettingsMap(visibleAttributes: ChartMeta[],
    columns: number,
    chartDimensionSet: { [uniqueId: string]: ChartDimension },
    chartTypeSet: { [uniqueId: string]: ChartType },
    customChartSet: { [uniqueId: string]: CustomChart },
    clinicalDataBinFilter: { [uniqueId: string]: ClinicalDataBinFilter },
    filterMutatedGenesTableByCancerGenes: boolean = true,
    filterFusionGenesTableByCancerGenes: boolean = true,
    filterCNAGenesTableByCancerGenes: boolean = true,
    gridLayout?: ReactGridLayout.Layout[]) {

    if (!gridLayout) {
        gridLayout = calculateLayout(visibleAttributes, columns, chartDimensionSet, []);
    }

    let chartSettingsMap: { [chartId: string]: ChartUserSetting } = {};
    visibleAttributes.forEach(attribute => {
        const id = attribute.uniqueKey
        const chartType = chartTypeSet[id] || 'NONE';
        chartSettingsMap[attribute.uniqueKey] = {
            id: attribute.uniqueKey,
            chartType,
            patientAttribute: attribute.patientAttribute // add chart attribute type
        }
        if (chartType === UniqueKey.MUTATED_GENES_TABLE) {
            chartSettingsMap[attribute.uniqueKey].filterByCancerGenes = filterMutatedGenesTableByCancerGenes;
        } else if (chartType === UniqueKey.FUSION_GENES_TABLE) {
            chartSettingsMap[attribute.uniqueKey].filterByCancerGenes = filterFusionGenesTableByCancerGenes;
        } else if (chartType === UniqueKey.CNA_GENES_TABLE) {
            chartSettingsMap[attribute.uniqueKey].filterByCancerGenes = filterCNAGenesTableByCancerGenes;
        }
        const customChart = customChartSet[id];
        if (customChart) { // if its custom chart add groups and name
            chartSettingsMap[id].groups = customChart.groups;
            chartSettingsMap[id].name = attribute.displayName;
        }
        if (clinicalDataBinFilter[id]) {
            if (clinicalDataBinFilter[id].disableLogScale) {
                chartSettingsMap[id].disableLogScale = true;
            }
            if (!_.isEmpty(clinicalDataBinFilter[id].customBins)) {
                chartSettingsMap[id].customBins = clinicalDataBinFilter[id].customBins;
            }
        }
    });
    // add layout for each chart
    gridLayout.forEach(layout => {
        if (layout.i && chartSettingsMap[layout.i]) {
            chartSettingsMap[layout.i].layout = {
                x: layout.x,
                y: layout.y,
                w: layout.w,
                h: layout.h
            };
        }
    });
    return chartSettingsMap;
}

export function getBinName(dataBin: Pick<DataBin, "specialValue"|"start"|"end">) {
    // specialValue can be any non-numeric character. ex: "=<", ">", "NA"
    if (dataBin.specialValue !== undefined) {
        if (dataBin.start !== undefined) {
            return dataBin.specialValue + dataBin.start;
        }
        if (dataBin.end !== undefined) {
            return dataBin.specialValue + dataBin.end;
        }
        return dataBin.specialValue;
    }
    if (dataBin.start !== undefined && dataBin.end !== undefined) {
        return `${dataBin.start}-${dataBin.end}`;
    }
    return ''
}

export function getGroupedClinicalDataByBins(data: ClinicalData[], dataBins: DataBin[]) {
    const numericDataBins = dataBins.filter(dataBin => dataBin.specialValue === undefined);
    const specialDataBins = dataBins.filter(dataBin => dataBin.specialValue !== undefined);
    return _.reduce(data, (acc, datum) => {
        let dataBin: DataBin | undefined;
        // Check if the ClinicalData value is number
        if (!isNaN(datum.value as any)) {
            //find if it belongs to any of numeric bins. 
            dataBin = _.find(numericDataBins, dataBin => parseFloat(datum.value) > dataBin.start && parseFloat(datum.value) <= dataBin.end);
        }

        //If ClinicalData value is not a number of does not belong to any number bins
        if (dataBin === undefined) {
            //find if it belongs to any of sepcial bins. 
            dataBin = _.find(specialDataBins, dataBin => {
                if (!isNaN(datum.value as any)) {
                    if (dataBin.end !== undefined) {
                        return parseFloat(datum.value) <= dataBin.end;
                    }
                    else if (dataBin.start !== undefined) {
                        return parseFloat(datum.value) > dataBin.start;
                    }
                }
                return dataBin.specialValue === datum.value;
            });
        }
        if (dataBin) {
            let name = getBinName(dataBin);
            if (acc[name] === undefined) {
                acc[name] = [];
            }
            acc[name].push(datum);
        }
        return acc;
    }, {} as {
        [id: string]: ClinicalData[];
    });
}

export function getGroupsFromBins(samples: Sample[], patientAttribute: boolean, data: ClinicalData[], dataBins: DataBin[], origin: string[]) {

    let patientToSamples: { [uniquePatientKey: string]: SampleIdentifier[] } = {};
    if (patientAttribute) {
        patientToSamples = _.groupBy(samples, s => s.uniquePatientKey);
    }

    const clinicalDataByBins = getGroupedClinicalDataByBins(data, dataBins);
    const binsOrder = dataBins.map(dataBin=>getBinName(dataBin))
    const binsOrderSet = stringListToIndexSet(binsOrder)

    return _.reduce(clinicalDataByBins, (acc, clinicalData, name) => {
        if (clinicalData.length !== 0) {
            let sampleIdentifiers: SampleIdentifier[] = []

            if (patientAttribute) {
                sampleIdentifiers = _.flatMapDeep(clinicalData, (d: ClinicalData) => {
                    return patientToSamples[d.uniquePatientKey].map(s => ({ studyId: s.studyId, sampleId: s.sampleId }));
                });
            } else {
                sampleIdentifiers = clinicalData.map(d => ({ studyId: d.studyId, sampleId: d.sampleId }));
            }

            acc.push(getGroupParameters(
                name,
                sampleIdentifiers,
                origin
            ))
        }
        return acc;
    }, [] as SessionGroupData[]).sort((a, b) => binsOrderSet[a.name] - binsOrderSet[b.name]);
}

export function getGroupsFromQuartiles(samples: Sample[], patientAttribute: boolean, quartiles: ClinicalData[][], origin: string[]) {

    let patientToSamples: {
        [uniquePatientKey: string]: SampleIdentifier[];
    } = {};
    if (patientAttribute) {
        patientToSamples = _.groupBy(samples, s => s.uniquePatientKey);
    }
    // create groups using data
    return quartiles.map(quartile => {

        let sampleIdentifiers: SampleIdentifier[] = []
        if (patientAttribute) {
            sampleIdentifiers = _.flatMapDeep(quartile, (d: ClinicalData) => {
                return patientToSamples[d.uniquePatientKey].map(s => ({ studyId: s.studyId, sampleId: s.sampleId }));
            });
        }
        else {
            sampleIdentifiers = quartile.map(d => ({ studyId: d.studyId, sampleId: d.sampleId }));
        }
        
        return getGroupParameters(
            `${quartile[0].value}-${quartile[quartile.length - 1].value}`,
            sampleIdentifiers,
            origin
        );
    });
}