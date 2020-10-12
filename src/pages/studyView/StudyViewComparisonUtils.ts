import {
    ChartMeta,
    ChartType,
    SpecialChartsUniqueKeyEnum,
} from './StudyViewUtils';
import {
    MolecularDataMultipleStudyFilter,
    MolecularProfile,
    MutationMultipleStudyFilter,
    Sample,
    SampleIdentifier,
    SampleMolecularIdentifier,
} from 'cbioportal-ts-api-client';
import { getGroupParameters } from 'pages/groupComparison/comparisonGroupManager/ComparisonGroupManagerUtils';
import { LoadingPhase } from 'pages/groupComparison/GroupComparisonLoading';
import comparisonClient from 'shared/api/comparisonGroupClientInstance';
import _ from 'lodash';
import { ChartTypeEnum } from 'pages/studyView/StudyViewConfig';
import { getGeneFromUniqueKey } from './TableUtils';
import client from 'shared/api/cbioportalClientInstance';
import { REQUEST_ARG_ENUM } from 'shared/constants';

export function doesChartHaveComparisonGroupsLimit(chartMeta: ChartMeta) {
    return chartMeta.uniqueKey !== SpecialChartsUniqueKeyEnum.CANCER_STUDIES;
}

export async function createAlteredGeneComparisonSession<
    D extends SampleIdentifier
>(
    chartMeta: ChartMeta,
    origin: string[],
    alterationsByGene: { [hugoGeneSymbol: string]: D[] },
    statusCallback: (phase: LoadingPhase) => void
) {
    const groups = _.map(alterationsByGene, (data, gene) => {
        const sampleIdentifiers = _.uniqBy(
            data,
            d => `${d.sampleId}_${d.studyId}`
        ).map(d => ({ studyId: d.studyId, sampleId: d.sampleId }));
        return getGroupParameters(gene, sampleIdentifiers, origin);
    });
    statusCallback(LoadingPhase.CREATING_SESSION);
    // create session and get id
    const { id } = await comparisonClient.addComparisonSession({
        groups,
        origin,
        clinicalAttributeName: chartMeta.displayName,
    });
    return id;
}

export function getHugoGeneSymbols(
    chartType: ChartType,
    selectedRowsKeys: string[]
): string[] {
    switch (chartType) {
        case ChartTypeEnum.CNA_GENES_TABLE:
            return _.uniq(selectedRowsKeys.map(getGeneFromUniqueKey));
            break;
        default:
            return selectedRowsKeys;
    }
}

function getSampleMolecularIdentifiers(
    selectedSamples: Sample[],
    profiles: MolecularProfile[]
) {
    const studyToProfile = _.keyBy(profiles, p => p.studyId);
    return selectedSamples.reduce((array, sample) => {
        if (sample.studyId in studyToProfile) {
            array.push({
                sampleId: sample.sampleId,
                molecularProfileId:
                    studyToProfile[sample.studyId].molecularProfileId,
            });
        }
        return array;
    }, [] as SampleMolecularIdentifier[]);
}

export async function getMutationData(
    selectedSamples: Sample[],
    mutationProfiles: MolecularProfile[],
    hugoGeneSymbols: string[]
) {
    const sampleMolecularIdentifiers = getSampleMolecularIdentifiers(
        selectedSamples,
        mutationProfiles
    );

    const genes = await client.fetchGenesUsingPOST({
        geneIdType: 'HUGO_GENE_SYMBOL',
        geneIds: hugoGeneSymbols,
    });

    const mutationMultipleStudyFilter = {
        entrezGeneIds: genes.map(g => g.entrezGeneId),
        sampleMolecularIdentifiers,
    } as MutationMultipleStudyFilter;

    return client.fetchMutationsInMultipleMolecularProfilesUsingPOST({
        projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
        mutationMultipleStudyFilter,
    });
}

export async function getCnaData(
    selectedSamples: Sample[],
    cnaProfiles: MolecularProfile[],
    hugoGeneSymbols: string[]
) {
    const sampleMolecularIdentifiers = getSampleMolecularIdentifiers(
        selectedSamples,
        cnaProfiles
    );

    const genes = await client.fetchGenesUsingPOST({
        geneIdType: 'HUGO_GENE_SYMBOL',
        geneIds: hugoGeneSymbols,
    });
    return client.fetchMolecularDataInMultipleMolecularProfilesUsingPOST({
        projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
        molecularDataMultipleStudyFilter: {
            entrezGeneIds: genes.map(g => g.entrezGeneId),
            sampleMolecularIdentifiers,
        } as MolecularDataMultipleStudyFilter,
    });
}

export function getComparisonParamsForTable(
    selectedRowsKeys: string[],
    chartType: ChartType
) {
    switch (chartType) {
        case ChartTypeEnum.MUTATED_GENES_TABLE:
        case ChartTypeEnum.CNA_GENES_TABLE:
            const hugoGeneSymbols = getHugoGeneSymbols(
                chartType,
                selectedRowsKeys.slice() // slice() gets rid of mobx wrapping which messes up API calls
            );
            return {
                hugoGeneSymbols,
            };
        case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE:
        case ChartTypeEnum.PATIENT_TREATMENTS_TABLE:
            return {
                treatmentUniqueKeys: selectedRowsKeys.slice(), // slice() gets rid of mobx wrapping which messes up API calls
            };
        default:
            return {};
    }
}
