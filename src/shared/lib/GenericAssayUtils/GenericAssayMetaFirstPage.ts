import _ from 'lodash';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import {
    fetchGenericAssayMetaPageByProfileIds,
    IGenericAssayMetaPageResult,
} from './GenericAssayCommonUtils';

// The first page of the profiles' entities and, per gene, the first page of
// a search for that gene: entities of a gene may not be on the first page.
export async function fetchGenericAssayMetaFirstPageWithGenes(
    profileIds: string[],
    genes: string[],
    pageSize: number
): Promise<{
    page: IGenericAssayMetaPageResult;
    geneItems: GenericAssayMeta[];
}> {
    const [page, ...genePages] = await Promise.all([
        fetchGenericAssayMetaPageByProfileIds(
            profileIds,
            undefined,
            pageSize,
            0
        ),
        ...genes.map(gene =>
            fetchGenericAssayMetaPageByProfileIds(profileIds, gene, pageSize, 0)
        ),
    ]);
    return { page, geneItems: _.flatMap(genePages, p => p.items) };
}
