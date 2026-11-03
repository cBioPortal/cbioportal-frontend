import TumorColumnFormatter from './mutation/column/TumorColumnFormatter';
import _ from 'lodash';
import {
    IGenePanelDataByProfileIdAndSample,
    isSampleProfiledInProfile,
} from 'shared/lib/isSampleProfiled';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import {
    IMutationalSignature,
    IMutationalSignatureMeta,
    IMutationalCounts,
} from 'shared/model/MutationalSignature';
import { getGenericAssayMetaPropertyOrDefault } from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import {
    MutationalSignatureLabelMap,
    MutationalSignatureCount,
} from '/shared/model/MutationalSignature';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_DEFAULT,
    CNA_COLOR_GAIN,
    CNA_COLOR_HETLOSS,
    CNA_COLOR_HOMDEL,
} from 'cbioportal-frontend-commons';
import { DEFAULT_GREY } from 'shared/lib/Colors';

export function getMutationalSignaturesVersionFromProfileId(
    inputProfileId: string
): string {
    return _.last(inputProfileId.split('_')) || '';
}

export function checkNonProfiledGenesExist(
    sampleIds: string[],
    entrezGeneIds: number[],
    sampleToGenePanelId: { [sampleId: string]: string },
    genePanelIdToEntrezGeneIds: { [genePanelId: string]: number[] }
): boolean {
    return _.some(entrezGeneIds, entrezGeneId => {
        const profiledSamples = TumorColumnFormatter.getProfiledSamplesForGene(
            entrezGeneId,
            sampleIds,
            sampleToGenePanelId,
            genePanelIdToEntrezGeneIds
        );
        return _.values(profiledSamples).includes(false);
    });
}

export function getSamplesProfiledStatus(
    sampleIds: string[],
    genePanelData: IGenePanelDataByProfileIdAndSample,
    profileId: string | undefined
) {
    const notProfiledIds: string[] = sampleIds.reduce(
        (aggr: string[], sampleId: string) => {
            const isProfiled = isSampleProfiledInProfile(
                genePanelData,
                profileId,
                sampleId
            );
            if (!isProfiled) {
                aggr.push(sampleId);
            }
            return aggr;
        },
        []
    );

    const noneProfiled = notProfiledIds.length === sampleIds.length;
    const someProfiled = notProfiledIds.length < sampleIds.length;

    return {
        noneProfiled,
        someProfiled,
        notProfiledIds,
    };
}
export function retrieveMutationalSignatureMap(
    inputMetaData: GenericAssayMeta[]
): MutationalSignatureLabelMap[] {
    const mappedData = inputMetaData.map((metaData: GenericAssayMeta) => {
        const nameSig: string = getGenericAssayMetaPropertyOrDefault(
            metaData,
            'MUTATION_TYPE',
            ''
        );
        const classSig: string = getGenericAssayMetaPropertyOrDefault(
            metaData,
            'MUTATION_CLASS',
            ''
        );
        const mutNameSig: string = getGenericAssayMetaPropertyOrDefault(
            metaData,
            'NAME',
            ''
        );
        const signatureId = metaData.stableId;
        return {
            stableId: signatureId,
            signatureLabel: nameSig,
            signatureClass: classSig,
            name: mutNameSig,
        };
    });
    return mappedData;
}

export function createMutationalCountsObjects(
    inputData: any,
    signatureLabelMap: MutationalSignatureLabelMap[]
) {
    const result = inputData.map((count: MutationalSignatureCount) => ({
        patientId: count.patientId,
        sampleId: count.sampleId,
        studyId: count.studyId,
        uniquePatientKey: count.uniquePatientKey,
        uniqueSampleKey: count.uniqueSampleKey,
        version: getMutationalSignaturesVersionFromProfileId(
            count.molecularProfileId
        ),
        value: parseFloat(count.value),
        mutationalSignatureLabel:
            signatureLabelMap
                .filter(obj => obj.stableId === count.stableId)
                .map(obj => obj.name)[0] ||
            count.stableId.split('_matrix_')[1] ||
            '',
    }));
    return result;
}

export function getCNAColorByAlteration(alteration: string): string {
    switch (alteration) {
        case 'HOMDEL':
            return CNA_COLOR_HOMDEL;
        case 'HETLOSS':
            return '#2aced4';
        case 'DIPLOID':
            return DEFAULT_GREY;
        case 'GAIN':
            return '#ff8c9f';
        case 'AMP':
            return CNA_COLOR_AMP;
        default:
            return CNA_COLOR_DEFAULT;
    }
}
