import * as React from "react";
import {
    Gene, MolecularProfile, Mutation, NumericGeneMolecularData,
    Sample
} from "../../../shared/api/generated/CBioPortalAPI";
import {action, autorun, computed, IReactionDisposer, observable, ObservableMap} from "mobx";
import {observer, Observer} from "mobx-react";
import {AlterationTypeConstants, ResultsViewPageStore} from "../ResultsViewPageStore";
import Select from "react-select";
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";
import {remoteData} from "../../../shared/api/remoteData";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";
import {MobxPromise} from "mobxpromise";
import {CoExpression, CoExpressionFilter} from "../../../shared/api/generated/CBioPortalAPIInternal";
import _ from "lodash";
import {IDataQueryFilter} from "../../../shared/lib/StoreUtils";
import {MSKTab, MSKTabs} from "../../../shared/components/MSKTabs/MSKTabs";
import CoExpressionViz from "./CoExpressionViz";
import GeneMolecularDataCache from "../../../shared/cache/GeneMolecularDataCache";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import MutationDataCache from "../../../shared/cache/MutationDataCache";
import InfoIcon from "../../../shared/components/InfoIcon";
import {filterAndSortProfiles} from "./CoExpressionTabUtils";
import MobxPromiseCache from "../../../shared/lib/MobxPromiseCache";
import setWindowVariable from "../../../shared/lib/setWindowVariable";
import {ICoExpressionPlotProps} from "./CoExpressionPlot";
import {bind} from "bind-decorator";
import OqlStatusBanner from "../../../shared/components/oqlStatusBanner/OqlStatusBanner";
import {getMobxPromiseGroupStatus} from "../../../shared/lib/getMobxPromiseGroupStatus";

export interface ICoExpressionTabProps {
    store:ResultsViewPageStore;
}

export class CoExpressionCache extends MobxPromiseCache<{entrezGeneId:number, molecularProfile:MolecularProfile, allData:boolean}, CoExpression[]> {};

@observer
export default class CoExpressionTab extends React.Component<ICoExpressionTabProps, {}> {
    @observable _selectedMolecularProfile:MolecularProfile|undefined; // only undefined initially, until molecular profiles downloaded
    @observable _selectedEntrezGeneId:number | undefined; // only undefined initially, until genes downloaded

    @computed get selectedMolecularProfile():MolecularProfile|undefined {
        if (!this._selectedMolecularProfile && this.props.store.coexpressionTabMolecularProfiles.isComplete
            && this.props.store.coexpressionTabMolecularProfiles.result.length > 0) {
            return this.props.store.coexpressionTabMolecularProfiles.result[0];
        } else {
            return this._selectedMolecularProfile;
        }
    }

    @computed get selectedEntrezGeneId():number | undefined {
        if (this._selectedEntrezGeneId === undefined && this.props.store.genes.isComplete &&
                this.props.store.genes.result.length > 0) {
            return this.props.store.genes.result[0].entrezGeneId;
        } else {
            return this._selectedEntrezGeneId;
        }
    }

    @observable private plotState = {
        plotLogScale: false,
        plotShowMutations: true
    };

    private plotHandlers: ICoExpressionPlotProps["handlers"];

    constructor(props:ICoExpressionTabProps) {
        super(props);

        (window as any).resultsViewCoExpressionTab = this; // for testing

        this.plotHandlers = {
            onClickLogScale: action(()=>{
                this.plotState.plotLogScale = !this.plotState.plotLogScale;
            }),
            onClickShowMutations: action(()=>{
                this.plotState.plotShowMutations = !this.plotState.plotShowMutations;
            })
        };
    }

    @bind
    public onSelectDataSet(option:any) {
        if (this.props.store.molecularProfileIdToMolecularProfile.isComplete) {
            this._selectedMolecularProfile = this.props.store.molecularProfileIdToMolecularProfile.result[option.value];
        }
    }

    @bind
    private onSelectGene(entrezGeneId:string) {
        this._selectedEntrezGeneId = parseInt(entrezGeneId, 10);
    }

    @computed get hasMutationData() {
        return !!_.find(
            this.props.store.molecularProfilesWithData.result,
            profile=>profile.molecularAlterationType === AlterationTypeConstants.MUTATION_EXTENDED
        );
    }

    private coExpressionCache:CoExpressionCache = new CoExpressionCache(
        q=>({
            invoke: ()=>{
                let threshold = 0.3;
                if (q.allData) {
                    threshold = 0;
                }
                const dataQueryFilter = this.props.store.studyToDataQueryFilter.result![q.molecularProfile.studyId];
                if (dataQueryFilter) {
                    // TODO: this sorts by p value asc first, so we can fake
                    // multi column sort when sorting by q value afterwards. We
                    // can remove this after implementing multi-sort
                    return internalClient.fetchCoExpressionsUsingPOST({
                        molecularProfileId: q.molecularProfile.molecularProfileId,
                        coExpressionFilter: dataQueryFilter as CoExpressionFilter,
                        entrezGeneId: q.entrezGeneId,
                        threshold
                    })
                } else {
                    return Promise.resolve([]);
                }
            }
        }),
        q=>`${q.entrezGeneId},${q.molecularProfile.molecularProfileId}`
    );

    private get dataSetSelector() {
        if (this.selectedMolecularProfile &&
            this.props.store.molecularProfileIdToProfiledSampleCount.isComplete &&
            this.props.store.coexpressionTabMolecularProfiles.isComplete) {
            let options = this.props.store.coexpressionTabMolecularProfiles.result.map(profile=>{
                const profiledSampleCount = this.props.store.molecularProfileIdToProfiledSampleCount.result![profile.molecularProfileId];
                return {
                    label: `${profile.name} (${profiledSampleCount} sample${profiledSampleCount !== 1 ? "s" : ""})`,
                    value: profile.molecularProfileId
                };
            });
            return (
                <div
                    style = {{
                        display: "flex",
                        alignItems: "center"
                    }}
                >
                    <span>Data Set:</span>
                    <div style={{display:"inline-block", width:376, marginLeft:4, marginRight:4, zIndex:10 /* so that on top when opened*/}}>
                        <Select
                            name="data-set-select"
                            value={this.selectedMolecularProfile.molecularProfileId}
                            onChange={this.onSelectDataSet}
                            options={options}
                            searchable={false}
                            clearable={false}
                            className="coexpression-select-profile"
                        />
                    </div>
                </div>
            );
        } else {
            return <LoadingIndicator isLoading={true} center={true}/>;
        }
    }

    @bind
    private header() {
        return (
            <div style={{marginBottom:20}}>
                {this.dataSetSelector}
            </div>
        );
    }

    @bind
    private geneTabs() {
        if (this.selectedMolecularProfile && this.selectedEntrezGeneId !== undefined && this.props.store.coexpressionTabMolecularProfiles.isComplete) {
            const coExpressionVizElements = [];
            for (const gene of this.props.store.genes.result!) {
                for (const profile of this.props.store.coexpressionTabMolecularProfiles.result) {
                    coExpressionVizElements.push(
                        <CoExpressionViz
                            key={`${gene.entrezGeneId},${profile.molecularProfileId}`}
                            coExpressionCache={this.coExpressionCache}
                            gene={gene}
                            molecularProfile={profile}
                            numericGeneMolecularDataCache={this.props.store.numericGeneMolecularDataCache}
                            mutationCache={this.hasMutationData ? this.props.store.mutationCache : undefined}
                            hidden={
                                (profile.molecularProfileId !== this.selectedMolecularProfile!.molecularProfileId) ||
                                (gene.entrezGeneId !== this.selectedEntrezGeneId!)
                            }
                            plotState={this.plotState}
                            plotHandlers={this.plotHandlers}
                            coverageInformation={this.props.store.coverageInformation}
                            studyToMutationMolecularProfile={this.props.store.studyToMutationMolecularProfile}
                        />
                    );
                }
            }

            return (
                <div>
                    <MSKTabs
                        id="coexpressionTabGeneTabs"
                        activeTabId={this.selectedEntrezGeneId + ""}
                        onTabClick={this.onSelectGene}
                        className="coexpressionTabGeneTabs pillTabs"
                        unmountOnHide={true}
                        tabButtonStyle="pills"
                        enablePagination={false}
                        arrowStyle={{'line-height':.8}}
                    >
                        {this.props.store.genes.result!.map((gene:Gene, i:number)=>{
                            return (
                                <MSKTab
                                    key={i}
                                    id={gene.entrezGeneId+""}
                                    linkText={gene.hugoGeneSymbol}
                                >
                                </MSKTab>
                            );
                        })}
                    </MSKTabs>
                    {coExpressionVizElements}
                </div>
            );
        } else {
            return (
                <LoadingIndicator isLoading={true} center={true}/>
            );
        }
    }

    render() {
        let divContents = null;
        if (this.props.store.coexpressionTabMolecularProfiles.isComplete &&
            this.props.store.coexpressionTabMolecularProfiles.result.length > 0) {
            divContents = (
                <div>
                    <Observer>
                        {this.header}
                    </Observer>
                    <Observer>
                        {this.geneTabs}
                    </Observer>
                </div>
            );
        } else {
            divContents = (
                <div className={'alert alert-info'}>
                    There are no available profiles in the queried studies.
                </div>
            );
        }

        const status = getMobxPromiseGroupStatus(
          this.props.store.genes,
          this.props.store.molecularProfileIdToProfiledSampleCount,
          this.props.store.coexpressionTabMolecularProfiles
        );

        return (
            <div data-test="coExpressionTabDiv">
                <div className={"tabMessageContainer"}>
                    <OqlStatusBanner className="coexp-oql-status-banner" store={this.props.store} tabReflectsOql={false}/>
                </div>

                { (status==="complete") && divContents }

                <LoadingIndicator center={true} size={"big"} isLoading={status==="pending"}/>

            </div>
        );
    }
}