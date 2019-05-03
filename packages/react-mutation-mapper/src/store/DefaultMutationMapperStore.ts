import _ from "lodash";
import {computed, observable} from "mobx";
import {cached} from "mobxpromise";

import {remoteData} from "cbioportal-frontend-commons";

import DataStore from "../model/DataStore";
import {EnsemblTranscript} from "../model/EnsemblTranscript";
import {Gene} from "../model/Gene";
import {Mutation} from "../model/Mutation";
import MutationMapperStore from "../model/MutationMapperStore";
import {PfamDomain, PfamDomainRange} from "../model/Pfam";
import {groupMutationsByProteinStartPos} from "../util/MutationUtils";
import {DefaultMutationMapperDataStore} from "./DefaultMutationMapperDataStore";
import {DefaultMutationMapperDataFetcher} from "./DefaultMutationMapperDataFetcher";

interface DefaultMutationMapperStoreConfig {
    isoformOverrideSource?: string;
    filterMutationsBySelectedTranscript?: boolean;
}

class DefaultMutationMapperStore implements MutationMapperStore
{
    @observable
    private _activeTranscript: string | undefined = undefined;

    constructor(
        public gene: Gene,
        protected config: DefaultMutationMapperStoreConfig,
        protected getMutations: () => Mutation[]
    ) {

    }

    @computed
    public get activeTranscript(): string | undefined
    {
        if (this._activeTranscript !== undefined) {
            return this._activeTranscript;
        }
        else if (!this.canonicalTranscript.isPending && this.canonicalTranscript.result) {
            return this.canonicalTranscript.result.transcriptId;
        }
        else {
            return undefined;
        }
    }

    public set activeTranscript(transcript: string | undefined) {
        this._activeTranscript = transcript;
    }

    @computed
    public get isoformOverrideSource(): string {
        return this.config.isoformOverrideSource || "uniprot";
    }

    @cached
    public get dataStore(): DataStore {
        return new DefaultMutationMapperDataStore(this.mutations);
    }

    @computed
    public get mutations(): Mutation[] {
        return this.getMutations();
    }

    @computed
    public get dataFetcher(): DefaultMutationMapperDataFetcher {
        return new DefaultMutationMapperDataFetcher({});
    }

    @computed
    public get mutationsByPosition(): {[pos:number]: Mutation[]} {
        return groupMutationsByProteinStartPos(_.flatten(this.dataStore.sortedFilteredData));
    }

    @computed
    public get uniqueMutationCountsByPosition(): {[pos: number]: number} {
        const map: {[pos: number]: number} = {};

        Object.keys(this.mutationsByPosition).forEach(pos => {
            const position = parseInt(pos, 10);
            // for each position multiple mutations for the same patient is counted only once
            const mutations = this.mutationsByPosition[position];
            if (mutations) {
                map[position] = this.countUniqueMutations(mutations);
            }
        });

        return map;
    }

    @computed
    public get transcriptsByTranscriptId(): {[transcriptId:string]: EnsemblTranscript} {
        return _.keyBy(this.allTranscripts.result, (transcript: EnsemblTranscript) => transcript.transcriptId);
    }

    public countUniqueMutations(mutations: Mutation[]): number
    {
        return mutations.length;
    }

    readonly swissProtId = remoteData({
        invoke: async() => {
            // do not try fetching swissprot data for invalid entrez gene ids,
            // just return the default value
            if (this.gene.entrezGeneId < 1) {
                return "";
            }

            const accession:string|string[] = await this.dataFetcher.fetchSwissProtAccession(this.gene.entrezGeneId);

            if (_.isArray(accession)) {
                return accession[0];
            }
            else {
                return accession;
            }
        },
        onError: () => {
            // fail silently
        }
    }, "");

    readonly uniprotId = remoteData({
        await: () => [
            this.swissProtId
        ],
        invoke: async() => {
            if (this.swissProtId.result) {
                return this.dataFetcher.fetchUniprotId(this.swissProtId.result);
            }
            else {
                return "";
            }
        },
        onError: () => {
            // fail silently
        }
    }, "");

    readonly mutationAlignerLinks = remoteData<{[pfamAccession: string]: string}>({
        await: () => [
            this.canonicalTranscript,
            this.allTranscripts,
        ],
        invoke: () => (new Promise((resolve,reject) => {
            const regions = (
                this.allTranscripts.result &&
                this.activeTranscript &&
                this.transcriptsByTranscriptId[this.activeTranscript]
            ) ? this.transcriptsByTranscriptId[this.activeTranscript].pfamDomains : undefined;

            const responsePromises:Promise<Response>[] = [];
            for (let i=0; regions && i<regions.length; i++) {
                // have to do a for loop because seamlessImmutable will make result of .map immutable,
                // and that causes infinite loop here
                // TODO fix `as any`
                responsePromises.push(this.dataFetcher.fetchMutationAlignerLink(regions[i].pfamDomainId) as any);
            }
            const allResponses = Promise.all(responsePromises);
            allResponses.then(responses => {
                // TODO fix `as any`
                const data = responses.map(r => JSON.parse(r.text as any));
                const ret:{[pfamAccession:string]:string} = {};
                let mutationAlignerData:any;
                let pfamAccession:string|null;
                for (let i=0; i<data.length; i++) {
                    mutationAlignerData = data[i];
                    pfamAccession = regions ? regions[i].pfamDomainId : null;
                    if (pfamAccession && mutationAlignerData.linkToMutationAligner) {
                        ret[pfamAccession] = mutationAlignerData.linkToMutationAligner;
                    }
                }
                resolve(ret);
            });
            allResponses.catch(reject);
        }))
    }, {});

    readonly pfamDomainData = remoteData<PfamDomain[] | undefined>({
        await: ()=> [
            this.canonicalTranscript,
            this.transcriptsWithProteinLength
        ],
        invoke: async() => {
            if (this.canonicalTranscript.result && this.canonicalTranscript.result.pfamDomains && this.canonicalTranscript.result.pfamDomains.length > 0) {
                let domainRanges = this.canonicalTranscript.result.pfamDomains;
                if (this.config.filterMutationsBySelectedTranscript && this.transcriptsWithProteinLength.result && this.transcriptsWithProteinLength.result.length > 0) {
                    // add domain ranges for all transcripts to this call
                    domainRanges = [].concat.apply([domainRanges], _.compact(this.transcriptsWithProteinLength.result.map((transcriptId:string) => this.transcriptsByTranscriptId[transcriptId].pfamDomains)));
                }
                return this.dataFetcher.fetchPfamDomainData(domainRanges.map((x: PfamDomainRange) => x.pfamDomainId));
            } else {
                return undefined;
            }
        }
    }, undefined);

    readonly canonicalTranscript = remoteData<EnsemblTranscript | undefined>({
        await: () => [
            this.transcriptsByHugoSymbol
        ],
        invoke: async() => {
            if (this.gene) {
                return this.dataFetcher.fetchCanonicalTranscriptWithFallback(
                    this.gene.hugoGeneSymbol, this.isoformOverrideSource, this.transcriptsByHugoSymbol.result);
            } else {
                return undefined;
            }
        },
        onError: () => {
            throw new Error("Failed to get canonical transcript");
        }
    }, undefined);

    readonly allTranscripts = remoteData<EnsemblTranscript[] | undefined>({
        await: () => [
            this.transcriptsByHugoSymbol,
            this.canonicalTranscript
        ],
        invoke: async() => {
            return _.compact(_.unionBy(
                this.transcriptsByHugoSymbol.result,
                [this.canonicalTranscript.result],
                (t) => t && t.transcriptId
            ));
        },
        onError: () => {
            throw new Error("Failed to get all transcripts");
        }
    }, undefined);

    readonly transcriptsByHugoSymbol = remoteData<EnsemblTranscript[] | undefined>({
        invoke: async() => {
            if (this.gene) {
                return this.dataFetcher.fetchEnsemblTranscriptsByEnsemblFilter(
                    {"hugoSymbols":[this.gene.hugoGeneSymbol]});
            } else {
                return undefined;
            }
        },
        onError: () => {
            throw new Error("Failed to fetch all transcripts");
        }
    }, undefined);

    readonly transcriptsWithProteinLength = remoteData<string[] | undefined>({
        await: () => [
            this.allTranscripts,
            this.canonicalTranscript
        ],
        invoke: async()=>{
            if (this.allTranscripts.result && this.canonicalTranscript.result) {
                // ignore transcripts without protein length
                // TODO: better solution is to hide lollipop plot for those transcripts
                return _.compact(this.allTranscripts.result.map((et: EnsemblTranscript) => et.proteinLength && et.transcriptId));
            } else {
                return [];
            }
        },
        onError: () => {
            throw new Error("Failed to get transcriptsWithProteinLength");
        }
    }, undefined);

}

export default DefaultMutationMapperStore;
