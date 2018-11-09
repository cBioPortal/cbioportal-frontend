import {getPercentage} from "../../../shared/lib/FormatUtils";
import * as React from "react";

export function getPatientSampleSummary(
    samples:any[],
    patients:any[]
) {
    if (samples.length !== patients.length) {
        return (
            <span>
                <strong>{patients.length}</strong> patients / <strong>{samples.length}</strong> samples
        </span>
    );
    } else {
        return (
            <span>
                <strong>{samples.length}</strong> samples
        </span>
    );
    }
}

export function getGeneSummary(hugoSymbols:string[]) {
    switch (hugoSymbols.length) {
        case 0:
            return "";
        case 1:
            return hugoSymbols[0];
        case 2:
            return hugoSymbols.join(" & ");
        default:
            return `${hugoSymbols[0]}, ${hugoSymbols[1]} & ${(hugoSymbols.length === 3) ? hugoSymbols[2] : `${hugoSymbols.length - 2} other genes`}`;
    }
}

export function getAlterationSummary(
    numSamples:number, numPatients:number, numAlteredSamples:number, numAlteredPatients:number, numGenes:number
) {
    const sampleSummary = `${numAlteredSamples} (${getPercentage(numAlteredSamples/numSamples, 0)}) of queried samples`;
    let patientSummary = "";
    if (numSamples !== numPatients) {
        // note that by the pigeonhole principle, its not possible to have same number of samples and patients and
        //  for there to be more than one sample in a single patient. thus in the case that there are same # of samples
        //  and patients, it must be that numAlteredSamples === numAlteredPatients. Thus we're not hiding any info
        //  by only showing # altered patients if there are different # of samples and patients.
        patientSummary = `${numAlteredPatients} (${getPercentage(numAlteredPatients/numPatients, 0)}) of queried patients and `;
    }
    return <strong>{`Queried gene${numGenes !== 1 ? "s are" : " is"} altered in ${patientSummary}${sampleSummary}`}</strong>;
}