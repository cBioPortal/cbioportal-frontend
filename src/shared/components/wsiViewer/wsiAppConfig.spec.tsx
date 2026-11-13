/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import {
    AppWsiViewer,
    buildWsiMolecularServices,
    buildWsiViewerConfig,
    fetchWsiPortalHotspots,
    wsiAuthScope,
} from './wsiAppConfig';

const mockServerConfig: Record<string, unknown> = {};
const mockWsiViewer = jest.fn((_props: Record<string, unknown>) => null);

jest.mock('config/config', () => ({
    getServerConfig: () => mockServerConfig,
}));

jest.mock('shared/api/urls', () => ({
    buildCBioPortalAPIUrl: (path: string) =>
        `https://portal.example/beta/${path}`,
    getOncoKbApiUrl: () => 'https://portal.example/beta/proxy/oncokb',
}));

const mockOncoKbClient = {};
jest.mock('shared/api/wsiOncoKbClientInstance', () => ({
    getWsiOncoKbClient: () => mockOncoKbClient,
}));

const mockSampleData = [
    {
        sampleId: 'S-1',
        clinicalAttributeId: 'TMB_NONSYNONYMOUS',
        value: '8.2',
    },
];
jest.mock('./wsiClinicalRows', () => ({
    useWsiClinicalData: () => ({
        rows: [{ label: 'Sex', value: 'Female' }],
        sampleData: mockSampleData,
    }),
}));

jest.mock('cbioportal-wsi-viewer/viewer', () => ({
    __esModule: true,
    default: (props: Record<string, unknown>) => mockWsiViewer(props),
}));

describe('buildWsiViewerConfig', () => {
    beforeEach(() => {
        Object.keys(mockServerConfig).forEach(
            key => delete mockServerConfig[key]
        );
        mockServerConfig.skin_hide_download_controls = 'show';
    });

    it('builds portal API URLs and the host services', () => {
        const config = buildWsiViewerConfig();

        expect(config.buildApiUrl('api/resource-table/query/fetch')).toBe(
            'https://portal.example/beta/api/resource-table/query/fetch'
        );
        expect(config.osdPrefixUrl).toBe('/reactapp/osd-images/');
    });

    it('scopes caches by the user, the display name or the anonymous user', () => {
        mockServerConfig.user_display_name = 'display-user';
        expect(wsiAuthScope('user-a')).toBe('user-a');
        expect(wsiAuthScope()).toBe('display-user');

        delete mockServerConfig.user_display_name;
        expect(wsiAuthScope()).toBe('anonymousUser');
    });
});

describe('buildWsiMolecularServices', () => {
    beforeEach(() => {
        Object.keys(mockServerConfig).forEach(
            key => delete mockServerConfig[key]
        );
    });

    it('follows the portal OncoKB and CIViC settings when they are read', () => {
        const services = buildWsiMolecularServices();
        expect(services.showOncoKb()).toBe(false);
        expect(services.showCivic()).toBe(false);

        // Custom JS can change the settings after the services are built.
        mockServerConfig.show_oncokb = true;
        mockServerConfig.show_civic = true;

        expect(services.showOncoKb()).toBe(true);
        expect(services.showCivic()).toBe(true);
        expect(services.getOncoKbApiUrl()).toBe(
            'https://portal.example/beta/proxy/oncokb'
        );
        expect(services.getOncoKbClient()).toBe(mockOncoKbClient);
        expect(buildWsiViewerConfig().molecular!.showOncoKb()).toBe(true);
    });

    it('follows the portal hotspot setting when it is read', () => {
        const services = buildWsiMolecularServices();
        expect(services.showHotspots!()).toBe(false);
        mockServerConfig.show_hotspot = true;
        expect(services.showHotspots!()).toBe(true);
        expect(services.getHotspots).toBeDefined();
    });

    it('resolves CIViC copy number variants and mutation types', () => {
        const amplification = { id: 1, name: 'AMPLIFICATION' } as any;
        const services = buildWsiMolecularServices();

        expect(
            services.getCivicCnaVariants(2, 'ERBB2', {
                ERBB2: { AMPLIFICATION: amplification },
            })
        ).toEqual({ ERBB2: amplification });
        expect(
            services.getCivicCnaVariants(-2, 'ERBB2', {
                ERBB2: { AMPLIFICATION: amplification },
            })
        ).toEqual({});
        expect(services.getSimplifiedMutationType('Frame_Shift_Del')).toBe(
            'frameshift'
        );
    });
});

describe('AppWsiViewer', () => {
    beforeEach(() => mockWsiViewer.mockClear());

    it('hides the download control unless downloads are shown', async () => {
        mockServerConfig.skin_hide_download_controls = 'hide';

        await act(async () => {
            render(
                <AppWsiViewer
                    patientId="P-1"
                    studyId="study-1"
                    tileServerUrl="/wsi"
                    height={600}
                />
            );
        });

        expect(mockWsiViewer).toHaveBeenLastCalledWith(
            expect.objectContaining({ showDownload: false })
        );
    });

    it('loads the package viewer with the portal settings', async () => {
        mockServerConfig.skin_hide_download_controls = 'show';
        mockServerConfig.user_display_name = 'display-user';

        await act(async () => {
            render(
                <AppWsiViewer
                    userName="user-a"
                    patientId="P-1"
                    studyId="study-1"
                    tileServerUrl="/wsi"
                    height={600}
                />
            );
        });

        expect(screen.queryByTestId('wsi-viewer-loading')).toBeNull();
        expect(mockWsiViewer).toHaveBeenLastCalledWith(
            expect.objectContaining({
                patientId: 'P-1',
                studyId: 'study-1',
                tileServerUrl: '/wsi',
                height: 600,
                authScope: 'user-a',
                showDownload: true,
                renderLoading: expect.any(Function),
                clinicalRows: [{ label: 'Sex', value: 'Female' }],
                sampleClinicalData: mockSampleData,
            })
        );
    });
});

describe('fetchWsiPortalHotspots', () => {
    const location = (start: number) => ({
        chromosome: '9',
        start,
        end: start,
        referenceAllele: 'C',
        variantAllele: 'T',
    });
    const query = (gene: string, start: number, mutationType?: string) => ({
        gene,
        mutationType,
        genomicLocation: location(start),
    });
    const aggregated = (start: number, types: string[]) => ({
        genomicLocation: location(start),
        hotspots: types.map(type => ({ type })),
    });

    beforeEach(() => {
        Object.keys(mockServerConfig).forEach(
            key => delete mockServerConfig[key]
        );
        mockServerConfig.genomenexus_url = 'https://gn37.example';
        mockServerConfig.genomenexus_url_grch38 = 'https://gn38.example';
    });

    it('flags recurrent and 3D hotspots as the mutation table does', async () => {
        const fetchHotspots = jest
            .fn()
            .mockResolvedValue([
                aggregated(100, ['single residue']),
                aggregated(200, ['3d']),
                aggregated(300, ['splice site']),
            ]);
        const clientFor = jest.fn(() => ({
            fetchHotspotAnnotationByGenomicLocationPOST: fetchHotspots,
        }));

        const flags = await fetchWsiPortalHotspots(
            [
                query('KRAS', 100, 'Missense_Mutation'),
                query('NOTCH1', 200, 'Missense_Mutation'),
                // A splice hotspot counts only for a splice mutation.
                query('KRAS', 300, 'Missense_Mutation'),
                query('KRAS', 300, 'Splice_Site'),
                query('KRAS', 400, 'Missense_Mutation'),
            ],
            'hg19',
            clientFor as any
        );

        expect(clientFor).toHaveBeenCalledWith('https://gn37.example');
        expect(flags).toEqual([
            { recurrent: true, threeD: false },
            { recurrent: false, threeD: true },
            { recurrent: false, threeD: false },
            { recurrent: true, threeD: false },
            { recurrent: false, threeD: false },
        ]);
    });

    it("uses the study genome's Genome Nexus", async () => {
        const clientFor = jest.fn(() => ({
            fetchHotspotAnnotationByGenomicLocationPOST: jest
                .fn()
                .mockResolvedValue([]),
        }));
        await fetchWsiPortalHotspots(
            [query('KRAS', 100)],
            'hg38',
            clientFor as any
        );
        expect(clientFor).toHaveBeenCalledWith('https://gn38.example');
    });

    it('makes no request for genes without hotspots', async () => {
        const clientFor = jest.fn();
        const flags = await fetchWsiPortalHotspots(
            [query('NOT_A_HOTSPOT_GENE', 100)],
            'hg19',
            clientFor as any
        );
        expect(clientFor).not.toHaveBeenCalled();
        expect(flags).toEqual([{ recurrent: false, threeD: false }]);
    });
});
