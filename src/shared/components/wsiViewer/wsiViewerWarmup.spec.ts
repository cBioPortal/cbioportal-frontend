import { warmInitialWsiSlide } from './wsiViewerWarmup';
import { PatientHierarchy } from './wsiViewerTypes';

const mockPreloadOpenSeadragon = jest.fn();
const mockEnsureWsiPreconnect = jest.fn();
const mockFetchPatientHierarchyReadOnly = jest.fn();
const mockPreloadSlideMetadata = jest.fn();

jest.mock('./wsiOpenSeadragonLoader', () => ({
    preloadOpenSeadragon: () => mockPreloadOpenSeadragon(),
}));

jest.mock('./wsiNetworkWarmup', () => ({
    ensureWsiPreconnect: (...args: unknown[]) => mockEnsureWsiPreconnect(...args),
}));

jest.mock('./wsiHierarchyFetchCache', () => ({
    fetchPatientHierarchyReadOnly: (...args: unknown[]) =>
        mockFetchPatientHierarchyReadOnly(...args),
}));

jest.mock('./wsiMetadataFetchCache', () => ({
    preloadSlideMetadata: (...args: unknown[]) => mockPreloadSlideMetadata(...args),
}));

function makeHierarchy(): PatientHierarchy {
    return {
        patient_id: 'P-1',
        samples: [
            {
                sample_id: 'S-1',
                cancer_type: '',
                cancer_type_detailed: '',
                oncotree_code: '',
                primary_site: '',
                sample_type: 'Primary',
                parts: [
                    {
                        part_number: '1',
                        part_designator: 'A',
                        part_type: 'Resection',
                        part_description: 'Alpha',
                        subspecialty: 'GI',
                        path_dx_title: 'TEST',
                        blocks: [
                            {
                                block_number: '1',
                                block_label: 'A1',
                                slides: [
                                    {
                                        image_id: 'slide-1',
                                        stain_name: 'H&E',
                                        stain_group: 'Histology',
                                        is_hne: true,
                                        is_ihc: false,
                                        magnification: '20x',
                                        file_size_bytes: '100000000',
                                        can_serve_tiles: true,
                                        barcode: 'A',
                                        block_label: 'A1',
                                        block_number: '1',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                sample_id: 'S-2',
                cancer_type: '',
                cancer_type_detailed: '',
                oncotree_code: '',
                primary_site: '',
                sample_type: 'Metastasis',
                parts: [
                    {
                        part_number: '2',
                        part_designator: 'B',
                        part_type: 'Biopsy',
                        part_description: 'Beta',
                        subspecialty: 'GI',
                        path_dx_title: 'TEST',
                        blocks: [
                            {
                                block_number: '2',
                                block_label: 'B1',
                                slides: [
                                    {
                                        image_id: 'slide-2',
                                        stain_name: 'IHC',
                                        stain_group: 'IHC',
                                        is_hne: false,
                                        is_ihc: true,
                                        magnification: '20x',
                                        file_size_bytes: '100000000',
                                        can_serve_tiles: true,
                                        barcode: 'B',
                                        block_label: 'B1',
                                        block_number: '2',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

describe('wsiViewerWarmup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetchPatientHierarchyReadOnly.mockResolvedValue(makeHierarchy());
        mockPreloadSlideMetadata.mockResolvedValue(undefined);
    });

    it('warms the selected initial slide metadata after preconnect and OSD preload', async () => {
        await warmInitialWsiSlide({
            tileServerUrl: 'https://tiles.example.org',
            hierarchyUrl: 'https://tiles.example.org/patient/P-1',
            preferredSlideId: 'slide-2',
            stainFilter: 'all',
        });

        expect(mockEnsureWsiPreconnect).toHaveBeenCalledWith(
            'https://tiles.example.org'
        );
        expect(mockPreloadOpenSeadragon).toHaveBeenCalled();
        expect(mockFetchPatientHierarchyReadOnly).toHaveBeenCalledWith(
            'https://tiles.example.org/patient/P-1'
        );
        expect(mockPreloadSlideMetadata).toHaveBeenCalledWith(
            'https://tiles.example.org',
            'slide-2'
        );
    });

    it('respects allowed sample filtering when choosing the warmup slide', async () => {
        await warmInitialWsiSlide({
            tileServerUrl: 'https://tiles.example.org',
            hierarchyUrl: 'https://tiles.example.org/patient/P-1',
            allowedSampleIds: ['S-1'],
            preferredSlideId: 'slide-2',
            stainFilter: 'all',
        });

        expect(mockPreloadSlideMetadata).toHaveBeenCalledWith(
            'https://tiles.example.org',
            'slide-1'
        );
    });

    it('does not mutate the cached hierarchy when filtering allowed samples', async () => {
        const hierarchy = makeHierarchy();
        mockFetchPatientHierarchyReadOnly.mockResolvedValue(hierarchy);

        await warmInitialWsiSlide({
            tileServerUrl: 'https://tiles.example.org',
            hierarchyUrl: 'https://tiles.example.org/patient/P-1',
            allowedSampleIds: ['S-1'],
            stainFilter: 'all',
        });

        expect(hierarchy.samples.map(sample => sample.sample_id)).toEqual([
            'S-1',
            'S-2',
        ]);
    });
});
