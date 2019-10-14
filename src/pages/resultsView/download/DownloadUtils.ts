import * as _ from 'lodash';
import {
    AlterationTypeConstants, AnnotatedExtendedAlteration, CaseAggregatedData, ExtendedAlteration,
    IQueriedCaseData,
    IQueriedMergedTrackCaseData
} from "../ResultsViewPageStore";
import {
    alterationInfoForCaseAggregatedDataByOQLLine
} from "shared/components/oncoprint/OncoprintUtils";
import {makeGeneticTrackData} from "shared/components/oncoprint/DataUtils";
import {GeneticTrackDatum} from "shared/components/oncoprint/Oncoprint";
import {Sample, Gene, MolecularProfile, GenePanelData} from "shared/api/generated/CBioPortalAPI";
import {ICaseAlteration, IOqlData, ISubAlteration} from "./CaseAlterationTable";
import {IGeneAlteration} from "./GeneAlterationTable";
import {CoverageInformation, getSingleGeneResultKey, getMultipleGeneResultKey} from "../ResultsViewPageStoreUtils";
import { OQLLineFilterOutput, MergedTrackLineFilterOutput } from 'shared/lib/oql/oqlfilter';

export interface IDownloadFileRow {
    studyId: string;
    patientId: string;
    sampleId: string;
    alterationData: {[gene: string]: string[]};
}

export function generateOqlData(datum: GeneticTrackDatum,
                                geneAlterationDataByGene?: {[gene: string]: IGeneAlteration},
                                molecularProfileIdToMolecularProfile?: {[molecularProfileId:string]:MolecularProfile}): IOqlData
{
    const proteinChanges: string[] = [];
    const fusions: string[] = [];
    const cnaAlterations: ISubAlteration[] = [];
    const proteinLevels: ISubAlteration[] = [];
    const mrnaExpressions: ISubAlteration[] = [];
    const alterationTypes: string[] = [];

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
                    alterationTypes.push("CNA");
                }
                break;
            case AlterationTypeConstants.MRNA_EXPRESSION:
                if (alterationSubType.length > 0) {
                    mrnaExpressions.push({
                        type: alterationSubType,
                        value: alteration.value
                    });
                    alterationTypes.push("EXP");
                }
                break;
            case AlterationTypeConstants.PROTEIN_LEVEL:
                if (alterationSubType.length > 0) {
                    proteinLevels.push({
                        type: alterationSubType,
                        value: alteration.value
                    });
                    alterationTypes.push("PROT");
                }
                break;
            case AlterationTypeConstants.MUTATION_EXTENDED:
                if (alteration.mutationType.toLowerCase().includes("fusion")) {
                    fusions.push(alteration.proteinChange);
                    alterationTypes.push("FUSION");
                }
                else {
                    proteinChanges.push(alteration.proteinChange);
                    alterationTypes.push("MUT");
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
        proteinLevel: proteinLevels,
        isMutationNotProfiled: false,
        isFusionNotProfiled: false,
        isCnaNotProfiled: false,
        isMrnaExpNotProfiled: false,
        isProteinLevelNotProfiled: false,
        alterationTypes: alterationTypes
    });
}

export function updateOqlData(datum: GeneticTrackDatum,
    oql: IOqlData,
    molecularProfileIdToMolecularProfile?: {[molecularProfileId:string]:MolecularProfile}): IOqlData
{
    let isMutationNotProfiled = true;
    let isFusionNotProfiled = true;
    let isCnaNotProfiled = true;
    let isMrnaExpNotProfiled = true;
    let isProteinLevelNotProfiled = true;

    //record the profile information
    if (datum.profiled_in)
    {
        for (const profile of datum.profiled_in)
        {
            if (molecularProfileIdToMolecularProfile)
            {
                const molecularAlterationType = molecularProfileIdToMolecularProfile[profile.molecularProfileId].molecularAlterationType;
                switch (molecularAlterationType)
                {
                    case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                        isCnaNotProfiled = false;
                        break;
                    case AlterationTypeConstants.MRNA_EXPRESSION:
                        isMrnaExpNotProfiled = false;
                        break;
                    case AlterationTypeConstants.PROTEIN_LEVEL:
                        isProteinLevelNotProfiled = false;
                        break;
                    case AlterationTypeConstants.MUTATION_EXTENDED:
                        isMutationNotProfiled = false;
                    case AlterationTypeConstants.FUSION:
                        isFusionNotProfiled = false;
                        break;
                }                
            }
        }
    }
    oql.isMutationNotProfiled = isMutationNotProfiled;
    oql.isFusionNotProfiled = isFusionNotProfiled;
    oql.isCnaNotProfiled = isCnaNotProfiled;
    oql.isMrnaExpNotProfiled = isMrnaExpNotProfiled;
    oql.isProteinLevelNotProfiled = isProteinLevelNotProfiled;

    return oql;
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

export function generateOtherMolecularProfileData(molecularProfileId:string[], unfilteredCaseAggregatedData?: CaseAggregatedData<ExtendedAlteration>):
    {[key: string]: ExtendedAlteration[]}
{
    const sampleFilter = (alteration: ExtendedAlteration) => {
        return molecularProfileId.includes(alteration.molecularProfileId);
    };

    return unfilteredCaseAggregatedData ?
        generateSampleAlterationDataByGene(unfilteredCaseAggregatedData, sampleFilter) : {};
}

export function generateOtherMolecularProfileDownloadData(sampleAlterationDataByGene: {[key: string]: ExtendedAlteration[]},
                                             samples: Sample[] = [],
                                             genes: Gene[] = []): string[][]
{
    return sampleAlterationDataByGene ?
        generateDownloadData(sampleAlterationDataByGene, samples, genes) : [];
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
    oqlQuery: string,
    selectedMolecularProfiles:MolecularProfile[],
    caseAggregatedDataByOQLLine?: IQueriedCaseData<AnnotatedExtendedAlteration>[],
    caseAggregatedDataByUnflattenedOQLLine?: IQueriedMergedTrackCaseData[],
    genePanelInformation?: CoverageInformation,
    samples: Sample[] = [],
    geneAlterationDataByGene?: {[gene: string]: IGeneAlteration},
    molecularProfileIdToMolecularProfile?: {[molecularProfileId:string]:MolecularProfile}
): ICaseAlteration[] {
    const caseAlterationData: {[studyCaseId: string] : ICaseAlteration} = {};

    // put gene data into oqlDataByGene
    if (caseAggregatedDataByOQLLine &&
        genePanelInformation)
    {
        // we need the sample index for better performance
        const sampleIndex = _.keyBy(samples, 'uniqueSampleKey');

        caseAggregatedDataByOQLLine.forEach(data => {
            const geneticTrackData = makeGeneticTrackData(
                data.cases.samples, data.oql.gene, samples, genePanelInformation, selectedMolecularProfiles);

            geneticTrackData.forEach(datum => {
                const key = datum.study_id + ":" + datum.uid;
                initializeCaseAlterationData(caseAlterationData, datum, sampleIndex);
                // for each gene the oql data is different
                // that's why we need a map here
                const generatedOqlData = generateOqlData(datum, geneAlterationDataByGene, molecularProfileIdToMolecularProfile);
                //generate and update oqlDataByGene in caseAlterationData
                if (caseAlterationData[key].oqlDataByGene[data.oql.gene] !== undefined) {
                    caseAlterationData[key].oqlDataByGene[data.oql.gene] = _.merge(generatedOqlData, caseAlterationData[key].oqlDataByGene[data.oql.gene]);
                }
                else {
                    caseAlterationData[key].oqlDataByGene[data.oql.gene] = generatedOqlData;
                }
                updateOqlData(datum, caseAlterationData[key].oqlDataByGene[data.oql.gene], molecularProfileIdToMolecularProfile);
            });
        });
    }

    // put track data into oqlData
    if (caseAggregatedDataByUnflattenedOQLLine &&
        genePanelInformation)
    {
        // we need the sample index for better performance
        const sampleIndex = _.keyBy(samples, 'uniqueSampleKey');

        caseAggregatedDataByUnflattenedOQLLine.forEach((data, index) => {
            let genes;
            let trackName: string;
            // get genes and track mames
            if (data.mergedTrackOqlList === undefined) {
                genes = (data.oql as OQLLineFilterOutput<AnnotatedExtendedAlteration>).gene;
                trackName = getSingleGeneResultKey(index, oqlQuery, data.oql as OQLLineFilterOutput<AnnotatedExtendedAlteration>);
            }
            else {
                genes = (data.oql as MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>).list.map((oql) => oql.gene);
                trackName = getMultipleGeneResultKey(data.oql as MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>);
            }
            const geneticTrackData = makeGeneticTrackData(
                data.cases.samples, genes, samples, genePanelInformation, selectedMolecularProfiles);

            geneticTrackData.forEach(datum => {
                const key = datum.study_id + ":" + datum.uid;
                initializeCaseAlterationData(caseAlterationData, datum, sampleIndex);
                // for each track (for each oql line/gene) the oql data is different
                // that's why we need a map here
                const generatedOqlData = generateOqlData(datum, geneAlterationDataByGene, molecularProfileIdToMolecularProfile);
                //generate and update oqlData in caseAlterationData
                caseAlterationData[key].oqlData[trackName] = generatedOqlData
                updateOqlData(datum, caseAlterationData[key].oqlData[trackName], molecularProfileIdToMolecularProfile);
            });
        });
    }
    return _.values(caseAlterationData);
}

export function initializeCaseAlterationData(caseAlterationData: {[studyCaseId: string] : ICaseAlteration}, datum: GeneticTrackDatum, sampleIndex: _.Dictionary<Sample>) {
    const studyId = datum.study_id;
    const sampleId = datum.sample || (sampleIndex[datum.uid] ? sampleIndex[datum.uid].sampleId : "");
    const key = studyId + ":" + datum.uid;

    // initialize the row data
    caseAlterationData[key] = caseAlterationData[key] || {
        studyId,
        sampleId,
        patientId: sampleIndex[datum.uid] ? sampleIndex[datum.uid].patientId : "",
        altered: false,
        oqlData: {},
        oqlDataByGene: {}
    };

    // update altered: a single alteration in any track means altered
    caseAlterationData[key].altered = caseAlterationData[key].altered || datum.data.length > 0;
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

export function decideMolecularProfileSortingOrder(profileType: MolecularProfile['molecularAlterationType']) {
    switch (profileType) {
        case "MUTATION_EXTENDED":
            return 1;
        case "COPY_NUMBER_ALTERATION":
            return 2;
        case "GENESET_SCORE":
            return 3;
        case "MRNA_EXPRESSION":
            return 4;
        case "METHYLATION":
            return 5;
        case "METHYLATION_BINARY":
            return 6;
        case "PROTEIN_LEVEL":
            return 7;
        default:
            return Number.MAX_VALUE;
    }
}