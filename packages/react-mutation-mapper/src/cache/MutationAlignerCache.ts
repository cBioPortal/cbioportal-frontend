import request from 'superagent';

import {
    DEFAULT_MUTATION_ALIGNER_PROXY_URL_TEMPLATE,
    getUrl,
} from '../util/DataFetcherUtils';
import { DefaultStringQueryCache } from './DefaultStringQueryCache';

export function fetchMutationAlignerLink(
    pfamDomainId: string,
    mutationAlignerUrlTemplate: string = DEFAULT_MUTATION_ALIGNER_PROXY_URL_TEMPLATE
): request.SuperAgentRequest {
    return request
        .get(getUrl(mutationAlignerUrlTemplate, { pfamDomainId }))
        .accept('application/json');
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
            .then(res =>
                Promise.resolve(
                    `http://mutationaligner.org/domains/${res.body.pfamId}`
                )
            )
            .catch(e => Promise.reject(e));
    }
}
