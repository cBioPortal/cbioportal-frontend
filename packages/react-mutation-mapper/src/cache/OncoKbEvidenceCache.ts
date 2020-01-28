import {
    EvidenceQueries,
    generatePartialEvidenceQuery,
    ICache,
    OncoKbAPI,
    SimpleCache,
} from 'cbioportal-frontend-commons';

import { IEvidence, Query } from '../model/OncoKb';
import { initOncoKbClient } from '../util/DataFetcherUtils';
import { processEvidence } from '../util/OncoKbUtils';

export default class OncoKbEvidenceCache extends SimpleCache<
    IEvidence,
    Query[]
> {
    protected oncoKbClient: Partial<OncoKbAPI>;

    constructor(oncoKbClient?: Partial<OncoKbAPI>) {
        super();
        this.oncoKbClient = oncoKbClient || initOncoKbClient();
    }

    protected async fetch(queryVariants: Query[]) {
        const cache: ICache<IEvidence> = {};

        try {
            if (this.oncoKbClient.evidencesLookupPostUsingPOST) {
                const evidenceLookup = await this.oncoKbClient.evidencesLookupPostUsingPOST(
                    {
                        body: {
                            ...generatePartialEvidenceQuery(
                                'STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY,STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE,INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY,INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE'
                            ),
                            queries: queryVariants as Query[],
                        } as EvidenceQueries,
                    }
                );

                const evidenceMap = processEvidence(evidenceLookup);

                for (const id in evidenceMap) {
                    if (evidenceMap.hasOwnProperty(id)) {
                        cache[id] = {
                            status: 'complete',
                            data: evidenceMap[id],
                        };
                    }
                }

                this.putData(cache);
            }
        } catch (err) {
            queryVariants.forEach((queryVariant: Query) => {
                cache[queryVariant.id] = {
                    status: 'error',
                };
            });

            this.putData(cache);
        }
    }
}
