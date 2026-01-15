/**
 * LibreChat API Client for chat.cbioportal.org integration
 * Uses SSE (Server-Sent Events) for streaming responses
 * Adapted from LibreChat v0.8.0 client implementation
 */

import { SSE } from 'sse.js';
import type {
    TMessage,
    TConversation,
    TEndpointOption,
    TSubmission,
    TPayload,
} from './librechat/types';
import createPayload from './librechat/createPayload';

const LIBRECHAT_BASE_URL = 'https://chat.cbioportal.org';

export interface LibreChatMessage {
    text: string;
    conversationId?: string;
    parentMessageId?: string;
    endpoint?: string;
    model?: string;
    agent_id?: string;  // Required when using agents endpoint
    imageData?: string; // Base64-encoded image data for screenshot attachments
}

export interface LibreChatResponse {
    messageId: string;
    conversationId: string;
    text: string;
    sender: string;
    isCreatedByUser: boolean;
}

// Utility function to remove nullish values from objects
function removeNullishValues(obj: Record<string, any>): Record<string, any> {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined) {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, any>);
}

// Generate unique IDs
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export class LibreChatClient {
    private baseUrl: string;
    private token: string | null = null;
    private activeSSE: any = null;
    private refreshing: boolean = false;

    constructor(baseUrl: string = LIBRECHAT_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    // Get current token
    public getToken(): string | null {
        return this.token;
    }

    // Refresh the access token using the refresh token in cookies
    private async refreshToken(): Promise<boolean> {
        if (this.refreshing) {
            // Wait for ongoing refresh
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.token !== null;
        }

        this.refreshing = true;
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include', // Include cookies (refresh token)
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                return true;
            } else {
                this.token = null;
                return false;
            }
        } catch (error) {
            console.error('Failed to refresh token:', error);
            this.token = null;
            return false;
        } finally {
            this.refreshing = false;
        }
    }

    // Initialize authentication
    async initialize(): Promise<boolean> {
        return await this.refreshToken();
    }

    // Build a TSubmission payload following LibreChat's format
    private buildSubmission(
        message: LibreChatMessage,
        messages: TMessage[] = []
    ): TSubmission {
        const messageId = generateId();
        const conversationId = message.conversationId || null;
        const parentMessageId =
            message.parentMessageId || '00000000-0000-0000-0000-000000000000';

        // Determine endpoint based on the requested type
        let endpoint = 'openAI';
        let serverPath = `/api/agents/chat/${endpoint}`;

        if (message.endpoint === 'database' || message.endpoint === 'agents') {
            endpoint = 'agents';
            serverPath = `/api/agents/chat/${endpoint}`;
        }

        const userMessage: TMessage = {
            messageId,
            conversationId: conversationId || undefined,
            parentMessageId,
            text: message.text,
            sender: 'user',
            isCreatedByUser: true,
        };

        const conversation: Partial<TConversation> = {
            conversationId,
            endpoint,
            model: message.model,
        };

        const endpointOption: TEndpointOption = {
            endpoint,
            model: message.model || undefined,
            agent_id: message.agent_id,
        };

        const submission: TSubmission = {
            userMessage,
            conversation,
            endpointOption,
            messages,
            isTemporary: false,
            isRegenerate: false,
        };

        return submission;
    }


    async sendMessage(
        message: LibreChatMessage,
        onStream?: (text: string) => void,
        onComplete?: (response: LibreChatResponse) => void,
        onError?: (error: Error) => void
    ): Promise<void> {
        try {
            // Ensure we have a valid token
            if (!this.token) {
                const refreshed = await this.refreshToken();
                if (!refreshed) {
                    throw new Error(
                        'Authentication required. Please visit chat.cbioportal.org to log in.'
                    );
                }
            }

            // Close any existing SSE connection
            this.closeSSE();

            // Build submission
            const submission = this.buildSubmission(message);

            // Create payload using official LibreChat createPayload function
            const payloadData = createPayload(submission);
            const server = this.baseUrl + payloadData.server;
            const payload = removeNullishValues(payloadData.payload) as TPayload;

            console.log('LibreChat SSE Request:', {
                server,
                payload,
            });

            // Track streaming state
            let streamedText = '';
            let messageId = '';
            let conversationId = '';

            // Create SSE connection
            const sse = new SSE(server, {
                payload: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`,
                },
            });

            this.activeSSE = sse;

            // Handle message events (streaming text)
            sse.addEventListener('message', (event: any) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle different event types
                    if (data.event === 'on_message_delta' && data.data?.delta) {
                        // LibreChat sends delta.content as an array of content parts
                        // Structure: { delta: { content: [{ type: 'text', text: '...' }] } }
                        const content = data.data.delta.content;
                        if (Array.isArray(content)) {
                            for (const part of content) {
                                if (part.type === 'text' && typeof part.text === 'string') {
                                    streamedText += part.text;
                                }
                            }
                            if (onStream) {
                                onStream(streamedText);
                            }
                        }
                    } else if (data.final != null) {
                        // Final message - stream is complete
                        if (data.responseMessage) {
                            streamedText = data.responseMessage.text || streamedText;
                            messageId = data.responseMessage.messageId || messageId;
                            conversationId = data.conversation?.conversationId || conversationId;
                        }
                        if (onStream && streamedText) {
                            onStream(streamedText);
                        }
                        // Call completion handler
                        if (onComplete) {
                            onComplete({
                                messageId,
                                conversationId,
                                text: streamedText,
                                sender: 'ai',
                                isCreatedByUser: false,
                            });
                        }
                        this.closeSSE();
                        return;
                    } else if (data.text && typeof data.text === 'string') {
                        // Fallback for simple text events
                        streamedText = data.text;
                        if (onStream) {
                            onStream(streamedText);
                        }
                    }

                    // Extract IDs from any event
                    if (data.messageId) {
                        messageId = data.messageId;
                    }
                    if (data.conversationId) {
                        conversationId = data.conversationId;
                    }
                } catch (e) {
                    console.error('Error parsing SSE message:', e);
                }
            });

            // Handle stream open
            sse.addEventListener('open', () => {
                console.log('LibreChat SSE connection opened');
            });

            // Handle errors
            sse.addEventListener('error', (event: any) => {
                console.error('LibreChat SSE error:', event);

                let errorMessage = 'Unknown error occurred';

                // Check if we got an HTTP error response
                if (event.data) {
                    try {
                        const errorData = JSON.parse(event.data);
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        errorMessage = event.data;
                    }
                } else if (event.message) {
                    errorMessage = event.message;
                }

                // Check if it's an auth error
                if (
                    errorMessage.includes('401') ||
                    errorMessage.includes('authentication') ||
                    errorMessage.includes('Unauthorized')
                ) {
                    // Try to refresh token and retry once
                    this.refreshToken().then(refreshed => {
                        if (!refreshed) {
                            if (onError) {
                                onError(
                                    new Error(
                                        'Authentication expired. Please visit chat.cbioportal.org to log in.'
                                    )
                                );
                            }
                        } else {
                            // Could retry here, but for now just show error
                            if (onError) {
                                onError(
                                    new Error(
                                        'Please try sending your message again.'
                                    )
                                );
                            }
                        }
                    });
                } else {
                    if (onError) {
                        onError(new Error(errorMessage));
                    }
                }

                this.closeSSE();
            });

            // Handle completion (fallback - usually handled in message event with data.final)
            sse.addEventListener('done', () => {
                // Only call onComplete if we haven't already (check if SSE is still active)
                if (this.activeSSE && onComplete) {
                    onComplete({
                        messageId,
                        conversationId,
                        text: streamedText,
                        sender: 'ai',
                        isCreatedByUser: false,
                    });
                }
                this.closeSSE();
            });

            // Start the stream
            sse.stream();
        } catch (error) {
            console.error('LibreChat sendMessage error:', error);
            if (onError) {
                onError(
                    error instanceof Error
                        ? error
                        : new Error('Unknown error occurred')
                );
            }
        }
    }

    async getConversations(): Promise<any[]> {
        try {
            if (!this.token) {
                await this.refreshToken();
            }

            let response = await fetch(`${this.baseUrl}/api/convos`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`,
                },
                credentials: 'include',
            });

            if (response.status === 401) {
                await this.refreshToken();
                response = await fetch(`${this.baseUrl}/api/convos`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.token}`,
                    },
                    credentials: 'include',
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // LibreChat returns conversations in a {conversations: [...]} format
            if (result && result.conversations && Array.isArray(result.conversations)) {
                return result.conversations;
            }

            // Fallback if it's already an array
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            return [];
        }
    }

    async getMessages(conversationId: string): Promise<any[]> {
        try {
            if (!this.token) {
                await this.refreshToken();
            }

            let response = await fetch(
                `${this.baseUrl}/api/messages/${conversationId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.token}`,
                    },
                    credentials: 'include',
                }
            );

            if (response.status === 401) {
                await this.refreshToken();
                response = await fetch(
                    `${this.baseUrl}/api/messages/${conversationId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${this.token}`,
                        },
                        credentials: 'include',
                    }
                );
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            return [];
        }
    }

    async getAgents(): Promise<any[]> {
        try {
            if (!this.token) {
                await this.refreshToken();
            }

            let response = await fetch(`${this.baseUrl}/api/agents?requiredPermission=1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`,
                },
                credentials: 'include',
            });

            if (response.status === 401) {
                await this.refreshToken();
                response = await fetch(`${this.baseUrl}/api/agents?requiredPermission=1`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.token}`,
                    },
                    credentials: 'include',
                });
            }

            // Handle 304 Not Modified (cached response)
            if (response.status === 304) {
                console.warn('Agents response was 304 (cached), forcing fresh request');
                // Force a fresh request by adding cache-busting header
                response = await fetch(`${this.baseUrl}/api/agents?requiredPermission=1`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.token}`,
                        'Cache-Control': 'no-cache',
                    },
                    credentials: 'include',
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Available agents:', result);

            // LibreChat returns agents in a {object: 'list', data: [...]} format
            if (result && result.data && Array.isArray(result.data)) {
                return result.data;
            }

            // Fallback if it's already an array
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Failed to fetch agents:', error);
            return [];
        }
    }

    closeSSE() {
        if (this.activeSSE) {
            this.activeSSE.close();
            this.activeSSE = null;
        }
    }
}

// Export singleton instance
export const librechatClient = new LibreChatClient();
