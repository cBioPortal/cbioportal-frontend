import TumorColumnFormatter from './mutation/column/TumorColumnFormatter';
import {
    IGenePanelDataByProfileIdAndSample,
    isSampleProfiledInProfile,
} from 'shared/lib/isSampleProfiled';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import { getGenericAssayMetaPropertyOrDefault } from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import {
    MutationalSignatureLabelMap,
    MutationalSignatureCount,
} from '/shared/model/MutationalSignature';

export function getMutationalSignaturesVersionFromProfileId(
    inputProfileId: string
): string {
    const parts = inputProfileId.split('_');
    return parts.length > 0 ? parts[parts.length - 1] : '';
}

export function checkNonProfiledGenesExist(
    sampleIds: string[],
    entrezGeneIds: number[],
    sampleToGenePanelId: { [sampleId: string]: string },
    genePanelIdToEntrezGeneIds: { [genePanelId: string]: number[] }
): boolean {
    for (let index = 0; index < entrezGeneIds.length; index += 1) {
        const entrezGeneId = entrezGeneIds[index];
        const profiledSamples = TumorColumnFormatter.getProfiledSamplesForGene(
            entrezGeneId,
            sampleIds,
            sampleToGenePanelId,
            genePanelIdToEntrezGeneIds
        );
        for (const sampleId in profiledSamples) {
            if (profiledSamples[sampleId] === false) {
                return true;
            }
        }
    }
    return false;
}

export function getSamplesProfiledStatus(
    sampleIds: string[],
    genePanelData: IGenePanelDataByProfileIdAndSample,
    profileId: string | undefined
) {
    const notProfiledIds: string[] = [];
    for (let index = 0; index < sampleIds.length; index += 1) {
        const sampleId = sampleIds[index];
        const isProfiled = isSampleProfiledInProfile(
            genePanelData,
            profileId,
            sampleId
        );
        if (!isProfiled) {
            notProfiledIds.push(sampleId);
        }
    }

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
    const mappedData = new Array<MutationalSignatureLabelMap>(
        inputMetaData.length
    );
    for (let index = 0; index < inputMetaData.length; index += 1) {
        const metaData = inputMetaData[index];
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
        mappedData[index] = {
            stableId: signatureId,
            signatureLabel: nameSig,
            signatureClass: classSig,
            name: mutNameSig,
        };
    }
    return mappedData;
}

export function createMutationalCountsObjects(
    inputData: any,
    signatureLabelMap: MutationalSignatureLabelMap[]
) {
    const signatureNameByStableId: { [stableId: string]: string } = {};
    for (let index = 0; index < signatureLabelMap.length; index += 1) {
        const signature = signatureLabelMap[index];
        signatureNameByStableId[signature.stableId] = signature.name;
    }

    const result = new Array(inputData.length);
    for (let index = 0; index < inputData.length; index += 1) {
        const count = inputData[index] as MutationalSignatureCount;
        const fallbackLabelParts = count.stableId.split('_matrix_');
        result[index] = {
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
                signatureNameByStableId[count.stableId] ||
                fallbackLabelParts[1] ||
                '',
        };
    }
    return result;
}
