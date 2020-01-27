import TumorColumnFormatter from './mutation/column/TumorColumnFormatter';
import _ from 'lodash';

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
