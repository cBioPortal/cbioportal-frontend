interface WebMCPToolResult {
    content: Array<{ type: string; text: string }>;
}

interface WebMCPToolDescriptor {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute(
        params: Record<string, unknown>
    ): WebMCPToolResult | Promise<WebMCPToolResult>;
}

interface ModelContext {
    registerTool(descriptor: WebMCPToolDescriptor): void;
    unregisterTool(name: string): void;
}

interface Navigator {
    modelContext?: ModelContext;
}
