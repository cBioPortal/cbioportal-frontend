import { EvidenceType, IOncoKbData } from 'cbioportal-frontend-commons';
import {
    EnsemblFilter,
    EnsemblTranscript,
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
    MyVariantInfo,
    PfamDomain,
    PostTranslationalModification,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import { CancerGene, OncoKbAPI } from 'oncokb-ts-api-client';
import request from 'superagent';

import { Mutation } from '../model/Mutation';
import { AggregatedHotspots, Hotspot } from './CancerHotspot';

export interface MutationMapperDataFetcher {
    fetchSwissProtAccession(entrezGeneId: number): Promise<any>;
    fetchUniprotId(swissProtAccession: string): Promise<string>;
    fetchMutationAlignerLink(pfamDomainId: string): Promise<request.Response>;
    fetchPfamDomainData(
        pfamAccessions: string[],
        client?: GenomeNexusAPI
    ): Promise<PfamDomain[]>;
    fetchVariantAnnotationsIndexedByGenomicLocation(
        mutations: Partial<Mutation>[],
        fields: string[],
        isoformOverrideSource: string,
        client?: GenomeNexusAPI
    ): Promise<{ [genomicLocation: string]: VariantAnnotation }>;
    fetchMyVariantInfoAnnotationsIndexedByGenomicLocation(
        mutations: Partial<Mutation>[],
        isoformOverrideSource: string,
        client?: GenomeNexusAPI
    ): Promise<{ [genomicLocation: string]: MyVariantInfo }>;
    fetchCanonicalTranscriptWithFallback(
        hugoSymbol: string,
        isoformOverrideSource: string,
        allTranscripts: EnsemblTranscript[] | undefined,
        client?: GenomeNexusAPI
    ): Promise<EnsemblTranscript | undefined>;
    fetchCanonicalTranscript(
        hugoSymbol: string,
        isoformOverrideSource: string,
        client?: GenomeNexusAPI
    ): Promise<EnsemblTranscript>;
    fetchEnsemblTranscriptsByEnsemblFilter(
        ensemblFilter: Partial<EnsemblFilter>,
        client?: GenomeNexusAPI
    ): Promise<EnsemblTranscript[] | undefined>;
    fetchPtmData(
        ensemblId: string,
        client?: GenomeNexusAPI
    ): Promise<PostTranslationalModification[]>;
    fetchCancerHotspotData(
        ensemblId: string,
        client?: GenomeNexusAPIInternal
    ): Promise<Hotspot[]>;
    fetchAggregatedHotspotsData(
        mutations: Mutation[],
        client?: GenomeNexusAPIInternal
    ): Promise<AggregatedHotspots[]>;
    fetchOncoKbCancerGenes(client?: OncoKbAPI): Promise<CancerGene[]>;
    fetchOncoKbData(
        mutations: Mutation[],
        annotatedGenes: { [entrezGeneId: number]: boolean } | Error,
        getTumorType: (mutation: Mutation) => string,
        getEntrezGeneId: (mutation: Mutation) => number,
        evidenceTypes?: EvidenceType[],
        client?: OncoKbAPI
    ): Promise<IOncoKbData | Error>;
}

export default MutationMapperDataFetcher;
