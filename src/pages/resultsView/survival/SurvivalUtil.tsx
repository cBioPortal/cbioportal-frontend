import { PatientSurvival } from '../../../shared/model/PatientSurvival';
import { tsvFormat } from 'd3-dsv';
import jStat from 'jStat';
import * as _ from 'lodash';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';

export type ScatterData = {
    x: number;
    y: number;
    patientId: string;
    uniquePatientKey: string;
    studyId: string;
    status: boolean;
    opacity?: number;
    group?: string;
};

export type DownSamplingOpts = {
    xDenominator: number;
    yDenominator: number;
    threshold: number;
};

export type GroupedScatterData = {
    [key: string]: SurvivalCurveData;
};

export type SurvivalCurveData = {
    numOfCases: number;
    line: any[];
    scatterWithOpacity: ScatterData[];
    scatter: ScatterData[];
};

export type SurvivalPlotFilters = {
    x: [number, number];
    y: [number, number];
};

// TODO should remove this if we want to be generic
export const survivalClinicalDataVocabulary: { [prefix: string]: string[] } = {
    OS: ['DECEASED'],
    PFS: ['Progressed', 'Recurred/Progressed', 'PROGRESSION', 'Yes', '1'],
    DFS: ['Recurred/Progressed', 'Recurred', 'Progressed', 'Yes', '1'],
    DSS: ['DECEASED', 'Yes', 'DEAD OF MELANOMA', 'DEAD WITH TUMOR', '1'],
};

// TODO should remove this if we want to be generic
export const survivalPlotTooltipxLabelWithEvent: {
    [prefix: string]: string;
} = {
    // TODO text for PFS DSS?
    OS: 'Time of Death',
    PFS: 'Time of Death',
    DFS: 'Time of relapse',
    DSS: 'Time of Death',
};

// TODO should remove this if we want to be generic
export const plotsPriority: { [prefix: string]: number } = {
    OS: 1,
    DFS: 2,
    PFS: 3,
    DSS: 4,
};

export const DEFAULT_SURVIVAL_PRIORITY = 999;

export function getEstimates(patientSurvivals: PatientSurvival[]): number[] {
    let estimates: number[] = [];
    let previousEstimate: number = 1;
    patientSurvivals.forEach((patientSurvival, index) => {
        if (patientSurvival.status) {
            const atRisk = patientSurvivals.length - index;
            const estimate = previousEstimate * ((atRisk - 1) / atRisk);
            previousEstimate = estimate;
            estimates.push(estimate);
        } else {
            estimates.push(previousEstimate);
        }
    });
    return estimates;
}

export function getMedian(
    patientSurvivals: PatientSurvival[],
    estimates: number[]
): string {
    let median: string = 'NA';
    for (let i = 0; i < estimates.length; i++) {
        if (estimates[i] <= 0.5) {
            median = patientSurvivals[i].months.toFixed(2);
            break;
        }
    }
    return median;
}

export function getLineData(
    patientSurvivals: PatientSurvival[],
    estimates: number[]
): any[] {
    let chartData: any[] = [];

    chartData.push({ x: 0, y: 100 });
    patientSurvivals.forEach((patientSurvival, index) => {
        chartData.push({
            x: patientSurvival.months,
            y: estimates[index] * 100,
        });
    });

    return chartData;
}

export function getScatterData(
    patientSurvivals: PatientSurvival[],
    estimates: number[],
    group?: string
): ScatterData[] {
    return patientSurvivals.map((patientSurvival, index) => {
        const ret: ScatterData = {
            x: patientSurvival.months,
            y: estimates[index] * 100,
            patientId: patientSurvival.patientId,
            studyId: patientSurvival.studyId,
            uniquePatientKey: patientSurvival.uniquePatientKey,
            status: patientSurvival.status,
        };
        if (group) {
            ret.group = group;
        }
        return ret;
    });
}

export function getScatterDataWithOpacity(
    patientSurvivals: PatientSurvival[],
    estimates: number[],
    group?: string
): any[] {
    let scatterData = getScatterData(patientSurvivals, estimates, group);
    let chartData: any[] = [];
    let previousEstimate: number;

    patientSurvivals.forEach((patientSurvival, index) => {
        const estimate = estimates[index];
        let opacity: number = 1;
        if (previousEstimate && estimate !== previousEstimate) {
            opacity = 0;
        }
        previousEstimate = estimate;
        chartData.push({ ...scatterData[index], opacity: opacity });
    });

    return chartData;
}

export function getStats(
    patientSurvivals?: PatientSurvival[],
    estimates?: number[]
): [number, number, string] {
    if (patientSurvivals && estimates) {
        return [
            patientSurvivals.length,
            patientSurvivals.filter(
                patientSurvival => patientSurvival.status === true
            ).length,
            getMedian(patientSurvivals, estimates),
        ];
    } else {
        return [0, 0, 'N/A'];
    }
}

export function calculateLogRank(
    alteredPatientSurvivals: PatientSurvival[],
    unalteredPatientSurvivals: PatientSurvival[]
): number {
    let alteredIndex = 0;
    let unalteredIndex = 0;
    let totalAlteredNumberOfFailure = 0;
    let totalExpectation = 0;
    let totalVariance = 0;

    while (
        alteredIndex < alteredPatientSurvivals.length &&
        unalteredIndex < unalteredPatientSurvivals.length
    ) {
        let alteredNumberOfFailure = 0;
        let unalteredNumberOfFailure = 0;
        const alteredAtRisk = alteredPatientSurvivals.length - alteredIndex;
        const unalteredAtRisk =
            unalteredPatientSurvivals.length - unalteredIndex;
        const alteredPatientSurvival = alteredPatientSurvivals[alteredIndex];
        const unalteredPatientSurvival =
            unalteredPatientSurvivals[unalteredIndex];

        if (
            alteredPatientSurvival.months < unalteredPatientSurvival.months ||
            alteredPatientSurvival.months === unalteredPatientSurvival.months
        ) {
            if (alteredPatientSurvival.status) {
                alteredNumberOfFailure = 1;
            }
            alteredIndex += 1;
        }

        if (
            alteredPatientSurvival.months > unalteredPatientSurvival.months ||
            alteredPatientSurvival.months === unalteredPatientSurvival.months
        ) {
            if (unalteredPatientSurvival.status) {
                unalteredNumberOfFailure = 1;
            }
            unalteredIndex += 1;
        }

        const numberOfFailures =
            alteredNumberOfFailure + unalteredNumberOfFailure;
        const atRisk = alteredAtRisk + unalteredAtRisk;
        const expectation = (alteredAtRisk / atRisk) * numberOfFailures;
        const variance =
            (numberOfFailures *
                (atRisk - numberOfFailures) *
                alteredAtRisk *
                unalteredAtRisk) /
            (atRisk * atRisk * (atRisk - 1));

        totalAlteredNumberOfFailure += alteredNumberOfFailure;
        totalExpectation += expectation;
        totalVariance += variance;
    }

    const chiSquareScore =
        ((totalAlteredNumberOfFailure - totalExpectation) *
            (totalAlteredNumberOfFailure - totalExpectation)) /
        totalVariance;

    return 1 - jStat.chisquare.cdf(chiSquareScore, 1);
}

export function getDownloadContent(
    data: { scatterData: ScatterData[]; title: string }[],
    mainTitle: string
): string {
    let content: string = mainTitle; // + '\n\n';// + alteredTitle + '\n';
    for (const d of data) {
        content += '\n\n';
        content += d.title;
        content += '\n';
        content += tsvFormat(convertScatterDataToDownloadData(d.scatterData));
    }
    return content;
}

export function convertScatterDataToDownloadData(patientData: any[]): any[] {
    const downloadData: any[] = [];

    patientData.map((datum, index) => {
        downloadData.push({
            'Case ID': datum.patientId,
            'Study ID': datum.studyId,
            'Number at Risk': patientData.length - index,
            Status: datum.status ? 'deceased' : 'censored',
            'Survival Rate': datum.y / 100,
            'Time (months)': datum.x,
        });
    });

    return downloadData;
}

/**
 * Down sampling based on the hypotenuse difference.
 * The cross dot is guaranteed to be drawn when hidden dots are taking into account.
 * @param {DownSampling} opts
 * @returns {ScatterData[]}
 */
export function downSampling(
    data: ScatterData[],
    opts: DownSamplingOpts
): ScatterData[] {
    let xMax = _.maxBy(data, 'x');
    let xMin = _.minBy(data, 'x');

    let yMax = _.maxBy(data, 'y');
    let yMin = _.minBy(data, 'y');

    if (opts.xDenominator <= 0 || opts.yDenominator <= 0) return data;

    let timeThreshold =
        ((xMax ? xMax.x : 0) - (xMin ? xMin.x : 0)) / opts.xDenominator;
    let survivalRateThreshold =
        ((yMax ? yMax.y : 0) - (yMin ? yMin.y : 0)) / opts.yDenominator;
    let averageThreshold = Math.hypot(timeThreshold, survivalRateThreshold);
    let lastVisibleDataPoint = {
        x: 0,
        y: 0,
    };
    let lastDataPoint = {
        x: 0,
        y: 0,
    };

    return data.filter(function(dataItem, index) {
        let isVisibleDot =
            _.isUndefined(dataItem.opacity) || dataItem.opacity > 0;
        if (index == 0) {
            lastDataPoint.x = dataItem.x;
            lastDataPoint.y = dataItem.y;
            lastVisibleDataPoint.x = dataItem.x;
            lastVisibleDataPoint.y = dataItem.y;
            return true;
        }
        let distance = 0;
        if (isVisibleDot) {
            distance = Math.hypot(
                dataItem.x - lastVisibleDataPoint.x,
                dataItem.y - lastVisibleDataPoint.y
            );
        } else {
            distance = Math.hypot(
                dataItem.x - lastDataPoint.x,
                dataItem.y - lastDataPoint.y
            );
        }
        if (distance > averageThreshold) {
            lastDataPoint.x = dataItem.x;
            lastDataPoint.y = dataItem.y;
            if (isVisibleDot) {
                lastVisibleDataPoint.x = dataItem.x;
                lastVisibleDataPoint.y = dataItem.y;
            }
            return true;
        } else {
            return false;
        }
    });
}

export function filterScatterData(
    allScatterData: GroupedScatterData,
    filters: SurvivalPlotFilters | undefined,
    downSamplingOpts: DownSamplingOpts
): GroupedScatterData {
    let filteredData = _.cloneDeep(allScatterData);
    _.forEach(filteredData, (value: SurvivalCurveData) => {
        if (value.numOfCases > downSamplingOpts.threshold) {
            if (filters) {
                value.scatter = value.scatter.filter(_val =>
                    filterBasedOnCoordinates(filters, _val)
                );
                value.scatterWithOpacity = value.scatterWithOpacity.filter(
                    _val => filterBasedOnCoordinates(filters, _val)
                );
            }
            value.scatter = downSampling(value.scatter, downSamplingOpts);
            value.scatterWithOpacity = downSampling(
                value.scatterWithOpacity,
                downSamplingOpts
            );
            value.numOfCases = value.scatter.length;
        }
    });
    return filteredData;
}

function filterBasedOnCoordinates(
    filters: SurvivalPlotFilters,
    _val: ScatterData
) {
    if (
        _val.x <= filters.x[1] &&
        _val.x >= filters.x[0] &&
        _val.y <= filters.y[1] &&
        _val.y >= filters.y[0]
    ) {
        return true;
    }
    return false;
}

export const ALTERED_GROUP_VALUE = 'Altered';
export const UNALTERED_GROUP_VALUE = 'Unaltered';

export function getSurvivalChartDataByAlteredStatus(
    alteredSurvivals: PatientSurvival[],
    unalteredSurvivals: PatientSurvival[]
) {
    const patientToAnalysisGroups: { [patientKey: string]: string[] } = {};
    for (const s of alteredSurvivals) {
        patientToAnalysisGroups[s.uniquePatientKey] = [ALTERED_GROUP_VALUE];
    }
    for (const s of unalteredSurvivals) {
        patientToAnalysisGroups[s.uniquePatientKey] = [UNALTERED_GROUP_VALUE];
    }
    return {
        patientSurvivals: alteredSurvivals.concat(unalteredSurvivals),
        patientToAnalysisGroups,
    };
}

export function generateSurvivalPlotTitleFromDisplayName(title: string) {
    return title.replace(/status|survival/gi, '');
}

export function generateStudyViewSurvivalPlotTitle(title: string) {
    let result = title.replace(/status/gi, '');
    return /survival/i.test(result) ? result : `${result} Survival`;
}

export function getSurvivalAttributes(clinicalAttributes: ClinicalAttribute[]) {
    return _.chain(clinicalAttributes)
        .map(attr => attr.clinicalAttributeId)
        .filter(id => /_STATUS$/i.test(id) || /_MONTHS$/i.test(id))
        .uniq()
        .value();
}
