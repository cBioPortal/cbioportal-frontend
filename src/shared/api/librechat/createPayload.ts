/**
 * Vendored LibreChat createPayload function
 * Source: LibreChat v0.8.0 packages/data-provider/src/createPayload.ts
 * Repository: https://github.com/danny-avila/LibreChat
 * License: MIT
 */

import type { TSubmission, TPayload, EModelEndpoint } from './types';
import { EndpointURLs, isAssistantsEndpoint } from './config';

/**
 * Creates the payload and server URL for a message submission
 * This function determines the correct API endpoint based on the model endpoint type
 */
export default function createPayload(submission: TSubmission): {
    server: string;
    payload: TPayload;
} {
    const {
        isEdited,
        userMessage,
        isContinued,
        isTemporary,
        isRegenerate,
        conversation,
        editedContent,
        ephemeralAgent,
        endpointOption,
    } = submission;

    // Extract conversationId
    const conversationId = conversation.conversationId;

    // Get endpoint and endpointType
    const { endpoint: _e, endpointType } = endpointOption as {
        endpoint: EModelEndpoint;
        endpointType?: EModelEndpoint;
    };

    const endpoint = _e as EModelEndpoint;

    // Determine server path based on endpoint type
    // Default to agents base URL for all endpoints
    let server = `${EndpointURLs['agents']}/${endpoint}`;

    if (isAssistantsEndpoint(endpoint)) {
        server =
            EndpointURLs[(endpointType ?? endpoint) as 'assistants' | 'azureAssistants'] +
            (isEdited ? '/modify' : '');
    }

    // Build payload
    const payload: TPayload = {
        ...userMessage,
        ...endpointOption,
        endpoint,
        isTemporary,
        isRegenerate,
        editedContent,
        conversationId,
        isContinued: !!(isEdited && isContinued),
        ephemeralAgent: isAssistantsEndpoint(endpoint) ? undefined : ephemeralAgent,
    };

    return { server, payload };
}
