import * as _ from 'lodash';
import {
    AlterationTypeConstants, AnnotatedExtendedAlteration, CaseAggregatedData, ExtendedAlteration,
    IQueriedCaseData
} from "../ResultsViewPageStore";
import {
    alterationInfoForCaseAggregatedDataByOQLLine
} from "shared/components/oncoprint/OncoprintUtils";
import {makeGeneticTrackData} from "shared/components/oncoprint/DataUtils";
import {GeneticTrackDatum} from "shared/components/oncoprint/Oncoprint";
import {Sample, Gene, MolecularProfile} from "shared/api/generated/CBioPortalAPI";
import {ICaseAlteration, IOqlData, ISubAlteration} from "./CaseAlterationTable";
import {IGeneAlteration} from "./GeneAlterationTable";
import {CoverageInformation} from "../ResultsViewPageStoreUtils";


export interface IDownloadFileRow {
    studyId: string;
    patientId: string;
    sampleId: string;
    alterationData: {[gene: string]: string[]};
}

export function generateOqlData(datum: GeneticTrackDatum,
                                geneAlterationDataByGene?: {[gene: string]: IGeneAlteration}): IOqlData
{
    const proteinChanges: string[] = [];
    const fusions: string[] = [];
    const cnaAlterations: ISubAlteration[] = [];
    const proteinLevels: ISubAlteration[] = [];
    const mrnaExpressions: ISubAlteration[] = [];

    // there might be multiple alterations for a single sample
    for (const alteration of datum.data)
    {
        const molecularAlterationType = alteration.molecularProfileAlterationType;
        const alterationSubType = alteration.alterationSubType.toUpperCase();

        switch (molecularAlterationType)
        {
            case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                if (alterationSubType.length > 0) {
                    cnaAlterations.push({
                        type: alterationSubType,
                        value: alteration.value
                    });
                }
                break;
            case AlterationTypeConstants.MRNA_EXPRESSION:
                if (alterationSubType.length > 0) {
                    mrnaExpressions.push({
                        type: alterationSubType,
                        value: alteration.value
                    });
                }
                break;
            case AlterationTypeConstants.PROTEIN_LEVEL:
                if (alterationSubType.length > 0) {
                    proteinLevels.push({
                        type: alterationSubType,
                        value: alteration.value
                    });
                }
                break;
            case AlterationTypeConstants.MUTATION_EXTENDED:
                if (alteration.mutationType.toLowerCase().includes("fusion")) {
                    fusions.push(alteration.proteinChange);
                }
                else {
                    proteinChanges.push(alteration.proteinChange);
                }
                break;
        }
    }

    return ({
        // by default assume it is sequenced if the label is not a recognised
        // gene symbol or if no gene alteration data exists for the gene; it
        // should always be a gene symbol as long as the download tab doesn't
        // use multi-gene tracks
        sequenced: geneAlterationDataByGene && geneAlterationDataByGene[datum.trackLabel]
            ? geneAlterationDataByGene[datum.trackLabel].sequenced > 0
            : true,
        geneSymbol: datum.trackLabel,
        mutation: proteinChanges,
        fusion: fusions,
        cna: cnaAlterations,
        mrnaExp: mrnaExpressions,
        proteinLevel: proteinLevels
    });
}

export function generateGeneAlterationData(
    caseAggregatedDataByOQLLine?: IQueriedCaseData<AnnotatedExtendedAlteration>[],
    sequencedSampleKeysByGene: {[hugoGeneSymbol:string]:string[]} = {}): IGeneAlteration[]
{
    return (caseAggregatedDataByOQLLine && !_.isEmpty(sequencedSampleKeysByGene)) ?
        caseAggregatedDataByOQLLine.map(data => {
            const info = alterationInfoForCaseAggregatedDataByOQLLine(
                true, data, sequencedSampleKeysByGene, {});

            return {
                gene: data.oql.gene,
                oqlLine: data.oql.oql_line,
                altered: info.altered,
                sequenced: info.sequenced,
                percentAltered: info.percent
            };
        }) :
        [];
}

export function stringify2DArray(data: string[][], colDelimiter: string = "\t", rowDelimiter: string = "\n")
{
    return data.map(mutation => mutation.join(colDelimiter)).join(rowDelimiter);
}

export function generateMutationData(unfilteredCaseAggregatedData?: CaseAggregatedData<ExtendedAlteration>):
    {[key: string]: ExtendedAlteration[]}
{
    const sampleFilter = (alteration: ExtendedAlteration) => {
        return (
            alteration.molecularProfileAlterationType === AlterationTypeConstants.MUTATION_EXTENDED ||
            alteration.molecularProfileAlterationType === AlterationTypeConstants.FUSION
        );
    };

    return unfilteredCaseAggregatedData ?
        generateSampleAlterationDataByGene(unfilteredCaseAggregatedData, sampleFilter) : {};
}

export function generateMutationDownloadData(sampleAlterationDataByGene: {[key: string]: ExtendedAlteration[]},
                                             samples: Sample[] = [],
                                             genes: Gene[] = []): string[][]
{
    return sampleAlterationDataByGene ?
        generateDownloadData(sampleAlterationDataByGene, samples, genes, extractMutationValue) : [];
}

export function generateMrnaData(unfilteredCaseAggregatedData?: CaseAggregatedData<ExtendedAlteration>):
    {[key: string]: ExtendedAlteration[]}
{
    const sampleFilter = (alteration: ExtendedAlteration) => {
        return alteration.molecularProfileAlterationType === AlterationTypeConstants.MRNA_EXPRESSION;
    };

    return unfilteredCaseAggregatedData ?
        generateSampleAlterationDataByGene(unfilteredCaseAggregatedData, sampleFilter) : {};
}


export function generateProteinData(unfilteredCaseAggregatedData?: CaseAggregatedData<ExtendedAlteration>):
    {[key: string]: ExtendedAlteration[]}
{
    const sampleFilter = (alteration: ExtendedAlteration) => {
        return alteration.molecularProfileAlterationType === AlterationTypeConstants.PROTEIN_LEVEL;
    };

    return unfilteredCaseAggregatedData ?
        generateSampleAlterationDataByGene(unfilteredCaseAggregatedData, sampleFilter) : {};
}

export function generateCnaData(unfilteredCaseAggregatedData?: CaseAggregatedData<ExtendedAlteration>):
    {[key: string]: ExtendedAlteration[]}
{
    const sampleFilter = (alteration: ExtendedAlteration) => {
        return alteration.molecularProfileAlterationType === AlterationTypeConstants.COPY_NUMBER_ALTERATION;
    };

    return unfilteredCaseAggregatedData ?
        generateSampleAlterationDataByGene(unfilteredCaseAggregatedData, sampleFilter) : {};
}

export function generateSampleAlterationDataByGene(unfilteredCaseAggregatedData: CaseAggregatedData<ExtendedAlteration>,
                                                   sampleFilter?: (alteration: ExtendedAlteration) => boolean): {[key: string]: ExtendedAlteration[]}
{
    // key => gene + uniqueSampleKey
    const sampleDataByGene: {[key: string]: ExtendedAlteration[]} = {};

    _.values(unfilteredCaseAggregatedData.samples).forEach(alterations => {
        alterations.forEach(alteration => {
            const key = `${alteration.gene.hugoGeneSymbol}_${alteration.uniqueSampleKey}`;
            sampleDataByGene[key] = sampleDataByGene[key] || [];

            // if no filter function provided nothing is filtered out,
            // otherwise alteration is filtered out if filter function returns false
            if (!sampleFilter || sampleFilter(alteration)) {
                sampleDataByGene[key].push(alteration);
            }
        });
    });

    return sampleDataByGene;
}

export function generateDownloadFileRows(sampleAlterationDataByGene: {[key: string]: ExtendedAlteration[]},
                                         geneSymbols: string[],
                                         sampleIndex: {[sampleKey: string]: Sample},
                                         sampleKeys: string[],
                                         extractValue?: (alteration: ExtendedAlteration) => string): {[sampleKey: string]: IDownloadFileRow}
{
    const rows: {[sampleKey: string]: IDownloadFileRow} = {};

    sampleKeys.forEach(sampleKey => {
        const sample = sampleIndex[sampleKey];

        const row: IDownloadFileRow = rows[sampleKey] || {
            studyId: sample.studyId,
            sampleId: sample.sampleId,
            patientId: sample.patientId,
            alterationData: {}
        };

        rows[sampleKey] = row;

        geneSymbols.forEach(gene => {
            row.alterationData[gene] = row.alterationData[gene] || [];

            const key = `${gene}_${sampleKey}`;

            if (sampleAlterationDataByGene[key]) {
                sampleAlterationDataByGene[key].forEach(alteration => {
                    const value = extractValue ? extractValue(alteration) : String(alteration.value);
                    row.alterationData[gene].push(value);
                });
            }
        });
    });

    return rows;
}

export function generateDownloadData(sampleAlterationDataByGene: {[key: string]: ExtendedAlteration[]},
                                     samples: Sample[] = [],
                                     genes: Gene[] = [],
                                     extractValue?: (alteration:ExtendedAlteration) => string,
                                     formatData?: (data: string[]) => string)
{
    const geneSymbols = genes.map(gene => gene.hugoGeneSymbol);

    // we need the sample index for better performance
    const sampleIndex = _.keyBy(samples, 'uniqueSampleKey');
    const sampleKeys = samples.map(sample => sample.uniqueSampleKey);

    // generate row data (keyed by uniqueSampleKey)
    const rows = generateDownloadFileRows(sampleAlterationDataByGene, geneSymbols, sampleIndex, sampleKeys, extractValue);

    const downloadData: string[][] = [];

    // add headers
    downloadData.push(["STUDY_ID", "SAMPLE_ID"].concat(geneSymbols));

    // convert row data into a 2D array of strings
    sampleKeys.forEach(sampleKey => {
        const rowData = rows[sampleKey];
        const row: string[] = [];

        row.push(rowData.studyId);
        row.push(rowData.sampleId);

        geneSymbols.forEach(gene => {
            const formattedValue = formatData ?
                formatData(rowData.alterationData[gene]) : // if provided format with the custom data formatter
                rowData.alterationData[gene].join(" ") || "NA"; // else, default format: space delimited join

            row.push(formattedValue);
        });

        downloadData.push(row);
    });

    return downloadData;
}

export function generateCaseAlterationData(
    selectedMolecularProfiles:MolecularProfile[],
    caseAggregatedDataByOQLLine?: IQueriedCaseData<AnnotatedExtendedAlteration>[],
    genePanelInformation?: CoverageInformation,
    samples: Sample[] = [],
    geneAlterationDataByGene?: {[gene: string]: IGeneAlteration}
): ICaseAlteration[] {
    const caseAlterationData: {[studyCaseId: string] : ICaseAlteration} = {};

    if (caseAggregatedDataByOQLLine &&
        genePanelInformation)
    {
        // we need the sample index for better performance
        const sampleIndex = _.keyBy(samples, 'uniqueSampleKey');

        caseAggregatedDataByOQLLine.forEach(data => {
            const geneticTrackData = makeGeneticTrackData(
                data.cases.samples, data.oql.gene, samples, genePanelInformation, selectedMolecularProfiles);

            geneticTrackData.forEach(datum => {
                const studyId = datum.study_id;
                const sampleId = datum.sample || (sampleIndex[datum.uid] ? sampleIndex[datum.uid].sampleId : "");
                const key = studyId + ":" + datum.uid;

                // initialize the row data
                caseAlterationData[key] = caseAlterationData[key] || {
                    studyId,
                    sampleId,
                    patientId: sampleIndex[datum.uid] ? sampleIndex[datum.uid].patientId : "",
                    altered: false,
                    oqlData: {}
                };

                // update altered: a single alteration in any track means altered
                caseAlterationData[key].altered = caseAlterationData[key].altered || datum.data.length > 0;

                // for each track (for each oql line/gene) the oql data is different
                // that's why we need a map here
                caseAlterationData[key].oqlData[data.oql.oql_line] = generateOqlData(datum, geneAlterationDataByGene);
            });
        });
    }

    return _.values(caseAlterationData);
}

export function hasValidData(sampleAlterationDataByGene: {[key: string]: ExtendedAlteration[]},
                             extractValue?: (alteration: ExtendedAlteration) => string): boolean
{
    for (const alterations of _.values(sampleAlterationDataByGene))
    {
        for (const alteration of alterations)
        {
            const value = extractValue ? extractValue(alteration) : alteration.value;

            // at least one valid value means, there is valid data
            // TODO also filter out values like "NA", "N/A", etc. ?
            if (value && String(value).length > 0) {
                return true;
            }
        }
    }

    // if no valid value is found, then there is no valid data
    return false;
}

export function hasValidMutationData(sampleAlterationDataByGene: {[key: string]: ExtendedAlteration[]}): boolean
{
    return hasValidData(sampleAlterationDataByGene, extractMutationValue);
}

function extractMutationValue(alteration: ExtendedAlteration)
{
    return alteration.proteinChange;
}
