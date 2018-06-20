import * as React from "react";
import {Gene, MolecularProfile, Mutation, NumericGeneMolecularData} from "../../../shared/api/generated/CBioPortalAPI";
import {observer, Observer} from "mobx-react";
import CoExpressionTable from "./CoExpressionTable";
import {action, autorun, computed, IReactionDisposer, observable} from "mobx";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {
    SimpleGetterLazyMobXTableApplicationDataStore,
    SimpleLazyMobXTableApplicationDataStore
} from "../../../shared/lib/ILazyMobXTableApplicationDataStore";
import {CoExpression} from "../../../shared/api/generated/CBioPortalAPIInternal";
import GeneMolecularDataCache from "../../../shared/cache/GeneMolecularDataCache";
import CoExpressionPlot, {ICoExpressionPlotProps} from "./CoExpressionPlot";
import {remoteData} from "../../../shared/api/remoteData";
import MutationDataCache from "../../../shared/cache/MutationDataCache";
import {cached, MobxPromise} from "mobxpromise";
import {computePlotData, requestAllDataMessage} from "./CoExpressionVizUtils";
import {Button} from "react-bootstrap";
import {CoExpressionCache} from "./CoExpressionTab";
import {bind} from "bind-decorator";
import MobxPromiseCache from "../../../shared/lib/MobxPromiseCache";
import {CoverageInformation} from "../ResultsViewPageStoreUtils";

export interface ICoExpressionVizProps {
    plotState:{
        plotLogScale:boolean;
        plotShowMutations:boolean;
    };
    plotHandlers:ICoExpressionPlotProps["handlers"];
    gene:Gene;
    molecularProfile:MolecularProfile;
    coExpressionCache:CoExpressionCache;
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>;
    coverageInformation:MobxPromise<CoverageInformation>;
    studyToMutationMolecularProfile:MobxPromise<{[studyId:string]:MolecularProfile}>;
    mutationCache?:MobxPromiseCache<{entrezGeneId:number}, Mutation[]>;
    hidden?:boolean;
}

export enum TableMode {
    SHOW_ALL, SHOW_POSITIVE, SHOW_NEGATIVE
}

export class CoExpressionDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<CoExpression> {
    @observable public tableMode:TableMode;

    constructor(
        getData:()=>CoExpression[],
        getHighlighted:()=>CoExpression|undefined,
        public setHighlighted:(c:CoExpression)=>void
    ) {
        super(getData);
        this.tableMode = TableMode.SHOW_ALL;
        this.dataHighlighter = (d:CoExpression) =>{
            const highlighted = getHighlighted();
            return !!(highlighted && (d.entrezGeneId === highlighted.entrezGeneId));
        };
        this.dataSelector = (d:CoExpression) =>{
            let selected;
            switch (this.tableMode) {
                case TableMode.SHOW_POSITIVE:
                    selected = (d.pearsonsCorrelation >= 0);
                    break;
                case TableMode.SHOW_NEGATIVE:
                    selected = (d.pearsonsCorrelation <= 0);
                    break;
                default:
                    selected = true;
                    break;
            }
            return selected;
        };

        autorun(()=>{
            if (
                this.sortMetric &&
                this.sortedFilteredData.length > 0 &&
                !getHighlighted()
            ) {
                this.setHighlighted(this.sortedFilteredData[0]);
            }
        });
    }
}

@observer
export default class CoExpressionViz extends React.Component<ICoExpressionVizProps, {}> {

    @observable.ref highlightedCoExpression:CoExpression|undefined; // only undefined initially, before data loaded
    @observable allDataRequested:boolean = true; // set to true to request all data by default

    private lastCoExpressionData:CoExpression[];

    get coExpressionDataPromise() {
        return this.props.coExpressionCache.get({
            entrezGeneId: this.props.gene.entrezGeneId,
            molecularProfile: this.props.molecularProfile,
            allData: this.allDataRequested
        });
    }

    private dataStore = new CoExpressionDataStore(
        ()=>{
            if (this.props.hidden) {
                // dont download any data or trigger anything if element is hidden
                // need to return last result, because if we just return empty,
                //  the table page will be reset to 0 and we'll lose our page
                //  when this tab is no longer hidden
                return this.lastCoExpressionData || [];
            }

            if (this.coExpressionDataPromise.isComplete) {
                this.lastCoExpressionData = this.coExpressionDataPromise.result!;
                return this.coExpressionDataPromise.result!;
            } else {
                return [];
            }
        },
        ()=>{
            return this.highlightedCoExpression;
        },
        (c:CoExpression)=>{
            this.highlightedCoExpression = c;
        }
    );

    @bind
    @action
    private onSelectTableMode(t:TableMode) {
        this.dataStore.tableMode = t;
    }

    @bind
    @action
    private requestAllData() {
        this.allDataRequested = true;
    }

    private getPlotDataPromises(yAxisCoExpression?:CoExpression) {
        const ret:{
            molecularX:MobxPromise<NumericGeneMolecularData[]>,
            molecularY:MobxPromise<NumericGeneMolecularData[]>|undefined,
            mutationX:MobxPromise<Mutation[]>|undefined,
            mutationY:MobxPromise<Mutation[]>|undefined
        } = {
            molecularX: this.props.numericGeneMolecularDataCache.get({
                entrezGeneId: this.props.gene.entrezGeneId,
                molecularProfileId: this.props.molecularProfile.molecularProfileId
            }),
            mutationX:undefined,
            molecularY:undefined,
            mutationY:undefined
        };

        if (yAxisCoExpression) {
            ret.molecularY = this.props.numericGeneMolecularDataCache.get({
                entrezGeneId: yAxisCoExpression.entrezGeneId,
                molecularProfileId: this.props.molecularProfile.molecularProfileId
            });
        }

        if (this.props.mutationCache) {
            ret.mutationX = this.props.mutationCache.get({entrezGeneId: this.props.gene.entrezGeneId});
            if (yAxisCoExpression) {
                ret.mutationY = this.props.mutationCache.get({entrezGeneId: yAxisCoExpression.entrezGeneId});
            }
        }

        return ret;
    }
    
    readonly plotData = remoteData({
        await:()=>{
            if (this.props.hidden)
                // dont download any data or trigger anything if element is hidden
                return [];

            const promises = this.getPlotDataPromises(this.highlightedCoExpression);
            const ret:MobxPromise<any>[] = [
                this.props.coverageInformation,
                this.props.studyToMutationMolecularProfile,
                promises.molecularX
            ];

            if (promises.mutationX)
                ret.push(promises.mutationX);
            if (promises.molecularY)
                ret.push(promises.molecularY);
            if (promises.mutationY)
                ret.push(promises.mutationY);

            return ret;
        },
        invoke: ()=>{
            if (this.props.hidden) {
                // dont download any data or trigger anything if element is hidden
                return Promise.resolve([]);
            }

            if (!this.highlightedCoExpression) {
                // no data if y axis not specified
                return Promise.resolve([]);
            }

            const promises = this.getPlotDataPromises(this.highlightedCoExpression);
            let numericGeneMolecularData:NumericGeneMolecularData[] = [];
            if (promises.molecularX && promises.molecularX.isComplete)
                numericGeneMolecularData = numericGeneMolecularData.concat(promises.molecularX.result!);
            if (promises.molecularY && promises.molecularY.isComplete)
                numericGeneMolecularData = numericGeneMolecularData.concat(promises.molecularY.result!);

            let mutations:Mutation[] = [];
            if (promises.mutationX && promises.mutationX.isComplete)
                mutations = mutations.concat(promises.mutationX.result!);
            if (promises.mutationY && promises.mutationY.isComplete)
                mutations = mutations.concat(promises.mutationY.result!);

            return Promise.resolve(computePlotData(
                numericGeneMolecularData,
                mutations,
                this.props.gene.entrezGeneId,
                this.props.gene.hugoGeneSymbol,
                this.highlightedCoExpression.hugoGeneSymbol,
                this.props.coverageInformation.result!,
                this.props.studyToMutationMolecularProfile.result!
            ));
        }
    });

    @computed get plotShowMutations() {
        return this.props.plotState.plotShowMutations && this.showMutationControls;
    }

    @computed get plotLogScale() {
        return this.props.plotState.plotLogScale && this.showLogScaleControls;
    }

    @computed get showMutationControls() {
        return !!this.props.mutationCache;
    }

    @computed get showLogScaleControls() {
        const profileId = this.props.molecularProfile.molecularProfileId.toLowerCase();
        return (
            (profileId.indexOf("rna_seq") > -1) &&
            (profileId.indexOf("zscore") === -1)
        );
    }

    private get requestAllDataButton() {
        if (this.plotData.isComplete && !this.dataStore.allData.length && !this.allDataRequested) {
            return (
                <div>
                    <span style={{marginRight:5}}>{requestAllDataMessage(this.props.gene.hugoGeneSymbol)}</span>
                    <Button onClick={this.requestAllData}>Load data for all genes.</Button>
                </div>
            );
        } else {
            return null;
        }
    }

    @bind
    private table() {
        return (
            <div>
                <CoExpressionTable
                    referenceGene={this.props.gene}
                    dataStore={this.dataStore}
                    tableMode={this.dataStore.tableMode}
                    onSelectTableMode={this.onSelectTableMode}
                />
                {this.requestAllDataButton}
            </div>
        );
    }

    @bind
    private plot() {
        if (this.props.hidden)
            return <span></span>;

        if (this.plotData.isError) {
            return <span>Error fetching data. Please refresh the page and try again.</span>
        } else {
            return (
                <div style={{position:"relative"}}>
                    <LoadingIndicator
                        isLoading={
                            (this.dataStore.allData.length > 0) // dont show indicator if theres no data
                            && (this.plotData.isPending || !this.highlightedCoExpression)}
                        style={{
                            position:"absolute",
                            top:300,
                            left:"50%",
                            transform:"translate(-50%,0)"
                        }}
                    />
                    { (this.plotData.isComplete && this.highlightedCoExpression) && (
                        <div style={{marginLeft:10}}>
                            <CoExpressionPlot
                                xAxisGene={this.props.gene}
                                yAxisGene={this.highlightedCoExpression}
                                data={this.plotData.result}
                                coExpression={this.highlightedCoExpression}
                                showLogScaleControls={this.showLogScaleControls}
                                showMutationControls={this.showMutationControls}
                                showMutations={this.plotShowMutations}
                                logScale={this.plotLogScale}
                                handlers={this.props.plotHandlers}
                                molecularProfile={this.props.molecularProfile}

                                height={530}
                                width={530}
                            />
                        </div>
                    )}
                </div>
            );
        }
    }

    render() {
        let innerElt = (
            <div
                style={{
                    display:(!this.props.hidden && this.coExpressionDataPromise.isComplete) ? "inherit" : "none",
                }}
                data-test="CoExpressionGeneTabContent"
            >
                <div className="clearfix">
                    <div style={{width:"40%", float:"left", marginTop:6}}>
                        <Observer>
                            {this.table}
                        </Observer>
                    </div>
                    <div style={{width:"60%", float:"right", marginTop:6 /*align with table controls*/}}>
                        <Observer>
                            {this.plot}
                        </Observer>
                    </div>
                </div>
            </div>
        );
        return (
            <div style={{display:this.props.hidden ? "none" : "inherit", minHeight:826, position:"relative"}}>
                {innerElt}
                <LoadingIndicator isLoading={this.props.hidden || this.coExpressionDataPromise.isPending} style={{position:"absolute", left:"50%", top:100, transform:"translate(-50%,0)"}}/>
            </div>
        );
    }
}