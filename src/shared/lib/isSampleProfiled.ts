import * as _ from 'lodash';
import {CoverageInformation, CoverageInformationForCase} from "../../pages/resultsView/ResultsViewPageStoreUtils";
import {GenePanelData} from "../api/generated/CBioPortalAPI";

export function isSampleProfiled(uniqueSampleKey:string, molecularProfileId:string,
                                  hugoGeneSymbol:string, coverageInformation:CoverageInformation):boolean
{
    return !!getSampleProfiledReport(uniqueSampleKey, coverageInformation, hugoGeneSymbol)[molecularProfileId];
}

function getSampleProfiledReport(
    uniqueSampleKey:string,
    coverageInformation:CoverageInformation,
    hugoGeneSymbol?:string
):{[molecularProfileId:string]:boolean} {
    // returns a map whose keys are the profiles which the sample is profiled in
    const sampleCoverage = coverageInformation.samples[uniqueSampleKey];

    // no sample coverage for sample
    if (!sampleCoverage) return {};

    const byGeneCoverage = hugoGeneSymbol ? sampleCoverage.byGene[hugoGeneSymbol] : _.flatten(_.values(sampleCoverage.byGene));

    // no by gene coverage for gene AND there's no allGene data available
    if (!byGeneCoverage && sampleCoverage.allGenes.length === 0) return {};

    const ret:{[m:string]:boolean} = {};

    // does molecular profile appear in the GENE specific panel data
    for (const gpData of (byGeneCoverage || [])) {
        ret[gpData.molecularProfileId] = true;
    }

    // does molecular profile appear in CROSS gene panel data
    for (const gpData of sampleCoverage.allGenes) {
        ret[gpData.molecularProfileId] = true;
    }

    return ret;
}

export function isSampleProfiledInMultiple(uniqueSampleKey:string, molecularProfileIds:string[],
                                           coverageInformation:CoverageInformation, hugoGeneSymbol?:string):boolean[]
{
    // returns boolean[] in same order as molecularProfileIds
    const profiledReport = getSampleProfiledReport(uniqueSampleKey, coverageInformation, hugoGeneSymbol);
    return molecularProfileIds.map(molecularProfileId=>!!profiledReport[molecularProfileId]);
}