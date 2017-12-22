import { PatientSurvival } from "../../../shared/model/PatientSurvival";
import { tsvFormat } from 'd3-dsv';
import jStat from 'jStat';

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

export function getMedian(patientSurvivals: PatientSurvival[], estimates: number[]): string {

    let median: string = "NA";
    for (let i = 0; i < estimates.length; i++) {
        if (estimates[i] <= 0.5) {
            median = patientSurvivals[i].months.toString();
            break;
        }
    }
    return median;
}

export function getLineData(patientSurvivals: PatientSurvival[], estimates: number[]): any[] {

    let chartData: any[] = [];

    chartData.push({ x: 0, y: 100 });
    patientSurvivals.forEach((patientSurvival, index) => {
        chartData.push({ x: patientSurvival.months, y: estimates[index] * 100 })
    });

    return chartData;
}

export function getScatterData(patientSurvivals: PatientSurvival[], estimates: number[]): any[] {

    return patientSurvivals.map((patientSurvival, index) => {
        return {
            x: patientSurvival.months, y: estimates[index] * 100,
            patientId: patientSurvival.patientId, studyId: patientSurvival.studyId,
            status: patientSurvival.status
        };
    });
}

export function getScatterDataWithOpacity(patientSurvivals: PatientSurvival[], estimates: number[]): any[] {

    let scatterData = getScatterData(patientSurvivals, estimates);
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

export function getStats(patientSurvivals: PatientSurvival[], estimates: number[]): [number, number, string] {

    return [patientSurvivals.length,
    patientSurvivals.filter(patientSurvival => patientSurvival.status === true).length,
    getMedian(patientSurvivals, estimates)];
}

export function calculateLogRank(alteredPatientSurvivals: PatientSurvival[],
    unalteredPatientSurvivals: PatientSurvival[]): number {

    let alteredIndex = 0;
    let unalteredIndex = 0;
    let totalAlteredNumberOfFailure = 0;
    let totalExpectation = 0;
    let totalVariance = 0;

    while (alteredIndex < alteredPatientSurvivals.length && unalteredIndex < unalteredPatientSurvivals.length) {

        let alteredNumberOfFailure = 0;
        let unalteredNumberOfFailure = 0;
        const alteredAtRisk = alteredPatientSurvivals.length - alteredIndex;
        const unalteredAtRisk = unalteredPatientSurvivals.length - unalteredIndex;
        const alteredPatientSurvival = alteredPatientSurvivals[alteredIndex];
        const unalteredPatientSurvival = unalteredPatientSurvivals[unalteredIndex];

        if (alteredPatientSurvival.months < unalteredPatientSurvival.months ||
            alteredPatientSurvival.months === unalteredPatientSurvival.months) {
            if (alteredPatientSurvival.status) {
                alteredNumberOfFailure = 1;
            }
            alteredIndex += 1;
        }

        if (alteredPatientSurvival.months > unalteredPatientSurvival.months ||
            alteredPatientSurvival.months === unalteredPatientSurvival.months) {
            if (unalteredPatientSurvival.status) {
                unalteredNumberOfFailure = 1;
            }
            unalteredIndex += 1;
        }

        const numberOfFailures = alteredNumberOfFailure + unalteredNumberOfFailure;
        const atRisk = alteredAtRisk + unalteredAtRisk;
        const expectation = (alteredAtRisk / (atRisk)) * (numberOfFailures);
        const variance = (numberOfFailures * (atRisk - numberOfFailures) * alteredAtRisk * unalteredAtRisk) /
            ((atRisk * atRisk) * (atRisk - 1));

        totalAlteredNumberOfFailure += alteredNumberOfFailure;
        totalExpectation += expectation;
        totalVariance += variance;
    }

    const chiSquareScore = (totalAlteredNumberOfFailure - totalExpectation) *
        (totalAlteredNumberOfFailure - totalExpectation) / totalVariance;

    return 1 - jStat.chisquare.cdf(chiSquareScore, 1);
}

export function getDownloadContent(alteredPatientData: any[], unalteredPatientData: any[], mainTitle: string,
    alteredTitle: string, unalteredTitle: string): string {

    let content: string = mainTitle + '\n\n' + alteredTitle + '\n';
    content += tsvFormat(convertScatterDataToDownloadData(alteredPatientData)) + '\n\n' + unalteredTitle + '\n';
    content += tsvFormat(convertScatterDataToDownloadData(unalteredPatientData));
    return content;
}

export function convertScatterDataToDownloadData(patientData: any[]): any[] {

    const downloadData: any[] = [];

    patientData.map((datum, index) => {
        downloadData.push({
            "Case ID": datum.patientId, "Study ID": datum.studyId, "Number at Risk": patientData.length - index,
            "Status": datum.status ? "deceased" : "censored", "Survival Rate": datum.y / 100, "Time (months)": datum.x
        });
    })

    return downloadData;
}