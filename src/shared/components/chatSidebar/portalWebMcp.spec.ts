/**
 * @jest-environment jsdom
 */
import { PortalWebMcp } from './portalWebMcp';
import { getServerSpec } from './portalMcpServer';

// A fake document.modelContext that records registrations.
function installFakeModelContext() {
    const registered: any[] = [];
    (document as any).modelContext = {
        registerTool: (descriptor: any, _options?: any) => {
            registered.push(descriptor);
        },
    };
    return registered;
}

function uninstallModelContext() {
    delete (document as any).modelContext;
}

// Minimal PortalContext stand-in that records calls.
function fakeCtx() {
    const calls: any[] = [];
    return {
        calls,
        getCurrentView: async () => ({}),
        getLocation: async () => ({
            href: '',
            path: '',
            query: {},
            tabId: null,
        }),
        getInventory: async () => ({ alterations: [], genes: [], tabs: [] }),
        captureViewport: async (o: any) => {
            calls.push(['captureViewport', o]);
            return 'data:image/png;base64,AAA';
        },
        annotate: async (a: any) => {
            calls.push(['annotate', a]);
            return { placed: a.length };
        },
        clearAnnotations: async () => {
            calls.push(['clearAnnotations']);
        },
        navigate: async (p: any) => {
            calls.push(['navigate', p]);
            return { href: '', path: '', query: {}, tabId: null };
        },
        onViewChange: () => () => undefined,
    } as any;
}

describe('PortalWebMcp', () => {
    afterEach(uninstallModelContext);

    it('reports unsupported when document.modelContext is absent', () => {
        uninstallModelContext();
        expect(PortalWebMcp.isSupported()).toBe(false);
        // start() is a safe no-op when the API is missing.
        expect(new PortalWebMcp(fakeCtx()).start()).toBe(false);
    });

    it('registers every spec tool, routing execute() to PortalContext', async () => {
        const registered = installFakeModelContext();
        const ctx = fakeCtx();
        expect(new PortalWebMcp(ctx).start()).toBe(true);

        expect(registered.map(t => t.name)).toEqual(
            getServerSpec().tools.map(t => t.name)
        );

        const navTool = registered.find(t => t.name === 'navigate');
        await navTool.execute({ path: 'results/survival' });
        expect(ctx.calls).toContainEqual([
            'navigate',
            {
                path: 'results/survival',
                params: {},
                clear: false,
                replace: false,
            },
        ]);
    });

    it('readOnly registers only read-scope tools', () => {
        const registered = installFakeModelContext();
        new PortalWebMcp(fakeCtx(), { readOnly: true }).start();
        expect(registered.map(t => t.name)).toEqual(['capture_viewport']);
    });

    it('enforces writableParams on navigate', async () => {
        const registered = installFakeModelContext();
        new PortalWebMcp(fakeCtx(), { writableParams: ['gene_list'] }).start();
        const navTool = registered.find(t => t.name === 'navigate');
        await expect(
            navTool.execute({ params: { cancer_study_list: 'x' } })
        ).rejects.toThrow(/not writable/);
        // allowed param passes
        await expect(
            navTool.execute({ params: { gene_list: 'TP53' } })
        ).resolves.toContain('href');
    });
});
