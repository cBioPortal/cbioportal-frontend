import _ from "lodash";
import request from "superagent";
import Response = request.Response;

import {generatePartialEvidenceQuery, generateQueryVariant} from "cbioportal-frontend-commons";

import GenomeNexusAPI, {EnsemblFilter} from "../generated/GenomeNexusAPI";
import GenomeNexusAPIInternal, {GenomicLocation} from "../generated/GenomeNexusAPIInternal";
import OncoKbAPI, {EvidenceQueries, Query} from "../generated/OncoKbAPI";

import {AggregatedHotspots, Hotspot} from "../model/CancerHotspot";
import {EnsemblTranscript} from "../model/EnsemblTranscript";
import {Mutation} from "../model/Mutation";
import {CancerGene, IOncoKbData} from "../model/OncoKb";
import {PostTranslationalModification} from "../model/PostTranslationalModification";
import {uniqueGenomicLocations} from "../util/MutationUtils";

export interface MutationMapperDataFetcherConfig {
    myGeneUrlTemplate?: string;
    uniprotIdUrlTemplate?: string;
    mutationAlignerUrlTemplate?: string;
    genomeNexusUrl?: string;
    oncoKbUrl?: string;
}

const DEFAULT_MUTATION_ALIGNER_URL_TEMPLATE = "https://www.cbioportal.org/getMutationAligner.json?pfamAccession=<%= pfamDomainId %>";
const DEFAULT_MY_GENE_URL_TEMPLATE = "https://mygene.info/v3/gene/<%= entrezGeneId %>?fields=uniprot";
const DEFAULT_UNIPROT_ID_URL_TEMPLATE = "https://www.uniprot.org/uniprot/?query=accession:<%= swissProtAccession %>&format=tab&columns=entry+name";
const DEFAULT_GENOME_NEXUS_URL = "https://www.genomenexus.org/";
const DEFAULT_ONCO_KB_URL = "https://www.oncokb.org/";
export const ONCOKB_DEFAULT_DATA: IOncoKbData = {
    indicatorMap : {}
};

function getUrl(urlTemplate: string, templateVariables: any) {
    return _.template(urlTemplate)(templateVariables);
}

export class DefaultMutationMapperDataFetcher
{
    private oncoKbClient: OncoKbAPI;
    private genomeNexusClient: GenomeNexusAPI;
    private genomeNexusInternalClient: GenomeNexusAPIInternal;

    constructor(
        private config: MutationMapperDataFetcherConfig,
        genomeNexusClient?: GenomeNexusAPI,
        genomeNexusInternalClient?: GenomeNexusAPIInternal,
        oncoKbClient?: OncoKbAPI
    ) {
        this.genomeNexusClient = genomeNexusClient ||
            new GenomeNexusAPI(config.genomeNexusUrl || DEFAULT_GENOME_NEXUS_URL);

        this.genomeNexusInternalClient = genomeNexusInternalClient ||
            new GenomeNexusAPIInternal(config.genomeNexusUrl || DEFAULT_GENOME_NEXUS_URL);

        this.oncoKbClient = oncoKbClient ||
            new OncoKbAPI(config.oncoKbUrl || DEFAULT_ONCO_KB_URL);
    }

    public async fetchSwissProtAccession(entrezGeneId: number)
    {
        const myGeneData:Response = await request.get(
            getUrl(this.config.myGeneUrlTemplate || DEFAULT_MY_GENE_URL_TEMPLATE,
                {entrezGeneId}));
        return JSON.parse(myGeneData.text).uniprot["Swiss-Prot"];
    }

    public async fetchUniprotId(swissProtAccession: string)
    {
        const uniprotData:Response = await request.get(
            getUrl(this.config.uniprotIdUrlTemplate || DEFAULT_UNIPROT_ID_URL_TEMPLATE,
                {swissProtAccession}));
        return uniprotData.text.split("\n")[1];
    }

    public fetchMutationAlignerLink(pfamDomainId: string)
    {
        return request.get(getUrl(
            this.config.mutationAlignerUrlTemplate || DEFAULT_MUTATION_ALIGNER_URL_TEMPLATE,
            {pfamDomainId}));
    }

    public async fetchPfamDomainData(pfamAccessions: string[],
                                     client:GenomeNexusAPI = this.genomeNexusClient)
    {
        return await client.fetchPfamDomainsByPfamAccessionPOST({
            pfamAccessions: pfamAccessions
        });
    }

    /*
     * Gets the canonical transcript. If there is none pick the transcript with max
     * length.
     */
    public async fetchCanonicalTranscriptWithFallback(hugoSymbol:string,
                                                      isoformOverrideSource: string,
                                                      allTranscripts: EnsemblTranscript[] | undefined,
                                                      client: GenomeNexusAPI = this.genomeNexusClient)
    {
        return this.fetchCanonicalTranscript(hugoSymbol, isoformOverrideSource, client).catch(() => {
            // get transcript with max protein length in given list of all transcripts
            const transcript = _.maxBy(allTranscripts, (t:EnsemblTranscript) => t.proteinLength);
            return transcript? transcript : undefined;
        });
    }

    public async fetchCanonicalTranscript(hugoSymbol: string,
                                          isoformOverrideSource: string,
                                          client: GenomeNexusAPI = this.genomeNexusClient)
    {
        return await client.fetchCanonicalEnsemblTranscriptByHugoSymbolGET({
            hugoSymbol, isoformOverrideSource
        });
    }

    public async fetchEnsemblTranscriptsByEnsemblFilter(ensemblFilter: Partial<EnsemblFilter>,
                                                        client: GenomeNexusAPI = this.genomeNexusClient)
    {

        return await client.fetchEnsemblTranscriptsByEnsemblFilterPOST({ensemblFilter: Object.assign(
                // set default to empty array
                {
                    'geneIds': [],
                    'hugoSymbols': [],
                    'proteinIds': [],
                    'transcriptIds': [],
                }, ensemblFilter)});
    }

    public fetchPtmData(ensemblId: string,
                        client:GenomeNexusAPI = this.genomeNexusClient): Promise<PostTranslationalModification[]>
    {
        if (ensemblId)
        {
            return client.fetchPostTranslationalModificationsGET({
                ensemblTranscriptId: ensemblId});
        }
        else {
            return Promise.resolve([]);
        }
    }

    public fetchCancerHotspotData(ensemblId: string,
                                  client:GenomeNexusAPIInternal = this.genomeNexusInternalClient): Promise<Hotspot[]>
    {
        if (ensemblId)
        {
            return client.fetchHotspotAnnotationByTranscriptIdGET({
                transcriptId: ensemblId});
        }
        else {
            return Promise.resolve([]);
        }
    }

    public fetchAggregatedHotspotsData(mutations: Mutation[],
                                       client: GenomeNexusAPIInternal = this.genomeNexusInternalClient): Promise<AggregatedHotspots[]>
    {
        // TODO filter out non-hotspot genes

        if (mutations.length === 0) {
            return Promise.resolve([]);
        }

        const genomicLocations: GenomicLocation[] = uniqueGenomicLocations(mutations);

        return client.fetchHotspotAnnotationByGenomicLocationPOST({genomicLocations: genomicLocations});
    }

    public fetchOncoKbCancerGenes(client: OncoKbAPI = this.oncoKbClient): Promise<CancerGene[]>
    {
        return client.utilsCancerGeneListGetUsingGET({});
    }

    public async fetchOncoKbData(mutations: Mutation[],
                                 annotatedGenes:{[entrezGeneId:number]:boolean} | Error,
                                 getTumorType: (mutation: Mutation) => string,
                                 getEntrezGeneId: (mutation: Mutation) => number,
                                 evidenceTypes?: string,
                                 client: OncoKbAPI = this.oncoKbClient): Promise<IOncoKbData | Error>
    {
        if (annotatedGenes instanceof Error) {
            return new Error();
        }
        else if (mutations.length === 0) {
            return ONCOKB_DEFAULT_DATA;
        }

        const mutationsToQuery = _.filter(mutations, m => !!annotatedGenes[getEntrezGeneId(m)]);
        const queryVariants = _.uniqBy(_.map(mutationsToQuery, (mutation: Mutation) => {
            return generateQueryVariant(
                // mutation.gene.entrezGeneId,
                getEntrezGeneId(mutation),
                // cancerTypeForOncoKb(mutation.uniqueSampleKey, uniqueSampleKeyToTumorType),
                getTumorType(mutation),
                mutation.proteinChange,
                mutation.mutationType,
                mutation.proteinPosStart,
                mutation.proteinPosEnd) as Query;
        }), "id");

        return this.queryOncoKbData(queryVariants, evidenceTypes, client);
    }

    public async queryOncoKbData(queryVariants: Query[],
                                 evidenceTypes?: string,
                                 client: OncoKbAPI = this.oncoKbClient)
    {
        const oncokbSearch = await client.searchPostUsingPOST({
            body: {
                ...generatePartialEvidenceQuery(evidenceTypes),
                queries: queryVariants
            } as EvidenceQueries
        });

        return {
            // generateIdToIndicatorMap(oncokbSearch)
            indicatorMap: _.keyBy(oncokbSearch, indicator => indicator.query.id)
        };
    }
}

export default DefaultMutationMapperDataFetcher;
