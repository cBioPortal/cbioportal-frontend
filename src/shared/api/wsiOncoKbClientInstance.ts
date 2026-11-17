import { OncoKbAPI } from 'oncokb-ts-api-client';
import { getOncoKbApiUrl } from './urls';

// WSI enrichment is optional. Keep this client separate from the portal-wide
// client because the latter reports failures through the global error bus.
let client: OncoKbAPI | undefined;

export function getWsiOncoKbClient(): OncoKbAPI {
    if (!client) {
        client = new OncoKbAPI();
    }

    // The portal initializes API-client prototypes (proxy masking, headers,
    // and caching) during bootstrap. Refresh the instance domain here so a
    // runtime OncoKB override is honored as well.
    (client as any).domain = getOncoKbApiUrl();
    return client;
}

export function resetWsiOncoKbClientForTests() {
    client = undefined;
}
