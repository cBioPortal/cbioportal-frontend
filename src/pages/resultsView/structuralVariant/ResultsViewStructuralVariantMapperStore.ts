import { computed, makeObservable } from 'mobx';
import { StructuralVariantExt } from 'shared/model/StructuralVariantExt';
import ResultViewStructuralVariantMapperDataStore from './ResultsViewStructuralVariantMapperDataStore';
import {
    CancerStudy,
    Gene,
    MolecularProfile,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import { IOncoKbData } from 'cbioportal-utils';
import { CancerGene } from 'oncokb-ts-api-client';
import {
    labelMobxPromises,
    MobxPromise,
    remoteData,
} from 'cbioportal-frontend-commons';
import {
    fetchCanonicalTranscripts,
    fetchEnsemblTranscriptsByEnsemblFilter,
} from 'shared/lib/StoreUtils';
import {
    Exon,
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';

export class ResultsViewStructuralVariantMapperStore {
    constructor(
        public gene: Gene,
        public studyIdToStudy: MobxPromise<{ [studyId: string]: CancerStudy }>,
        public molecularProfileIdToMolecularProfile: MobxPromise<{
            [molecularProfileId: string]: MolecularProfile;
        }>,
        public structuralVariants: StructuralVariantExt[],
        public uniqueSampleKeyToTumorType: {
            [uniqueSampleKey: string]: string;
        },
        public structuralVariantOncoKbData: MobxPromise<IOncoKbData | Error>,
        public oncoKbCancerGenes: MobxPromise<CancerGene[] | Error>,
        public usingPublicOncoKbInstance: boolean,
        protected genomenexusClient?: GenomeNexusAPI,
        protected genomenexusInternalClient?: GenomeNexusAPIInternal
    ) {
        makeObservable(this);
        labelMobxPromises(this);
    }

    readonly ensemblTranscriptsByTranscriptIds = remoteData(
        {
            invoke: async () => {
                // Collect all transcript id's from the structuralVariant data
                const transcriptIds = new Set<string>();
                this.structuralVariants.forEach(
                    (structuralVariant: StructuralVariant) => {
                        transcriptIds.add(
                            structuralVariant.site1EnsemblTranscriptId
                        );
                        transcriptIds.add(
                            structuralVariant.site2EnsemblTranscriptId
                        );
                    }
                );
                // Fetch ensembl transcript data with transcript ids as request params
                return await fetchEnsemblTranscriptsByEnsemblFilter(
                    {
                        transcriptIds: Array.from(transcriptIds),
                    },
                    this.genomenexusClient
                );
            },
        },
        []
    );

    readonly canonicalTranscriptsByHugoSymbols = remoteData(
        {
            invoke: async () => {
                // Collect all transcript id's from the structuralVariant data
                const hugoSymbols = new Set<string>();
                this.structuralVariants.forEach(
                    (structuralVariant: StructuralVariant) => {
                        if (structuralVariant.site1HugoSymbol)
                            hugoSymbols.add(structuralVariant.site1HugoSymbol);
                        if (structuralVariant.site2HugoSymbol)
                            hugoSymbols.add(structuralVariant.site2HugoSymbol);
                    }
                );
                // Fetch ensembl transcript data with transcript ids as request params
                return await fetchCanonicalTranscripts(
                    Array.from(hugoSymbols),
                    'mskcc',
                    this.genomenexusClient
                );
            },
        },
        []
    );

    @computed
    get transcriptToExons(): Map<string, Exon[]> {
        const ensemblTranscripts = this.ensemblTranscriptsByTranscriptIds
            .result;
        const canonicalTranscripts = this.canonicalTranscriptsByHugoSymbols
            .result;
        const transcriptToExons = new Map<string, Exon[]>();

        ensemblTranscripts.forEach(transcript => {
            const transcriptId = transcript.transcriptId;
            transcriptToExons.set(transcriptId, transcript.exons);
        });
        canonicalTranscripts.forEach(transcript => {
            const hugoSymbol = transcript.hugoSymbols?.[0];
            transcriptToExons.set(hugoSymbol, transcript.exons);
        });

        return transcriptToExons;
    }

    @computed
    get dataStore(): ResultViewStructuralVariantMapperDataStore {
        const structuralVariantData = (
            this.structuralVariants || []
        ).map((structuralVariant: StructuralVariant) => [structuralVariant]);
        return new ResultViewStructuralVariantMapperDataStore(
            structuralVariantData
        );
    }
}
