#!/usr/bin/env node

/**
 * cBioPortal MCP Server Entry Point
 */

import { CbioportalMcpServer } from './server.js';

async function main() {
    const server = new CbioportalMcpServer();
    await server.run();
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
