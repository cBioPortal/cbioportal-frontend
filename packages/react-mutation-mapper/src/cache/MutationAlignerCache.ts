import request from 'superagent';

import {
    DEFAULT_MUTATION_ALIGNER_URL_TEMPLATE,
    getUrl,
} from '../util/DataFetcherUtils';
import { DefaultStringQueryCache } from './DefaultStringQueryCache';

export function fetchMutationAlignerLink(
    pfamDomainId: string,
    mutationAlignerUrlTemplate: string = DEFAULT_MUTATION_ALIGNER_URL_TEMPLATE
): request.SuperAgentRequest {
    return request.get(getUrl(mutationAlignerUrlTemplate, { pfamDomainId }));
}

export class MutationAlignerCache extends DefaultStringQueryCache<string> {
    constructor(private mutationAlignerUrlTemplate?: string) {
        super();
    }

    public fetch(pfamAccession: string): Promise<string> {
        return fetchMutationAlignerLink(
            pfamAccession,
            this.mutationAlignerUrlTemplate
        )
            .then(res => Promise.resolve(res.body.linkToMutationAligner))
            .catch(e => Promise.reject(e));
    }
}
