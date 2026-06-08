import * as fs from 'fs';
import * as path from 'path';
import { getServerSpec } from './portalMcpServer';

describe('portal MCP server spec', () => {
    it('mcp.json matches getServerSpec() — regenerate mcp.json if this fails', () => {
        const committed = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'mcp.json'), 'utf8')
        );
        expect(committed).toEqual(getServerSpec());
    });

    it('exposes the expected resources and tools, with action tools scoped "act"', () => {
        const spec = getServerSpec();
        expect(spec.resources.map(r => r.uri)).toEqual([
            'cbioportal://current-view',
            'cbioportal://location',
            'cbioportal://page-inventory',
        ]);
        expect(spec.tools.map(t => t.name)).toEqual([
            'capture_viewport',
            'annotate_elements',
            'clear_annotations',
            'navigate',
        ]);
        expect(
            spec.tools.filter(t => t.scope === 'act').map(t => t.name)
        ).toEqual(['annotate_elements', 'clear_annotations', 'navigate']);
    });
});
