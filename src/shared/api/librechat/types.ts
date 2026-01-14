/**
 * Vendored LibreChat type definitions
 * Source: LibreChat v0.8.0 packages/data-provider/src/types.ts
 * Repository: https://github.com/danny-avila/LibreChat
 * License: MIT
 *
 * NOTE: This code is vendored because the published npm package has missing TypeScript
 * types and includes Node.js dependencies (crypto) that don't work in browsers.
 * We only vendor the minimal types and functions we actually use.
 *
 * TODO: Request LibreChat team to publish a browser-compatible build or fix type exports.
 */

export interface TMessage {
    messageId: string;
    conversationId?: string;
    parentMessageId?: string;
    text: string;
    sender: string;
    isCreatedByUser: boolean;
    tokenCount?: number;
    error?: boolean;
    unfinished?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface TConversation {
    conversationId?: string | null;
    title?: string;
    endpoint?: string;
    model?: string;
}

export interface TEndpointOption {
    endpoint: string;
    model?: string;
    agent_id?: string;
    [key: string]: any;
}

export interface TSubmission {
    userMessage: TMessage;
    conversation: Partial<TConversation>;
    endpointOption: TEndpointOption;
    messages?: TMessage[];
    isTemporary?: boolean;
    isRegenerate?: boolean;
    isEdited?: boolean;
    isContinued?: boolean;
    editedContent?: any;
    ephemeralAgent?: any;
}

export interface TPayload extends Omit<TMessage, 'conversationId'> {
    endpoint: string;
    conversationId?: string | null;
    model?: string;
    isTemporary?: boolean;
    isRegenerate?: boolean;
    editedContent?: any;
    isContinued?: boolean;
    ephemeralAgent?: any;
    [key: string]: any;
}

// Model endpoint enum
export enum EModelEndpoint {
    azureOpenAI = 'azureOpenAI',
    openAI = 'openAI',
    google = 'google',
    anthropic = 'anthropic',
    assistants = 'assistants',
    azureAssistants = 'azureAssistants',
    agents = 'agents',
    custom = 'custom',
    bedrock = 'bedrock',
    chatGPTBrowser = 'chatGPTBrowser',
    gptPlugins = 'gptPlugins',
}
