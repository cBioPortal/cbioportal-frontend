import * as _ from 'lodash';
import {CoverageInformation} from "../../pages/resultsView/ResultsViewPageStoreUtils";
import {GenePanelData} from "../api/generated/CBioPortalAPI";

export function isSampleProfiled(uniqueSampleKey:string, molecularProfileId:string,
                                  hugoGeneSymbol:string, coverageInformation:CoverageInformation):boolean
{
    const sampleCoverage = coverageInformation.samples[uniqueSampleKey];

    // no sample coverage for sample
    if (!sampleCoverage) return false;

    const byGeneCoverage = sampleCoverage.byGene[hugoGeneSymbol];

    // no by gene coverage for gene AND there's no allGene data available
    if (!byGeneCoverage && sampleCoverage.allGenes.length === 0) return false;

    // does molecular profile appear in the GENE specific panel data
    const coveredByGene = (!!byGeneCoverage && _.find(byGeneCoverage,
        (genePanelData:GenePanelData)=>genePanelData.molecularProfileId === molecularProfileId) !== undefined);

    // does molecular profile appear in CROSS gene panel data
    const coveredByAll = (_.find(sampleCoverage.allGenes,
        (genePanelData:GenePanelData)=>genePanelData.molecularProfileId === molecularProfileId) !== undefined);

    // IS covered if either is true
    return (coveredByGene || coveredByAll);
}