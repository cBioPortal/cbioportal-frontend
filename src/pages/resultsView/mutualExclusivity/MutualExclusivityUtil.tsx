import * as React from 'react';
import { getCumulativePValue } from "../../../shared/lib/FisherExactTestCalculator";
import { MutualExclusivity } from "../../../shared/model/MutualExclusivity";
import Combinatorics from 'js-combinatorics';
import Dictionary = _.Dictionary;

export function calculateAssociation(logOddsRatio: number): string {
    return logOddsRatio > 0 ? "Co-occurrence" : "Mutual exclusivity";
}

export function countOccurences(valuesA: boolean[], valuesB: boolean[]): [number, number, number, number] {

    let neither = 0;
    let bNotA = 0;
    let aNotB = 0;
    let both = 0;

    valuesA.forEach((valueA, index) => {

        const valueB = valuesB[index];
        if (!valueA && !valueB) {
            neither++;
        } else if (!valueA && valueB) {
            bNotA++;
        } else if (valueA && !valueB) {
            aNotB++;
        } else {
            both++;
        }
    });
    return [neither, bNotA, aNotB, both];
}

export function calculatePValue(a: number, b: number, c: number, d: number): number {
    return getCumulativePValue(a, b, c, d);
}

export function calculateAdjustedPValue(pValue: number, count: number): number {
    let value = pValue * count;
    return value > 1 ? 1 : value;
}

export function calculateLogOddsRatio(a: number, b: number, c: number, d: number): number {

    if ((a * d) === 0 && (b * c) === 0) {
        return Infinity;
    }
    return Math.log((a * d) / (b * c));
}

export function getMutuallyExclusiveCounts(data: MutualExclusivity[],
    exclusive: (n: number) => boolean): [JSX.Element | null, JSX.Element | null] {

    let exclusiveCount = null;
    let significantCount = null;

    const exclusiveData = data.filter(mutualExclusivity => exclusive(mutualExclusivity.logOddsRatio));
    const significantData = exclusiveData.filter(mutualExclusivity => mutualExclusivity.pValue < 0.05);

    const exclusiveLength = exclusiveData.length;
    const significantLength = significantData.length;
    if (exclusiveLength === 0) {
        exclusiveCount = <span><b>no</b> gene pair</span>;
    } else if (exclusiveLength === 1) {
        exclusiveCount = <span><b>1</b> gene pair</span>;
    } else {
        exclusiveCount = <span><b>{exclusiveLength}</b> gene pairs</span>;
    }

    if (exclusiveLength > 0) {
        if (significantLength === 0) {
            significantCount = <span> (none significant)</span>;
        } else {
            significantCount = <span> (<b>{significantLength}</b> significant)</span>;
        }
    }

    return [exclusiveCount, significantCount];
}

export function getCountsText(data: MutualExclusivity[]): JSX.Element {

    const mutuallyExclusiveCounts = getMutuallyExclusiveCounts(data, n => n <= 0);
    const coOccurentCounts = getMutuallyExclusiveCounts(data, n => n > 0);

    return <p>The query contains {mutuallyExclusiveCounts[0]} with mutually exclusive alterations{
        mutuallyExclusiveCounts[1]}, and {coOccurentCounts[0]} with co-occurrent alterations{
            coOccurentCounts[1]}.</p>;
}

export function getData(isSampleAlteredMap: Dictionary<boolean[]>): MutualExclusivity[] {

    let data: MutualExclusivity[] = [];
    const combinations: string[][] = (Combinatorics as any).bigCombination(Object.keys(isSampleAlteredMap), 2).toArray();

    combinations.forEach(combination => {

        const geneA = combination[0];
        const geneB = combination[1];
        const counts = countOccurences(isSampleAlteredMap[geneA], isSampleAlteredMap[geneB]);
        const pValue = calculatePValue(counts[0], counts[1], counts[2], counts[3]);
        const logOddsRatio = calculateLogOddsRatio(counts[0], counts[1], counts[2], counts[3]);
        const association = calculateAssociation(logOddsRatio);
        data.push({ geneA, geneB, neitherCount: counts[0], bNotACount: counts[1], aNotBCount: counts[2], 
            bothCount: counts[3], logOddsRatio, pValue, 
            adjustedPValue: calculateAdjustedPValue(pValue, combinations.length), association });
    });
    return data;
}

export function getFilteredData(data: MutualExclusivity[], mutualExclusivityFilter: boolean, coOccurenceFilter: boolean,
    significantPairsFilter: boolean): MutualExclusivity[] {

    return data.filter(mutualExclusivity => {
        let result = false;
        if (mutualExclusivityFilter) {
            result = result || mutualExclusivity.logOddsRatio <= 0;
        }
        if (coOccurenceFilter) {
            result = result || mutualExclusivity.logOddsRatio > 0;
        }
        if (significantPairsFilter) {
            result = result && mutualExclusivity.pValue < 0.05;
        }
        return result;
    });
}

export function formatPValue(pValue: number): string {
    return pValue < 0.001 ? "<0.001" : pValue.toFixed(3);
}

export function formatPValueWithStyle(pValue: number): JSX.Element {

    let formattedPValue = <span>{formatPValue(pValue)}</span>;
    if (pValue < 0.05) {
        formattedPValue = <b>{formattedPValue}</b>;
    }
    return formattedPValue;
}

export function formatLogOddsRatio(logOddsRatio: number): string {

    if (logOddsRatio < -3) {
        return "<-3";
    } else if (logOddsRatio > 3) {
        return ">3";
    }
    return logOddsRatio.toFixed(3);
}