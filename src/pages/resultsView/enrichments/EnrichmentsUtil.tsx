import * as React from 'react';
import { AlterationEnrichment, ExpressionEnrichment } from "shared/api/generated/CBioPortalAPIInternal";
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import { ExpressionEnrichmentRow } from 'shared/model/ExpressionEnrichmentRow';
import { tsvFormat } from 'd3-dsv';
import { BoxPlotModel, calculateBoxPlotModel } from 'shared/lib/boxPlotUtils';
import { NumericGeneMolecularData } from 'shared/api/generated/CBioPortalAPI';
import seedrandom from 'seedrandom';
import { roundLogRatio } from 'shared/lib/FormatUtils';

const LOG_VALUE = "LOG-VALUE";
const LOG2_VALUE = "LOG2-VALUE";

export function calculateAlterationTendency(logOddsRatio: number): string {
    return logOddsRatio > 0 ? "Co-occurrence" : "Mutual exclusivity";
}

export function calculateExpressionTendency(logOddsRatio: number): string {
    return logOddsRatio > 0 ? "Over-expressed" : "Under-expressed";
}

export function formatPercentage(count: number, percentage: number): string {

    return count + " (" + percentage.toFixed(2) + "%)";
}

export function getAlterationScatterData(alterationEnrichments: AlterationEnrichmentRow[], queryGenes: string[]): any[] {

    return alterationEnrichments.filter(a => !queryGenes.includes(a.hugoGeneSymbol)).map((alterationEnrichment) => {
        return {
            x: roundLogRatio(Number(alterationEnrichment.logRatio), 10), y: -Math.log10(alterationEnrichment.pValue),
            hugoGeneSymbol: alterationEnrichment.hugoGeneSymbol,
            pValue: alterationEnrichment.pValue,
            qValue: alterationEnrichment.qValue,
            logRatio: alterationEnrichment.logRatio,
            hovered: false
        };
    });
}

export function getExpressionScatterData(expressionEnrichments: ExpressionEnrichmentRow[], queryGenes: string[]): any[] {

    return expressionEnrichments.filter(a => !queryGenes.includes(a.hugoGeneSymbol)).map((expressionEnrichment) => {
        return {
            x: expressionEnrichment.logRatio,
            y: -Math.log10(expressionEnrichment.pValue), 
            hugoGeneSymbol: expressionEnrichment.hugoGeneSymbol,
            entrezGeneId: expressionEnrichment.entrezGeneId,
            pValue: expressionEnrichment.pValue,
            qValue: expressionEnrichment.qValue,
            logRatio: expressionEnrichment.logRatio,
            hovered: false
        };
    });
}

export function getAlterationRowData(alterationEnrichments: AlterationEnrichment[], totalAltered: number,
    totalUnaltered: number, queryGenes: string[]): AlterationEnrichmentRow[] {

    return alterationEnrichments.map(alterationEnrichment => {
        return {
            checked: queryGenes.includes(alterationEnrichment.hugoGeneSymbol),
            disabled: queryGenes.includes(alterationEnrichment.hugoGeneSymbol),
            hugoGeneSymbol: alterationEnrichment.hugoGeneSymbol,
            entrezGeneId: alterationEnrichment.entrezGeneId,
            cytoband: alterationEnrichment.cytoband, 
            alteredCount: alterationEnrichment.alteredCount,
            alteredPercentage: alterationEnrichment.alteredCount / totalAltered * 100,
            unalteredCount: alterationEnrichment.unalteredCount,
            unalteredPercentage: alterationEnrichment.unalteredCount / totalUnaltered * 100,
            logRatio: Number(alterationEnrichment.logRatio), 
            pValue: alterationEnrichment.pValue,
            qValue: alterationEnrichment.qValue
        };
    });
}

export function getExpressionRowData(expressionEnrichments: ExpressionEnrichment[], queryGenes: string[]):
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

export function getFilteredData(data: any[], negativeLogFilter: boolean, positiveLogFilter: boolean, qValueFilter: boolean, 
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
