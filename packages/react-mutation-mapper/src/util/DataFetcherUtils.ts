import { cachePostMethodsOnClient } from 'cbioportal-frontend-commons';
import {
    indexAnnotationsByGenomicLocation,
    IOncoKbData,
    Mutation,
    uniqueGenomicLocations,
} from 'cbioportal-utils';
import {
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';
import { OncoKbAPI, OncoKBInfo } from 'oncokb-ts-api-client';
import _ from 'lodash';

export const DEFAULT_MUTATION_ALIGNER_URL_TEMPLATE =
    'http://mutationaligner.org/api/domains/<%= pfamDomainId %>?metadata=true';
export const DEFAULT_MUTATION_ALIGNER_PROXY_URL_TEMPLATE =
    'https://www.cbioportal.org/proxy/mutationaligner.org/api/domains/<%= pfamDomainId %>?metadata=true';
export const DEFAULT_MY_GENE_URL_TEMPLATE =
    'https://mygene.info/v3/gene/<%= entrezGeneId %>?fields=uniprot';
export const DEFAULT_UNIPROT_ID_URL_TEMPLATE =
    'https://www.uniprot.org/uniprot/?query=accession:<%= swissProtAccession %>&format=tab&columns=entry+name';
export const DEFAULT_GENOME_NEXUS_URL = 'https://www.genomenexus.org/';

// The legacy instance does not require an authentication but the data will not be update.
export const DEFAULT_ONCO_KB_URL = 'https://legacy.oncokb.org/';
export const ONCOKB_DEFAULT_DATA: IOncoKbData = {
    indicatorMap: {},
};

// Set the default to false since most of the instances are not public instance.
// The only one we have right now is public.api.oncokb.org
export const USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB = false;

export const ONCOKB_DEFAULT_INFO: OncoKBInfo = {
    apiVersion: 'v1.0.0',
    dataVersion: {
        version: 'v2.0',
        date: '12/19/2019',
    },
    levels: [],
    ncitVersion: '19.03d',
    oncoTreeVersion: 'oncotree_2019_12_01',
    publicInstance: USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB,
};

const DEFAULT_GENOME_NEXUS_CLIENT = initGenomeNexusClient();

export function getUrl(urlTemplate: string, templateVariables: any) {
    return _.template(urlTemplate)(templateVariables);
}

export async function fetchVariantAnnotationsByMutation(
    mutations: Partial<Mutation>[],
    fields: string[] = ['annotation_summary'],
    isoformOverrideSource: string = 'uniprot',
    client: Partial<GenomeNexusAPI> = DEFAULT_GENOME_NEXUS_CLIENT
) {
    const genomicLocations = uniqueGenomicLocations(mutations);

    return genomicLocations.length > 0 &&
        client.fetchVariantAnnotationByGenomicLocationPOST
        ? await client.fetchVariantAnnotationByGenomicLocationPOST({
              genomicLocations,
              fields,
              isoformOverrideSource,
          })
        : [];
}

export async function fetchVariantAnnotationsIndexedByGenomicLocation(
    mutations: Partial<Mutation>[],
    fields: string[] = ['annotation_summary'],
    isoformOverrideSource: string = 'uniprot',
    client: Partial<GenomeNexusAPI> = DEFAULT_GENOME_NEXUS_CLIENT
) {
    const variantAnnotations = await fetchVariantAnnotationsByMutation(
        mutations,
        fields,
        isoformOverrideSource,
        client
    );
    return indexAnnotationsByGenomicLocation(variantAnnotations);
}

export function initGenomeNexusClient(
    genomeNexusUrl?: string,
    cachePostMethods?: boolean,
    apiCacheLimit?: number
): GenomeNexusAPI {
    const client = new GenomeNexusAPI(
        genomeNexusUrl || DEFAULT_GENOME_NEXUS_URL
    );

    if (cachePostMethods) {
        cachePostMethodsOnClient(GenomeNexusAPI, [], /POST$/, apiCacheLimit);
    }

    return client;
}

export function initGenomeNexusInternalClient(
    genomeNexusUrl?: string,
    cachePostMethods?: boolean,
    apiCacheLimit?: number
): GenomeNexusAPIInternal {
    const client = new GenomeNexusAPIInternal(
        genomeNexusUrl || DEFAULT_GENOME_NEXUS_URL
    );

    if (cachePostMethods) {
        cachePostMethodsOnClient(
            GenomeNexusAPIInternal,
            [],
            /POST$/,
            apiCacheLimit
        );
    }

    return client;
}

export function initOncoKbClient(
    oncoKbUrl?: string,
    cachePostMethods?: boolean,
    apiCacheLimit?: number
): OncoKbAPI {
    const client = new OncoKbAPI(oncoKbUrl || DEFAULT_ONCO_KB_URL);

    if (cachePostMethods) {
        cachePostMethodsOnClient(OncoKbAPI, [], undefined, apiCacheLimit);
    }

    return client;
}
