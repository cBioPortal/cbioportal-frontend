/**
 * Vendored LibreChat configuration
 * Source: LibreChat v0.8.0 packages/data-provider/src/config.ts
 * Repository: https://github.com/danny-avila/LibreChat
 * License: MIT
 */

import { EModelEndpoint } from './types';

/**
 * Get API base URL (empty string for same-origin requests)
 */
function apiBaseUrl(): string {
    return '';
}

/**
 * Endpoint URLs for different model endpoints
 */
export const EndpointURLs = {
    [EModelEndpoint.assistants]: `${apiBaseUrl()}/api/assistants/v2/chat`,
    [EModelEndpoint.azureAssistants]: `${apiBaseUrl()}/api/assistants/v1/chat`,
    [EModelEndpoint.agents]: `${apiBaseUrl()}/api/${EModelEndpoint.agents}/chat`,
} as const;

/**
 * Check if endpoint is an assistants endpoint
 */
export function isAssistantsEndpoint(endpoint?: string | null): boolean {
    const value = endpoint ?? '';
    return !!value && value.toLowerCase().endsWith(EModelEndpoint.assistants);
}
