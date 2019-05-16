import * as React from 'react';
import { AlterationEnrichment, ExpressionEnrichment } from "shared/api/generated/CBioPortalAPIInternal";
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import { ExpressionEnrichmentRow } from 'shared/model/ExpressionEnrichmentRow';
import { tsvFormat } from 'd3-dsv';
import { BoxPlotModel, calculateBoxPlotModel } from 'shared/lib/boxPlotUtils';
import {MolecularProfile, NumericGeneMolecularData} from 'shared/api/generated/CBioPortalAPI';
import seedrandom from 'seedrandom';
import { roundLogRatio, formatLogOddsRatio } from 'shared/lib/FormatUtils';
import * as _ from "lodash";
import {AlterationTypeConstants} from "../ResultsViewPageStore";
import {filterAndSortProfiles} from "../coExpression/CoExpressionTabUtils";
import {IMiniFrequencyScatterChartData} from "./MiniFrequencyScatterChart";
import EllipsisTextTooltip from "../../../shared/components/ellipsisTextTooltip/EllipsisTextTooltip";
import { AlterationEnrichmentTableColumn, AlterationEnrichmentTableColumnType } from './AlterationEnrichmentsTable';
import styles from "./styles.module.scss";
import classNames from "classnames";

export type AlterationEnrichmentWithQ = AlterationEnrichment & { logRatio?:number, qValue:number, value?:number /* used for copy number in group comparison */ };
export type ExpressionEnrichmentWithQ = ExpressionEnrichment & { qValue:number };

export function PERCENTAGE_IN_headerRender(name:string) {
    return (
        <div style={{display:"flex", alignItems:"center"}}>
           <EllipsisTextTooltip text={name} shownWidth={100} hideTooltip={true}/>
        </div>
    );
}

export function STAT_IN_headerRender(stat:string, name:string) {
    return (
        <div style={{display:"flex", alignItems:"center"}}>
            {stat}&nbsp;in&nbsp;<EllipsisTextTooltip text={name} shownWidth={100} hideTooltip={true}/>
        </div>
    );
}

export function calculateAlterationTendency(logOddsRatio: number): string {
    return logOddsRatio > 0 ? "Co-occurrence" : "Mutual exclusivity";
}

export function calculateExpressionTendency(logOddsRatio: number): string {
    return logOddsRatio > 0 ? "Over-expressed" : "Under-expressed";
}

export function calculateGenericTendency(
    logOddsRatio:number, group1Name:string, group2Name:string
) {
    return <EllipsisTextTooltip style={{display:"inline-block"}} text={logOddsRatio > 0 ? group1Name: group2Name} shownWidth={100}/>;
}

export function formatPercentage(group: string, data: AlterationEnrichmentRow): string {

    const datum = data.groupsSet[group]
    return datum.alteredCount + " (" + datum.alteredPercentage.toFixed(2) + "%)";
}

export function getAlteredCount(group: string, data: AlterationEnrichmentRow): number {
    return data.groupsSet[group].alteredCount
}

function volcanoPlotYCoord(pValue:number) {
    if (pValue === 0 || Math.log10(pValue) < -10) {
        return 10;
    } else {
        return -Math.log10(pValue);
    }
}

export function getAlterationScatterData(alterationEnrichments: AlterationEnrichmentRow[], queryGenes: string[]): any[] {

    return alterationEnrichments.filter(a => !queryGenes.includes(a.hugoGeneSymbol)).map((alterationEnrichment) => {
        return {
            x: roundLogRatio(Number(alterationEnrichment.logRatio), 10),
            y: volcanoPlotYCoord(alterationEnrichment.pValue),
            hugoGeneSymbol: alterationEnrichment.hugoGeneSymbol,
            pValue: alterationEnrichment.pValue,
            qValue: alterationEnrichment.qValue,
            logRatio: alterationEnrichment.logRatio,
            hovered: false
        };
    });
}

export function getAlterationFrequencyScatterData(alterationEnrichments: AlterationEnrichmentRow[], queryGenes: string[], group1:string, group2:string): IMiniFrequencyScatterChartData[] {
    return alterationEnrichments.filter(a => !queryGenes.includes(a.hugoGeneSymbol)).map((alterationEnrichment) => {
        return {
            x: alterationEnrichment.groupsSet[group1].alteredPercentage,
            y: alterationEnrichment.groupsSet[group2].alteredPercentage,
            hugoGeneSymbol: alterationEnrichment.hugoGeneSymbol,
            pValue: alterationEnrichment.pValue,
            qValue: alterationEnrichment.qValue,
            logRatio: alterationEnrichment.logRatio!
        };
    });
}

export function getExpressionScatterData(expressionEnrichments: ExpressionEnrichmentRow[], queryGenes: string[]): any[] {
    return expressionEnrichments.filter(a => !queryGenes.includes(a.hugoGeneSymbol)).map((expressionEnrichment) => {
        return {
            x: expressionEnrichment.logRatio,
            y: volcanoPlotYCoord(expressionEnrichment.pValue),
            hugoGeneSymbol: expressionEnrichment.hugoGeneSymbol,
            entrezGeneId: expressionEnrichment.entrezGeneId,
            pValue: expressionEnrichment.pValue,
            qValue: expressionEnrichment.qValue,
            logRatio: expressionEnrichment.logRatio,
            hovered: false
        };
    });
}

export function getAlterationRowData(
    alterationEnrichments: AlterationEnrichmentWithQ[],
    queryGenes: string[],
    calculateLogRatio: boolean,
    group1Name: string,
    group2Name: string): AlterationEnrichmentRow[] {
    return alterationEnrichments.map(alterationEnrichment => {
        let groupsSetWithPercentages = _.mapValues(_.keyBy(alterationEnrichment.counts, count => count.name), datum => {
            return {
                ...datum,
                alteredPercentage: (datum.alteredCount / datum.profiledCount)*100
            }
        });
        let logRatio: number | undefined = undefined;
        if (calculateLogRatio) {
            let group1Data = groupsSetWithPercentages[group1Name];
            let group2Data = groupsSetWithPercentages[group2Name];
            logRatio = Math.log2(group1Data.alteredPercentage / group2Data.alteredPercentage);
        }
        return {
            checked: queryGenes.includes(alterationEnrichment.hugoGeneSymbol),
            disabled: queryGenes.includes(alterationEnrichment.hugoGeneSymbol),
            hugoGeneSymbol: alterationEnrichment.hugoGeneSymbol,
            entrezGeneId: alterationEnrichment.entrezGeneId,
            cytoband: alterationEnrichment.cytoband,
            pValue: alterationEnrichment.pValue,
            qValue: alterationEnrichment.qValue,
            value: alterationEnrichment.value,
            groupsSet: groupsSetWithPercentages,
            logRatio
        };
    });
}

export function getExpressionRowData(expressionEnrichments: ExpressionEnrichmentWithQ[], queryGenes: string[]):
    ExpressionEnrichmentRow[] {

    return expressionEnrichments.map(expressionEnrichment => {
        return {
            checked: queryGenes.includes(expressionEnrichment.hugoGeneSymbol),
            disabled: queryGenes.includes(expressionEnrichment.hugoGeneSymbol),
            hugoGeneSymbol: expressionEnrichment.hugoGeneSymbol,
            entrezGeneId: expressionEnrichment.entrezGeneId,
            cytoband: expressionEnrichment.cytoband,
            meanExpressionInAlteredGroup: expressionEnrichment.meanExpressionInAlteredGroup,
            meanExpressionInUnalteredGroup: expressionEnrichment.meanExpressionInUnalteredGroup,
            standardDeviationInAlteredGroup: expressionEnrichment.standardDeviationInAlteredGroup,
            standardDeviationInUnalteredGroup: expressionEnrichment.standardDeviationInUnalteredGroup,
            logRatio: expressionEnrichment.meanExpressionInAlteredGroup - expressionEnrichment.meanExpressionInUnalteredGroup,
            pValue: expressionEnrichment.pValue,
            qValue: expressionEnrichment.qValue
        };
    });
}

export function getFilteredData(data: Pick<ExpressionEnrichmentRow, "logRatio" | "qValue" | "hugoGeneSymbol">[], negativeLogFilter: boolean, positiveLogFilter: boolean, qValueFilter: boolean,
    selectedGenes: string[]|null): any[] {

    return data.filter(alterationEnrichment => {
        let result = false;
        if (negativeLogFilter) {
            result = result || alterationEnrichment.logRatio <= 0;
        }
        if (positiveLogFilter) {
            result = result || alterationEnrichment.logRatio > 0;
        }
        if (qValueFilter) {
            result = result && alterationEnrichment.qValue < 0.05;
        }
        if (selectedGenes) {
            result = result && selectedGenes.includes(alterationEnrichment.hugoGeneSymbol);
        }
        return result;
    });
}

export function getFilteredDataByGroups(data: AlterationEnrichmentRow[], enrichedGroups: string[], qValueFilter: boolean,
    selectedGenes: string[] | null): any[] {

    return data.filter(alterationEnrichment => {
        let result = false;
        for (var i = 0; i < enrichedGroups.length; i++) {
            const enrichedGroup = enrichedGroups[i];
            let enrichedGroupAlteredPercentage = alterationEnrichment.groupsSet[enrichedGroup].alteredPercentage;
            let res = _.reduce(alterationEnrichment.groupsSet, (acc, next, group) => {
                if (enrichedGroup !== group) {
                    acc = acc && (enrichedGroupAlteredPercentage >= next.alteredPercentage);
                }
                return acc;
            }, true)
            if (res) {
                result = res;
                break;
            }
        }
        if (qValueFilter) {
            result = result && alterationEnrichment.qValue < 0.05;
        }
        if (selectedGenes) {
            result = result && selectedGenes.includes(alterationEnrichment.hugoGeneSymbol);
        }
        return result;
    });
}

export function getBarChartTooltipContent(tooltipModel: any, selectedGene: string): string {

    let tooltipContent = "";

    if(tooltipModel != null) {
        const datum = tooltipModel.datum;
        tooltipContent += "Query Genes ";
        if (datum.x == 2) {
            if (datum.index == 0) {
                tooltipContent += "Altered: ";
            } else {
                tooltipContent += "Unaltered: ";
            }
        } else {
            if (datum.index == 0) {
                tooltipContent += "Altered, " + selectedGene + " Unaltered: ";
            } else if (datum.index == 1) {
                tooltipContent += "Altered, " + selectedGene + " Altered: ";
            } else if (datum.index == 2) {
                tooltipContent += "Unaltered, " + selectedGene + " Altered: ";
            } else if (datum.index == 3) {
                tooltipContent += "Unaltered, " + selectedGene + " Unaltered: ";
            }
        }

        tooltipContent += datum.y;
    }
    return tooltipContent;
}

export function getDownloadContent(scatterData: any[], hugoGeneSymbol: string, profileName: string): string {

    const downloadData: any[] = [];
    scatterData.map((datum, index) => {
        const profileTitle = hugoGeneSymbol + ", " + profileName;
        downloadData.push({
            "Sample ID": datum.sampleId, 
            [profileTitle]: datum.y,
            "Alteration": datum.alterations
        });
    });
    return tsvFormat(downloadData);
}

export function getAlterationsTooltipContent(alterations: any[]): string {
        
    let result: string = "";
    let currentGene: string;
    alterations.forEach(a => {
        const hugoGeneSymbol = a.gene.hugoGeneSymbol;
        if (hugoGeneSymbol != currentGene) {
            result += hugoGeneSymbol + ": ";
        }
        if (a.alterationType === "MUTATION_EXTENDED") {
            result += "MUT";
        } else if (a.alterationType === "PROTEIN_LEVEL") {
            result += "RPPA-" + a.alterationSubType.toUpperCase();
        } else {
            result += a.alterationSubType.toUpperCase();
        }
        result += "; "
        currentGene = hugoGeneSymbol;
    });

    return result;
}

export function shortenGenesLabel(genes: string[], limit: number): string {

    if (genes.length > limit) {
        return genes.slice(0, limit).join(" ") + "…";
    } else {
        return genes.join(" ");
    }
}

export function getBoxPlotModels(scatterData: any[]): BoxPlotModel[] {

    const alteredBoxPlotData = calculateBoxPlotModel(scatterData.filter(s => s.x < 1.5).map(s => s.y));
    alteredBoxPlotData.x = 1;
    alteredBoxPlotData.min = alteredBoxPlotData.whiskerLower;
    alteredBoxPlotData.max = alteredBoxPlotData.whiskerUpper;
    const unalteredBoxPlotData = calculateBoxPlotModel(scatterData.filter(s => s.x > 1.5).map(s => s.y));
    unalteredBoxPlotData.x = 2;
    unalteredBoxPlotData.min = unalteredBoxPlotData.whiskerLower;
    unalteredBoxPlotData.max = unalteredBoxPlotData.whiskerUpper;
    return [alteredBoxPlotData, unalteredBoxPlotData];
}

export function getBoxPlotScatterData(molecularData: NumericGeneMolecularData[], molecularProfileId: string, 
    sampleAlterations: any, alteredSampleKeys: string[]): any[] {

    const scatterData: any[] = [];
    for (let uniqueSampleKey in sampleAlterations) {
        const alterations = sampleAlterations[uniqueSampleKey];
        const data: NumericGeneMolecularData | undefined = molecularData.find(m => m.uniqueSampleKey === uniqueSampleKey);
        if (data) {
            const y = molecularProfileId.includes("rna_seq") ? Math.log(data.value + 1) / Math.log(2) : data.value;
            const random = (seedrandom(y.toString())() - 0.5) * 0.5;
            scatterData.push({
                x: alteredSampleKeys.includes(uniqueSampleKey) ? 1 + random : 2 + random,
                y: y,
                sampleId: data.sampleId,
                studyId: data.studyId,
                alterations: getAlterationsTooltipContent(alterations)
            });
        }
    }
    return scatterData;
}

export function pickMutationEnrichmentProfiles(profiles:MolecularProfile[]) {
    return _.filter(profiles, (profile: MolecularProfile) =>
        profile.molecularAlterationType === AlterationTypeConstants.MUTATION_EXTENDED);
}

export function pickCopyNumberEnrichmentProfiles(profiles:MolecularProfile[]) {
    return _.filter(profiles, (profile: MolecularProfile) =>
        profile.molecularAlterationType === AlterationTypeConstants.COPY_NUMBER_ALTERATION && profile.datatype === "DISCRETE");
}

export function pickMRNAEnrichmentProfiles(profiles:MolecularProfile[]) {
    const mrnaProfiles = profiles.filter(p=>{
        return p.molecularAlterationType === AlterationTypeConstants.MRNA_EXPRESSION
    });
    return filterAndSortProfiles(mrnaProfiles);
}

export function pickProteinEnrichmentProfiles(profiles:MolecularProfile[]) {
    const protProfiles = profiles.filter(p=>{
        return p.molecularAlterationType === AlterationTypeConstants.PROTEIN_LEVEL;
    });
    return filterAndSortProfiles(protProfiles);
}

export function getGroupColumns(groups: { name: string, description: string }[], alteredVsUnalteredMode?: boolean): AlterationEnrichmentTableColumn[] {
    let columns: AlterationEnrichmentTableColumn[] = [];

    if (groups.length === 2) {
        let group1 = groups[0];
        let group2 = groups[1];
        columns.push({
            name: AlterationEnrichmentTableColumnType.LOG_RATIO,
            render: (d: AlterationEnrichmentRow) => <span>{formatLogOddsRatio(d.logRatio!)}</span>,
            tooltip: <span>Log2 based ratio of (pct in {group1.name}/ pct in {group2.name})</span>,
            sortBy: (d: AlterationEnrichmentRow) => Number(d.logRatio),
            download: (d: AlterationEnrichmentRow) => formatLogOddsRatio(d.logRatio!)
        });
        columns.push({
            name: alteredVsUnalteredMode ? AlterationEnrichmentTableColumnType.TENDENCY : AlterationEnrichmentTableColumnType.ENRICHED,
            render: (d: AlterationEnrichmentRow) => <div className={classNames(styles.Tendency, { [styles.Significant]: (d.qValue < 0.05) })}>
                {alteredVsUnalteredMode ? calculateAlterationTendency(Number(d.logRatio)) : calculateGenericTendency(Number(d.logRatio), group1.name, group2.name)}
            </div>,
            tooltip:
                <table>
                    <tr>
                        <td>Log ratio > 0</td>
                        <td>: Enriched in {group1.name}</td>
                    </tr>
                    <tr>
                        <td>Log ratio &lt;= 0</td>
                        <td>: Enriched in {group2.name}</td>
                    </tr>
                    <tr>
                        <td>q-Value &lt; 0.05</td>
                        <td>: Significant association</td>
                    </tr>
                </table>,
            filter: (d: AlterationEnrichmentRow, filterString: string, filterStringUpper: string) =>
                calculateAlterationTendency(Number(d.logRatio)).toUpperCase().includes(filterStringUpper),
            sortBy: (d: AlterationEnrichmentRow) => calculateAlterationTendency(Number(d.logRatio)),
            download: (d: AlterationEnrichmentRow) => calculateAlterationTendency(Number(d.logRatio))
        });
    }
    groups.forEach(group=>{
        columns.push({
            name: group.name,
            headerRender: PERCENTAGE_IN_headerRender,
            render: (d: AlterationEnrichmentRow) => <span>{formatPercentage(group.name, d)}</span>,
            tooltip: <span><strong>{group.name}:</strong> {group.description}</span>,
            sortBy: (d: AlterationEnrichmentRow) => getAlteredCount(group.name, d),
            download: (d: AlterationEnrichmentRow) => formatPercentage(group.name, d)
        });
    });
    return columns;
}