import client from 'shared/api/cbioportalClientInstance';
import { REQUEST_ARG_ENUM } from 'shared/constants';

export async function getStudies(studyIds: string[]) {
    return await client.fetchStudiesUsingPOST({
        studyIds,
        projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
    });
}

export async function getGeneData(geneList: string[]) {
    return await client.fetchGenesUsingPOST({
        geneIdType: 'HUGO_GENE_SYMBOL',
        geneIds: geneList,
    });
}
