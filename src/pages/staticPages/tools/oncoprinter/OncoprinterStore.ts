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

    readonly sampleIds = remoteData({
        await:()=>[this.parsedInputLines],
        invoke:async()=>{
            if (this.inputSampleIdOrder) {
                return this.inputSampleIdOrder;
            } else {
                return this.allSampleIds;
            }
        }
    });

    @computed get allSampleIds() {
        return getSampleIds(this.parsedInputLines.result!);
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

    public readonly parsedInputLines = remoteData({
        invoke:async()=>{
            if (!this._dataInput) {
                return [];
            }
            // parse input
            const parsed = parseInput(this._dataInput);
            if (parsed.status === "error") {
                throw new Error(parsed.error);
            } else {
                let parsedLines = parsed.result;
                /* Leaving commented only for reference, this will be replaced by unified input strategy
                // fetch hugoGeneSymbols and hotspot for Type3 input lines
                const toAnnotate =
                    _.chain(parsedLines as any).filter(l=>isType3NoGene(l)).uniqBy(genomeNexusKey).values().value();
                if (toAnnotate.length > 0) {
                    try {
                        // get data and store in map for querying
                        const gnData = _.keyBy(await gnClient.fetchVariantAnnotationByGenomicLocationPOST({
                            genomicLocations: toAnnotate.map(line=>({
                                chromosome: line.chromosome,
                                start: line.startPosition,
                                end: line.endPosition,
                                referenceAllele: line.referenceAllele,
                                variantAllele: line.variantAllele
                            })),
                            fields:["hotspots", "annotation_summary"]
                        }), d=>genomeNexusKey2(d.annotation_summary.genomicLocation));
                        // annotate lines in place - this keeps their place in parsedLines in original data order
                        for (const line of toAnnotate) {
                            const gnDatum = gnData[genomeNexusKey(line)];
                            (line as OncoprinterInputLineType3).hugoGeneSymbol = gnDatum.annotation_summary.transcriptConsequenceSummary.hugoGeneSymbol;
                            (line as OncoprinterInputLineType3).isHotspot = _.flatten(gnDatum.hotspots.annotation).filter(recurrentHotspotFilter).length > 0;
                        }
                    } catch (e) {
                        // GenomeNexus error - filter out type3 lines because we don't know how to use them
                        alert("Error fetching data from GenomeNexus service - throwing out Type 3 (MAF/mutation) input data rows.");
                        sendSentryMessage("There was an error fetching GenomeNexus data from Oncoprinter.");
                        parsedLines = parsedLines.filter(l=>!isType3NoGene(l));
                    }
                }*/
                return parsedLines as OncoprinterInputLine[];
            }
        }
    });

    readonly hugoGeneSymbols = remoteData({
        await:()=>[this.parsedInputLines],
        invoke:async()=>{
            if (this.geneOrder) {
                return this.geneOrder;
            } else {
                return getGeneSymbols(this.parsedInputLines.result!);
            }
        }
    });

    readonly hugoGeneSymbolToGene = remoteData({
        await:()=>[this.hugoGeneSymbols],
        invoke:async()=>{
            const geneIds = this.hugoGeneSymbols.result!;
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
        invoke:()=>fetchOncoKbAnnotatedGenesSuppressErrors()
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
        await:()=>[this.sampleIds, this.geneticTracks],
        invoke: async()=>{
            const allAlteredIds = _.chain(this.geneticTracks.result!).map(track=>track.data.filter(isAltered))
                    .flatten().map(datum=>datum.sample).uniq().value();
            const visibleAlteredIds = _.intersection(this.sampleIds.result!, allAlteredIds);
            return visibleAlteredIds;
        },
        default: []
    });

    readonly unalteredSampleIds = remoteData({
        await:()=>[this.sampleIds, this.alteredSampleIds],
        invoke: async()=>{
            return _.difference(this.sampleIds.result!, this.alteredSampleIds.result!);
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
        await:()=>[this.parsedInputLines, this.hugoGeneSymbolToGene],
        invoke: async()=>getSampleGeneticTrackData(this.parsedInputLines.result!, this.hugoGeneSymbolToGene.result!)
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