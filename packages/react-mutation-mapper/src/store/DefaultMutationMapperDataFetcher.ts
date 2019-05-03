import _ from "lodash";
import request from "superagent";
import Response = request.Response;

import GenomeNexusAPI, {EnsemblFilter} from "../generated/GenomeNexusAPI";

import {EnsemblTranscript} from "../model/EnsemblTranscript";

export interface MutationMapperDataFetcherConfig {
    myGeneUrlTemplate?: string;
    uniprotIdUrlTemplate?: string;
    mutationAlignerUrlTemplate?: string;
    genomeNexusUrl?: string;
}

const DEFAULT_MUTATION_ALIGNER_URL_TEMPLATE = "https://www.cbioportal.org/getMutationAligner.json?pfamAccession=<%= pfamDomainId %>";
const DEFAULT_MY_GENE_URL_TEMPLATE = "https://mygene.info/v3/gene/<%= entrezGeneId %>?fields=uniprot";
const DEFAULT_UNIPROT_ID_URL_TEMPLATE = "https://www.uniprot.org/uniprot/?query=accession:<%= swissProtAccession %>&format=tab&columns=entry+name";
const DEFAULT_GENOME_NEXUS_URL = "https://www.genomenexus.org/";

function getUrl(urlTemplate: string, templateVariables: any) {
    return _.template(urlTemplate)(templateVariables);
}

export class DefaultMutationMapperDataFetcher
{
    private genomeNexusClient: GenomeNexusAPI;

    constructor(
        private config: MutationMapperDataFetcherConfig,
        genomeNexusClient?: GenomeNexusAPI
    ) {
        this.genomeNexusClient = genomeNexusClient ||
            new GenomeNexusAPI(config.genomeNexusUrl || DEFAULT_GENOME_NEXUS_URL);
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
}
