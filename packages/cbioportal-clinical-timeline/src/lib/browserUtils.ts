/**
 * Safely gets the browser window object or a mock in non-browser environments
 * @returns The window object or a minimal mock
 */
export function getBrowserWindow(): Window & typeof globalThis {
    if (typeof window !== 'undefined') {
        return window;
    }

    // Return a minimal mock for non-browser environments
    return {
        location: {
            href: '',
            hostname: '',
            pathname: '',
            origin: '',
        },
        document: {
            createElement: () => ({}),
            body: {},
        },
        navigator: {
            userAgent: '',
        },
        open: () => null,
        innerWidth: 1024,
        innerHeight: 768,
        outerWidth: 1024,
        outerHeight: 768,
    } as any;
}
