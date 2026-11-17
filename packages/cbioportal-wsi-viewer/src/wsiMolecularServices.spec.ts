import { getSimplifiedMutationType } from './wsiMolecularServices';
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

    it('lower-cases mutation types when the host provides no molecular services', () => {
        configureRuntime();

        expect(getSimplifiedMutationType('Missense')).toBe('missense');
    });

    it('delegates to the host molecular services', () => {
        configureRuntime({
            getSimplifiedMutationType: () => 'frameshift',
        });

        expect(getSimplifiedMutationType('Frame_Shift_Del')).toBe('frameshift');
    });
});
