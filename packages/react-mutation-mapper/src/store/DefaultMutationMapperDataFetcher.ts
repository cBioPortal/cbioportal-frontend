import _ from 'lodash';
import request from 'superagent';
import Response = request.Response;

import {
    EnsemblFilter,
    generatePartialEvidenceQuery,
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
    GenomicLocation,
    OncoKbAPI,
    Query,
    EvidenceQueries,
    VariantAnnotation,
    MyVariantInfo,
} from 'cbioportal-frontend-commons';

import { AggregatedHotspots, Hotspot } from '../model/CancerHotspot';
import { EnsemblTranscript } from '../model/EnsemblTranscript';
import { Mutation } from '../model/Mutation';
import { CancerGene, IOncoKbData } from '../model/OncoKb';
import { PfamDomain } from '../model/Pfam';
import { PostTranslationalModification } from '../model/PostTranslationalModification';
import {
    DEFAULT_MUTATION_ALIGNER_URL_TEMPLATE,
    DEFAULT_MY_GENE_URL_TEMPLATE,
    DEFAULT_UNIPROT_ID_URL_TEMPLATE,
    fetchVariantAnnotationsIndexedByGenomicLocation,
    getUrl,
    initGenomeNexusClient,
    initGenomeNexusInternalClient,
    initOncoKbClient,
    ONCOKB_DEFAULT_DATA,
} from '../util/DataFetcherUtils';
import { getMyVariantInfoAnnotationsFromIndexedVariantAnnotations } from '../util/VariantAnnotationUtils';
import { uniqueGenomicLocations } from '../util/MutationUtils';
import { getEvidenceQuery } from '../util/OncoKbUtils';

export interface MutationMapperDataFetcherConfig {
    myGeneUrlTemplate?: string;
    uniprotIdUrlTemplate?: string;
    mutationAlignerUrlTemplate?: string;
    cachePostMethodsOnClients?: boolean;
    apiCacheLimit?: number;
    genomeNexusUrl?: string;
    oncoKbUrl?: string;
}

export class DefaultMutationMapperDataFetcher {
    public oncoKbClient: OncoKbAPI;
    public genomeNexusClient: GenomeNexusAPI;
    public genomeNexusInternalClient: GenomeNexusAPIInternal;

    constructor(
        private config: MutationMapperDataFetcherConfig,
        genomeNexusClient?: Partial<GenomeNexusAPI>,
        genomeNexusInternalClient?: Partial<GenomeNexusAPIInternal>,
        oncoKbClient?: Partial<OncoKbAPI>
    ) {
        this.genomeNexusClient =
            (genomeNexusClient as GenomeNexusAPI) ||
            initGenomeNexusClient(
                config.genomeNexusUrl,
                config.cachePostMethodsOnClients,
                config.apiCacheLimit
            );
        this.genomeNexusInternalClient =
            (genomeNexusInternalClient as GenomeNexusAPIInternal) ||
            initGenomeNexusInternalClient(
                config.genomeNexusUrl,
                config.cachePostMethodsOnClients,
                config.apiCacheLimit
            );
        this.oncoKbClient =
            (oncoKbClient as OncoKbAPI) ||
            initOncoKbClient(
                config.oncoKbUrl,
                config.cachePostMethodsOnClients,
                config.apiCacheLimit
            );
    }

    public async fetchSwissProtAccession(entrezGeneId: number): Promise<any> {
        const myGeneData: Response = await request.get(
            getUrl(this.config.myGeneUrlTemplate || DEFAULT_MY_GENE_URL_TEMPLATE, { entrezGeneId })
        );
        return JSON.parse(myGeneData.text).uniprot['Swiss-Prot'];
    }

    public async fetchUniprotId(swissProtAccession: string): Promise<string> {
        const uniprotData: Response = await request.get(
            getUrl(this.config.uniprotIdUrlTemplate || DEFAULT_UNIPROT_ID_URL_TEMPLATE, {
                swissProtAccession,
            })
        );
        return uniprotData.text.split('\n')[1];
    }

    public fetchMutationAlignerLink(pfamDomainId: string): request.SuperAgentRequest {
        return request.get(
            getUrl(
                this.config.mutationAlignerUrlTemplate || DEFAULT_MUTATION_ALIGNER_URL_TEMPLATE,
                { pfamDomainId }
            )
        );
    }

    public async fetchPfamDomainData(
        pfamAccessions: string[],
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<PfamDomain[]> {
        return await client.fetchPfamDomainsByPfamAccessionPOST({
            pfamAccessions: pfamAccessions,
        });
    }

    public async fetchVariantAnnotationsIndexedByGenomicLocation(
        mutations: Partial<Mutation>[],
        fields: string[] = ['annotation_summary'],
        isoformOverrideSource: string = 'uniprot',
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<{ [genomicLocation: string]: VariantAnnotation }> {
        return await fetchVariantAnnotationsIndexedByGenomicLocation(
            mutations,
            fields,
            isoformOverrideSource,
            client
        );
    }

    public async fetchMyVariantInfoAnnotationsIndexedByGenomicLocation(
        mutations: Partial<Mutation>[],
        isoformOverrideSource: string = 'uniprot',
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<{ [genomicLocation: string]: MyVariantInfo }> {
        const indexedVariantAnnotations = await fetchVariantAnnotationsIndexedByGenomicLocation(
            mutations,
            ['my_variant_info'],
            isoformOverrideSource,
            client
        );

        return getMyVariantInfoAnnotationsFromIndexedVariantAnnotations(indexedVariantAnnotations);
    }

    /*
     * Gets the canonical transcript. If there is none pick the transcript with max length.
     */
    public async fetchCanonicalTranscriptWithFallback(
        hugoSymbol: string,
        isoformOverrideSource: string,
        allTranscripts: EnsemblTranscript[] | undefined,
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<EnsemblTranscript | undefined> {
        return this.fetchCanonicalTranscript(hugoSymbol, isoformOverrideSource, client).catch(
            () => {
                // get transcript with max protein length in given list of all transcripts
                const transcript = _.maxBy(
                    allTranscripts,
                    (t: EnsemblTranscript) => t.proteinLength
                );
                return transcript ? transcript : undefined;
            }
        );
    }

    public async fetchCanonicalTranscript(
        hugoSymbol: string,
        isoformOverrideSource: string,
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<EnsemblTranscript> {
        return await client.fetchCanonicalEnsemblTranscriptByHugoSymbolGET({
            hugoSymbol,
            isoformOverrideSource,
        });
    }

    public async fetchEnsemblTranscriptsByEnsemblFilter(
        ensemblFilter: Partial<EnsemblFilter>,
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<EnsemblTranscript[] | undefined> {
        return await client.fetchEnsemblTranscriptsByEnsemblFilterPOST({
            ensemblFilter: Object.assign(
                // set default to empty array
                {
                    geneIds: [],
                    hugoSymbols: [],
                    proteinIds: [],
                    transcriptIds: [],
                },
                ensemblFilter
            ),
        });
    }

    public fetchPtmData(
        ensemblId: string,
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<PostTranslationalModification[]> {
        if (ensemblId) {
            return client.fetchPostTranslationalModificationsGET({
                ensemblTranscriptId: ensemblId,
            });
        } else {
            return Promise.resolve([]);
        }
    }

    public fetchCancerHotspotData(
        ensemblId: string,
        client: GenomeNexusAPIInternal = this.genomeNexusInternalClient
    ): Promise<Hotspot[]> {
        if (ensemblId) {
            return client.fetchHotspotAnnotationByTranscriptIdGET({
                transcriptId: ensemblId,
            });
        } else {
            return Promise.resolve([]);
        }
    }

    public fetchAggregatedHotspotsData(
        mutations: Mutation[],
        client: GenomeNexusAPIInternal = this.genomeNexusInternalClient
    ): Promise<AggregatedHotspots[]> {
        // TODO filter out non-hotspot genes

        if (mutations.length === 0) {
            return Promise.resolve([]);
        }

        const genomicLocations: GenomicLocation[] = uniqueGenomicLocations(mutations);

        return client.fetchHotspotAnnotationByGenomicLocationPOST({
            genomicLocations: genomicLocations,
        });
    }

    public fetchOncoKbCancerGenes(client: OncoKbAPI = this.oncoKbClient): Promise<CancerGene[]> {
        return client.utilsCancerGeneListGetUsingGET_1({});
    }

    public async fetchOncoKbData(
        mutations: Mutation[],
        annotatedGenes: { [entrezGeneId: number]: boolean } | Error,
        getTumorType: (mutation: Mutation) => string,
        getEntrezGeneId: (mutation: Mutation) => number,
        evidenceTypes?: string,
        client: OncoKbAPI = this.oncoKbClient
    ): Promise<IOncoKbData | Error> {
        if (annotatedGenes instanceof Error) {
            return new Error();
        } else if (mutations.length === 0) {
            return ONCOKB_DEFAULT_DATA;
        }

        const mutationsToQuery = _.filter(mutations, m => !!annotatedGenes[getEntrezGeneId(m)]);
        const queryVariants = _.uniqBy(
            _.map(mutationsToQuery, (mutation: Mutation) => {
                return getEvidenceQuery(
                    mutation,
                    getEntrezGeneId, // mutation.gene.entrezGeneId
                    getTumorType // cancerTypeForOncoKb(mutation.uniqueSampleKey, uniqueSampleKeyToTumorType)
                ) as Query;
            }),
            'id'
        );

        return this.queryOncoKbData(queryVariants, evidenceTypes, client);
    }

    public async queryOncoKbData(
        queryVariants: Query[],
        evidenceTypes?: string,
        client: OncoKbAPI = this.oncoKbClient
    ) {
        const oncokbSearch = await client.searchPostUsingPOST({
            body: {
                ...generatePartialEvidenceQuery(evidenceTypes),
                queries: queryVariants,
            } as EvidenceQueries,
        });

        return {
            // generateIdToIndicatorMap(oncokbSearch)
            indicatorMap: _.keyBy(oncokbSearch, indicator => indicator.query.id),
        };
    }
}

export default DefaultMutationMapperDataFetcher;
