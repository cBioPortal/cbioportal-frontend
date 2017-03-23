import {Query} from "shared/api/generated/OncoKbAPI";
import oncokbClient from "shared/api/oncokbClientInstance";
import {generateEvidenceQuery, processEvidence} from "shared/lib/OncoKbUtils";
import {IEvidence} from "./mutation/column/AnnotationColumnFormatter";
import {default as SimpleCache, ICache} from "shared/lib/SimpleCache";

export default class OncoKbEvidenceCache extends SimpleCache<IEvidence, Query[]>
{
    constructor()
    {
        super();
    }

    protected async fetch(queryVariants: Query[])
    {
        const cache: ICache<IEvidence> = {};

        try {
            const evidenceLookup = await oncokbClient.evidencesLookupPostUsingPOST(
                {body: generateEvidenceQuery(queryVariants)}
            );

            const evidenceMap = processEvidence((evidenceLookup as any).data);

            for (const id in evidenceMap) {
                if (evidenceMap.hasOwnProperty(id))
                {
                    cache[id] = {
                        status: "complete",
                        data: evidenceMap[id]
                    };
                }
            }

            this.putData(cache);
        }
        catch (err) {
            queryVariants.forEach((queryVariant:Query) => {
                cache[queryVariant.id] = {
                    status: "error"
                };
            });

            this.putData(cache);
        }
    }
}
