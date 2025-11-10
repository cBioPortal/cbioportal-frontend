/**
 * cBioPortal MCP Server
 * Provides tools for building cBioPortal URLs
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { setConfig } from './urlBuilders/config.js';
import {
    buildStudyUrlTool,
    handleBuildStudyUrl,
} from './tools/buildStudyUrl.js';
import {
    buildPatientUrlTool,
    handleBuildPatientUrl,
} from './tools/buildPatientUrl.js';
import {
    buildResultsUrlTool,
    handleBuildResultsUrl,
} from './tools/buildResultsUrl.js';

export class CbioportalMcpServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: 'cbioportal-mcp-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();
        this.setupErrorHandling();
    }

    private setupHandlers(): void {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                buildStudyUrlTool,
                buildPatientUrlTool,
                buildResultsUrlTool,
            ],
        }));

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async request => {
            const { name, arguments: args } = request.params;

            try {
                let result: string;

                switch (name) {
                    case 'build_study_url':
                        result = await handleBuildStudyUrl(args as any);
                        break;

                    case 'build_patient_url':
                        result = await handleBuildPatientUrl(args as any);
                        break;

                    case 'build_results_url':
                        result = await handleBuildResultsUrl(args as any);
                        break;

                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: result,
                        },
                    ],
                };
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${errorMessage}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    private setupErrorHandling(): void {
        this.server.onerror = error => {
            console.error('[MCP Error]', error);
        };

        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    async run(): Promise<void> {
        // Configure base URL from environment
        if (process.env.CBIOPORTAL_BASE_URL) {
            setConfig({
                baseUrl: process.env.CBIOPORTAL_BASE_URL,
            });
        }

        const transport = new StdioServerTransport();
        await this.server.connect(transport);

        console.error('cBioPortal MCP server running on stdio');
        console.error(
            `Base URL: ${process.env.CBIOPORTAL_BASE_URL ||
                'www.cbioportal.org'}`
        );
    }
}
