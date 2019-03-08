import {DriverAnnotationSettings} from "../../../resultsView/ResultsViewPageStore";
import {action, computed, observable} from "mobx";
import AppConfig from "appConfig";
import {
    annotateGeneticTrackData,
    fetchOncoKbDataForCna,
    fetchOncoKbDataForMutations,
    getGeneSymbols,
    getGeneticTracks,
    getOncoprintData,
    getSampleGeneticTrackData,
    getSampleIds,
    initDriverAnnotationSettings,
    isAltered,
    OncoprinterInputLine,
    parseInput
} from "./OncoprinterUtils";
import {remoteData} from "../../../../shared/api/remoteData";
import {IOncoKbData} from "../../../../shared/model/OncoKB";
import {fetchOncoKbAnnotatedGenesSuppressErrors, ONCOKB_DEFAULT} from "../../../../shared/lib/StoreUtils";
import client from "../../../../shared/api/cbioportalClientInstance";
import _ from "lodash";
import {countMutations, mutationCountByPositionKey} from "../../../resultsView/mutationCountHelpers";
import {Mutation, MutationCountByPosition} from "../../../../shared/api/generated/CBioPortalAPI";
import {sleep} from "../../../../shared/lib/TimeUtils";

export type OncoprinterDriverAnnotationSettings = Pick<DriverAnnotationSettings, "ignoreUnknown" | "hotspots" | "cbioportalCount" | "cbioportalCountThreshold" | "oncoKb" | "driversAnnotated">;

/* Leaving commented only for reference, this will be replaced by unified input strategy
function genomeNexusKey(l:OncoprinterInputLineType3_Incomplete){
    return `${l.chromosome}_${l.startPosition}_${l.endPosition}_${l.referenceAllele}_${l.variantAllele}`;
}

function genomeNexusKey2(l:{chromosome:string, start:number, end:number, referenceAllele:string, variantAllele:string}){
    return `${l.chromosome}_${l.start}_${l.end}_${l.referenceAllele}_${l.variantAllele}`;
}*/

export default class OncoprinterStore {

    // NOTE: we are not annotating hotspot because that needs nucleotide positions
    //      we are not annotating COSMIC because that needs keywords

    @observable.ref _inputSampleIdOrder:string | undefined = undefined;
    @observable.ref _geneOrder:string | undefined = undefined;
    @observable driverAnnotationSettings:OncoprinterDriverAnnotationSettings = initDriverAnnotationSettings(this);
    @observable.ref _dataInput:string|undefined = undefined;
    @observable public showUnalteredColumns:boolean = true;

    @computed get didOncoKbFail() {
        return this.oncoKbData.peekStatus === "complete" && (this.oncoKbData.result instanceof Error);
    }

    @computed get sampleIds() {
        if (this.inputSampleIdOrder) {
            return this.inputSampleIdOrder;
        } else {
            return this.allSampleIds;
        }
    }

    @computed get allSampleIds() {
        if (this.parsedInputLines.result) {
            return getSampleIds(this.parsedInputLines.result);
        } else {
            return [];
        }
    }

    @action setSampleIdOrder(input:string) {
        this._inputSampleIdOrder = input.trim();
    }

    @computed get inputSampleIdOrder() {
        if (this._inputSampleIdOrder) {
            // intersection - only take into account specified sample ids
            return _.intersection(this._inputSampleIdOrder.split(/[,\s]+/), this.allSampleIds);
        } else {
            return undefined;
        }
    }

    @computed get sampleIdsNotInInputOrder() {
        if (this.inputSampleIdOrder) {
            return _.difference(this.allSampleIds, this.inputSampleIdOrder);
        } else {
            undefined;
        }
    }

    readonly hiddenSampleIds = remoteData({
        await:()=>[this.unalteredSampleIds],
        invoke:async()=>(this.showUnalteredColumns ? [] : this.unalteredSampleIds.result!),
        default: []
    });

    @action setGeneOrder(input:string) {
        this._geneOrder = input.trim();
    }

    @computed get geneOrder() {
        if (this._geneOrder) {
            return _.uniq(this._geneOrder.split(/[,\s]+/));
        } else {
            return undefined;
        }
    }

    @action setDataInput(input:string) {
        this._dataInput = input;
    }

    @action public setInput(data:string, genes:string, samples:string) {
        this.setDataInput(data);
        this.setGeneOrder(genes);
        this.setSampleIdOrder(samples);
    }

    @computed get parsedInputLines() {
        if (!this._dataInput) {
            return {
                error:null,
                result:[]
            };
        }

        const parsed = parseInput(this._dataInput);
        if (parsed.status === "error") {
            return {
                error: parsed.error,
                result: null
            };
        } else {
            return {
                error:null,
                result: parsed.result
            }
        }
    }

    @computed get hugoGeneSymbols() {
        if (this.geneOrder) {
            return this.geneOrder;
        } else if (this.parsedInputLines.result) {
            return getGeneSymbols(this.parsedInputLines.result);
        } else {
            return [];
        }
    }

    readonly hugoGeneSymbolToGene = remoteData({
        invoke:async()=>{
            const geneIds = this.hugoGeneSymbols;
            if (geneIds.length > 0) {
                return _.keyBy(await client.fetchGenesUsingPOST({
                    geneIdType: "HUGO_GENE_SYMBOL",
                    geneIds
                }), o=>o.hugoGeneSymbol);
            } else {
                return {};
            }
        }
    });

    readonly oncoKbAnnotatedGenes = remoteData({
        invoke: () => {
            if (AppConfig.serverConfig.show_oncokb) {
                return fetchOncoKbAnnotatedGenesSuppressErrors();
            } else {
                return Promise.resolve({});
            }
        }
    }, {});

    readonly oncoKbData = remoteData<IOncoKbData|Error>({
        await: () => [
            this.nonAnnotatedGeneticData,
            this.oncoKbAnnotatedGenes
        ],
        invoke: async() => {
            if (AppConfig.serverConfig.show_oncokb) {
                let result;
                try {
                    result = await fetchOncoKbDataForMutations(this.oncoKbAnnotatedGenes.result!, this.nonAnnotatedGeneticData.result!);
                } catch(e) {
                    result = new Error();
                }
                return result;
            } else {
                return ONCOKB_DEFAULT;
            }
        },
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, ONCOKB_DEFAULT);

    readonly oncoKbCnaData = remoteData<IOncoKbData|Error>({
        await: () => [
            this.nonAnnotatedGeneticData,
            this.oncoKbAnnotatedGenes
        ],
        invoke: async() => {
            if (AppConfig.serverConfig.show_oncokb) {
                let result;
                try {
                    result = await fetchOncoKbDataForCna(this.oncoKbAnnotatedGenes.result!, this.nonAnnotatedGeneticData.result!);
                } catch(e) {
                    result = new Error();
                }
                return result;
            } else {
                return ONCOKB_DEFAULT;
            }
        },
        onError: (err: Error) => {
            // fail silently, leave the error handling responsibility to the data consumer
        }
    }, ONCOKB_DEFAULT);

    readonly cbioportalCountData = remoteData<{[mutationPositionKey:string]:number}>({
        await: ()=>[
            this.nonAnnotatedGeneticData
        ],
        invoke: async()=>{

            const mutations =
                this.nonAnnotatedGeneticData.result!.filter(
                    x=>(x.proteinPosStart !== undefined && x.proteinPosEnd !== undefined)
                ) as Pick<Mutation, "entrezGeneId"|"proteinPosStart"|"proteinPosEnd">[];

            const mutationPositionIdentifiers = _.values(countMutations(mutations));

            const data = await client.fetchMutationCountsByPositionUsingPOST({
                mutationPositionIdentifiers
            });

            return _.chain(data).groupBy(mutationCountByPositionKey).mapValues((counts:MutationCountByPosition[])=>_.sumBy(counts, c=>c.count)).value();
        }
    });

    readonly alteredSampleIds = remoteData({
        await:()=>[this.geneticTracks],
        invoke: async()=>{
            const allAlteredIds = _.chain(this.geneticTracks.result!).map(track=>track.data.filter(isAltered))
                    .flatten().map(datum=>datum.sample).uniq().value();
            const visibleAlteredIds = _.intersection(this.sampleIds, allAlteredIds);
            return visibleAlteredIds;
        },
        default: []
    });

    readonly unalteredSampleIds = remoteData({
        await:()=>[this.alteredSampleIds],
        invoke: async()=>{
            return _.difference(this.sampleIds, this.alteredSampleIds.result!);
        },
        default: []
    });

    @computed get annotationData():any {
        const promisesMap:any = {};
        const params:any = {};
        // always
        params.useHotspots = this.driverAnnotationSettings.hotspots;
        promisesMap.oncoKbCna = this.oncoKbCnaData;

        if (this.driverAnnotationSettings.driversAnnotated) {
            if (this.driverAnnotationSettings.oncoKb) {
                promisesMap.oncoKb = this.oncoKbData;
            }
            if (this.driverAnnotationSettings.cbioportalCount) {
                promisesMap.cbioportalCount = this.cbioportalCountData;
                params.cbioportalCountThreshold = this.driverAnnotationSettings.cbioportalCountThreshold;
            }
        }

        return {
            promises: _.values(promisesMap),
            params,
            promisesMap
        }
    }

    readonly nonAnnotatedGeneticTrackData = remoteData({
        await:()=>[this.hugoGeneSymbolToGene],
        invoke: async()=>{
            if (this.parsedInputLines.result) {
                return getSampleGeneticTrackData(this.parsedInputLines.result, this.hugoGeneSymbolToGene.result!)
            } else {
                return {};
            }
        }
    });

    readonly nonAnnotatedGeneticData = remoteData({
        await:()=>[this.nonAnnotatedGeneticTrackData],
        invoke:async()=>{
            return _.chain(this.nonAnnotatedGeneticTrackData.result!).values().flatten().map(o=>o.data).flatten().value();
        }
    });

    readonly annotatedGeneticTrackData = remoteData({
        await:()=>[this.nonAnnotatedGeneticTrackData,  ...this.annotationData.promises],
        invoke:async()=>annotateGeneticTrackData(
            this.nonAnnotatedGeneticTrackData.result!,
            this.annotationData.promisesMap,
            this.annotationData.params,
            this.driverAnnotationSettings.ignoreUnknown
        )
    });

    readonly annotatedOncoprintData = remoteData({
        await:()=>[this.annotatedGeneticTrackData],
        invoke: async()=>getOncoprintData(this.annotatedGeneticTrackData.result!)
    });

    readonly geneticTracks = remoteData({
        await:()=>[this.annotatedOncoprintData],
        invoke:async()=>getGeneticTracks(
            this.annotatedOncoprintData.result!,
            this.geneOrder,
            this.sampleIdsNotInInputOrder
        ),
        default:[]
    });
}