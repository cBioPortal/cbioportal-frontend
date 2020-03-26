import {
    CancerGene,
    IndicatorQueryResp,
    IOncoKbData,
} from 'cbioportal-frontend-commons';
import {
    EnsemblTranscript,
    MyVariantInfo,
    PfamDomain,
    PostTranslationalModification,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import { Hotspot, IHotspotIndex } from './CancerHotspot';
import { ICivicGene, ICivicVariant } from './Civic';
import DataStore from './DataStore';
import { Gene } from './Gene';
import { Mutation } from './Mutation';
import { IMyCancerGenomeData } from './MyCancerGenome';
import { RemoteData } from './RemoteData';

export interface MutationMapperStore {
    gene: Gene;
    dataStore: DataStore;
    uniprotId: RemoteData<string | undefined>;
    activeTranscript?: string;
    canonicalTranscript: RemoteData<EnsemblTranscript | undefined>;
    mutationAlignerLinks: RemoteData<
        { [pfamAccession: string]: string } | undefined
    >;
    mutationData: RemoteData<Partial<Mutation>[] | undefined>;
    pfamDomainData: RemoteData<PfamDomain[] | undefined>;
    allTranscripts: RemoteData<EnsemblTranscript[] | undefined>;
    transcriptsByTranscriptId: { [transcriptId: string]: EnsemblTranscript };
    mutationsByPosition: { [pos: number]: Mutation[] };
    groupedMutationsByPosition: {
        group: string;
        mutations: { [pos: number]: Mutation[] };
    }[];
    mutationCountsByProteinImpactType: { [proteinImpactType: string]: number };
    uniqueMutationCountsByPosition: { [pos: number]: number };
    uniqueGroupedMutationCountsByPosition: {
        group: string;
        counts: { [pos: number]: number };
    }[];
    ptmDataByProteinPosStart: RemoteData<
        { [pos: number]: PostTranslationalModification[] } | undefined
    >;
    ptmDataByTypeAndProteinPosStart: RemoteData<
        | {
              [type: string]: {
                  [position: number]: PostTranslationalModification[];
              };
          }
        | undefined
    >;
    indexedHotspotData: RemoteData<IHotspotIndex | undefined>;
    hotspotsByPosition: { [pos: number]: Hotspot[] };
    oncoKbCancerGenes: RemoteData<CancerGene[] | Error | undefined>;
    oncoKbData: RemoteData<IOncoKbData | Error | undefined>;
    oncoKbDataByPosition: { [pos: number]: IndicatorQueryResp[] };
    civicGenes?: RemoteData<ICivicGene | undefined>;
    civicVariants?: RemoteData<ICivicVariant | undefined>;
    myCancerGenomeData?: IMyCancerGenomeData;
    indexedVariantAnnotations: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    indexedMyVariantInfoAnnotations?: RemoteData<
        { [genomicLocation: string]: MyVariantInfo } | undefined
    >;
    transcriptsWithAnnotations: RemoteData<string[] | undefined>;
    transcriptsWithProteinLength: RemoteData<string[] | undefined>;
    mutationsByTranscriptId: { [transcriptId: string]: Mutation[] };
}

export default MutationMapperStore;
