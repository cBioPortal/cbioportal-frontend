import {
    getCivicCnaVariants,
    getOncoKbApiUrl,
    getSimplifiedMutationType,
    getWsiOncoKbClient,
    isWsiCivicEnabled,
    isWsiOncoKbEnabled,
} from './wsiMolecularServices';
import {
    configureWsiViewerRuntime,
    resetWsiViewerRuntime,
    WsiMolecularServices,
} from './wsiViewerConfig';

function configureRuntime(molecular?: WsiMolecularServices) {
    configureWsiViewerRuntime({
        buildApiUrl: (path: string) => `/${path}`,
        molecular,
    });
}

describe('wsiMolecularServices', () => {
    afterEach(() => resetWsiViewerRuntime());

    it('disables annotations when the host provides no molecular services', () => {
        configureRuntime();

        expect(isWsiOncoKbEnabled()).toBe(false);
        expect(isWsiCivicEnabled()).toBe(false);
        expect(getOncoKbApiUrl()).toBe('');
        expect(() => getWsiOncoKbClient()).toThrow(/not configured/);
        expect(getCivicCnaVariants(2, 'ERBB2', {})).toEqual({});
        expect(getSimplifiedMutationType('Missense')).toBe('missense');
    });

    it('delegates to the host molecular services', () => {
        const client = {} as ReturnType<
            WsiMolecularServices['getOncoKbClient']
        >;
        const getCivicCnaVariantsMock = jest.fn(() => ({
            ERBB2: { id: 1 } as any,
        }));
        configureRuntime({
            showOncoKb: true,
            showCivic: true,
            getOncoKbApiUrl: () => 'https://portal.example/proxy/oncokb',
            getOncoKbClient: () => client,
            getCivicCnaVariants: getCivicCnaVariantsMock,
            getSimplifiedMutationType: () => 'frameshift',
        });

        expect(isWsiOncoKbEnabled()).toBe(true);
        expect(isWsiCivicEnabled()).toBe(true);
        expect(getOncoKbApiUrl()).toBe('https://portal.example/proxy/oncokb');
        expect(getWsiOncoKbClient()).toBe(client);
        expect(getCivicCnaVariants(2, 'ERBB2', {})).toEqual({
            ERBB2: { id: 1 },
        });
        expect(getCivicCnaVariantsMock).toHaveBeenCalledWith(2, 'ERBB2', {});
        expect(getSimplifiedMutationType('Frame_Shift_Del')).toBe('frameshift');
    });
});
