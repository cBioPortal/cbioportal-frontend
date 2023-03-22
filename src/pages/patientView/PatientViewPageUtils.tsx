import TumorColumnFormatter from './mutation/column/TumorColumnFormatter';
import _ from 'lodash';
import {
    IGenePanelDataByProfileIdAndSample,
    isSampleProfiledInProfile,
} from 'shared/lib/isSampleProfiled';

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
