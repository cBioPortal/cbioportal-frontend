import * as React from 'react';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import {
    indexHotspots,
    is3dHotspot,
    isLinearClusterHotspot,
    Mutation as UtilsMutation,
} from 'cbioportal-utils';
import { DiscreteCopyNumberData, Mutation } from 'cbioportal-ts-api-client';
import {
    WsiHotspotFlags,
    WsiHotspotQuery,
    WsiMolecularServices,
    WsiViewerConfig,
    WsiViewerProps,
} from 'cbioportal-wsi-viewer';
import { GenomeNexusAPIInternal } from 'genome-nexus-ts-api-client';
import { getServerConfig } from 'config/config';
import {
    buildCBioPortalAPIUrl,
    buildCBioPortalPageUrl,
    getOncoKbApiUrl,
} from 'shared/api/urls';
import { getWsiOncoKbClient } from 'shared/api/wsiOncoKbClientInstance';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { filterMutationsOnNonHotspotGenes } from 'shared/lib/CancerHotspotsUtils';
import { getCivicCNAVariants } from 'shared/lib/CivicUtils';
import { uniqueGenomicLocations } from 'shared/lib/MutationUtils';
import { getGenomeNexusUrl } from 'shared/lib/StoreUtils';
import { getSimplifiedMutationType } from 'shared/lib/oql/AccessorsForOqlFilter';
import { useWsiClinicalData, WsiPatientClinicalData } from './wsiClinicalRows';

const WSI_OSD_PREFIX_URL = '/reactapp/osd-images/';

function renderWsiLoading() {
    return <LoadingIndicator isLoading={true} center={true} size="big" />;
}

/**
 * The mutations' Cancer Hotspots flags, as the patient view's mutation table
 * shows them: recurrent (single residue, indel or splice) and 3D, looked up
 * in the study reference genome's Genome Nexus.
 */
export async function fetchWsiPortalHotspots(
    queries: ReadonlyArray<WsiHotspotQuery>,
    referenceGenome: string | null,
    clientFor: (url: string) => GenomeNexusAPIInternal = url =>
        new GenomeNexusAPIInternal(url)
): Promise<WsiHotspotFlags[]> {
    const mutations = queries.map(
        query =>
            (({
                gene: { hugoGeneSymbol: query.gene },
                mutationType: query.mutationType,
                chr: query.genomicLocation.chromosome,
                startPosition: query.genomicLocation.start,
                endPosition: query.genomicLocation.end,
                referenceAllele: query.genomicLocation.referenceAllele,
                variantAllele: query.genomicLocation.variantAllele,
            } as unknown) as Mutation)
    );
    const candidates = filterMutationsOnNonHotspotGenes(mutations);
    if (candidates.length === 0) {
        return queries.map(() => ({ recurrent: false, threeD: false }));
    }
    const url = getGenomeNexusUrl([
        { referenceGenome: referenceGenome || '' },
    ] as Parameters<typeof getGenomeNexusUrl>[0]);
    const index = indexHotspots(
        await clientFor(url).fetchHotspotAnnotationByGenomicLocationPOST({
            genomicLocations: uniqueGenomicLocations(candidates),
        })
    );
    return mutations.map(mutation => ({
        recurrent: isLinearClusterHotspot(
            (mutation as unknown) as UtilsMutation,
            index
        ),
        threeD: is3dHotspot((mutation as unknown) as UtilsMutation, index),
    }));
}

/** OncoKB, CIViC and hotspot annotation services, as configured for the portal. */
export function buildWsiMolecularServices(): WsiMolecularServices {
    return {
        // Read when used: custom JS loaded after startup can change them.
        showOncoKb: () => !!getServerConfig().show_oncokb,
        showCivic: () => !!getServerConfig().show_civic,
        getOncoKbApiUrl,
        getOncoKbClient: getWsiOncoKbClient,
        getCivicCnaVariants: (alteration, geneSymbol, civicVariants) =>
            getCivicCNAVariants(
                [({ alteration } as unknown) as DiscreteCopyNumberData],
                geneSymbol,
                civicVariants
            ),
        getSimplifiedMutationType,
        showHotspots: () => !!getServerConfig().show_hotspot,
        getHotspots: (queries, referenceGenome) =>
            fetchWsiPortalHotspots(queries, referenceGenome),
    };
}

/** Viewer services from the portal configuration, installed at startup. */
export function buildWsiViewerConfig(): WsiViewerConfig {
    return {
        buildApiUrl: (path: string) => buildCBioPortalAPIUrl(path),
        buildPageUrl: (path: string, query: Record<string, string>) =>
            buildCBioPortalPageUrl(path, query),
        osdPrefixUrl: WSI_OSD_PREFIX_URL,
        molecular: buildWsiMolecularServices(),
    };
}

/**
 * Subject that scopes the viewer caches: the signed-in user name, else the
 * configured display name, else the anonymous user.
 */
export function wsiAuthScope(userName?: string): string {
    return userName || getServerConfig().user_display_name || 'anonymousUser';
}

// The viewer is its own async chunk, and OpenSeadragon another one loaded on
// first slide open: most patient pages have no slides.
export const LazyWsiViewer = React.lazy(() => {
    // The project TypeScript module target predates dynamic import syntax;
    // rspack still emits this as an async chunk.
    // @ts-ignore
    return import('cbioportal-wsi-viewer/viewer');
});

export type AppWsiViewerProps = Omit<
    WsiViewerProps,
    | 'authScope'
    | 'showDownload'
    | 'renderLoading'
    | 'clinicalRows'
    | 'sampleClinicalData'
> & {
    /** Signed-in user name, when the page knows it. */
    userName?: string;
    /**
     * The patient's clinical data for the sidebar, when the page has loaded
     * it (`null` while loading); fetched by the viewer when unset.
     */
    clinicalData?: WsiPatientClinicalData | null;
};

/** The package viewer configured for this portal, loaded lazily. */
export function AppWsiViewer({
    userName,
    clinicalData,
    ...viewerProps
}: AppWsiViewerProps) {
    // The viewer reads its sample attributes from the same data.
    const clinical = useWsiClinicalData(
        viewerProps.studyId,
        viewerProps.patientId,
        clinicalData
    );
    return (
        <React.Suspense
            fallback={
                <div role="status" data-testid="wsi-viewer-loading">
                    Loading pathology slides…
                </div>
            }
        >
            <LazyWsiViewer
                {...viewerProps}
                authScope={wsiAuthScope(userName)}
                showDownload={
                    getServerConfig().skin_hide_download_controls ===
                    DownloadControlOption.SHOW_ALL
                }
                renderLoading={renderWsiLoading}
                clinicalRows={clinical?.rows}
                sampleClinicalData={clinical ? clinical.sampleData : null}
            />
        </React.Suspense>
    );
}
