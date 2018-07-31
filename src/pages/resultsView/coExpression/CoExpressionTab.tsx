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
import {CoverageInformation} from "../ResultsViewPageStoreUtils";
import NoOqlWarning from "../../../shared/components/NoOqlWarning";

export interface ICoExpressionTabProps {
    store:ResultsViewPageStore;
    molecularProfiles:MolecularProfile[];
    genes:Gene[];
    studyToDataQueryFilter:{[studyId:string]:IDataQueryFilter}
    numericGeneMolecularDataCache:MobxPromiseCache<{entrezGeneId:number, molecularProfileId:string}, NumericGeneMolecularData[]>;
    mutationCache:MobxPromiseCache<{entrezGeneId:number}, Mutation[]>;
    molecularProfileIdToProfiledSampleCount:MobxPromise<{[molecularProfileId:string]:number}>;
    coverageInformation:MobxPromise<CoverageInformation>;
    studyToMutationMolecularProfile:MobxPromise<{[studyId:string]:MolecularProfile}>;
}

export class CoExpressionCache extends MobxPromiseCache<{entrezGeneId:number, molecularProfile:MolecularProfile, allData:boolean}, CoExpression[]> {};

@observer
export default class CoExpressionTab extends React.Component<ICoExpressionTabProps, {}> {
    @observable selectedMolecularProfile:MolecularProfile|undefined; // only undefined initially, until molecular profiles downloaded, at which point its set automatically (see componentWillMount) and cant be made undefined again
    @observable selectedEntrezGeneId:number | undefined; // only undefined initially, until genes downloaded, at which point its set automatically (see componentWillMount) and cant be made undefined again

    @observable private plotState = {
        plotLogScale: false,
        plotShowMutations: true
    };

    private plotHandlers: ICoExpressionPlotProps["handlers"];

    private setMolecularProfileReaction:IReactionDisposer;
    private setGeneReaction:IReactionDisposer;

    constructor(props:ICoExpressionTabProps) {
        super(props);

        setWindowVariable("resultsViewCoExpressionTab", this); // for testing

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
        this.selectedMolecularProfile = this.molecularProfileIdToMolecularProfile[option.value];
    }

    @bind
    private onSelectGene(entrezGeneId:string) {
        this.selectedEntrezGeneId = parseInt(entrezGeneId, 10);
    }

    @computed get profiles() {
        return filterAndSortProfiles(this.props.molecularProfiles);
    }

    @computed get hasMutationData() {
        return !!_.find(
            this.props.molecularProfiles,
            profile=>profile.molecularAlterationType === AlterationTypeConstants.MUTATION_EXTENDED
        );
    }

    @computed get molecularProfileIdToMolecularProfile() {
        return _.keyBy(this.profiles, profile=>profile.molecularProfileId);
    }

    private coExpressionCache:CoExpressionCache = new CoExpressionCache(
        q=>({
            invoke: ()=>{
                let threshold = 0.3;
                if (q.allData) {
                    threshold = 0;
                }
                const dataQueryFilter = this.props.studyToDataQueryFilter[q.molecularProfile.studyId];
                if (dataQueryFilter) {
                    return internalClient.fetchCoExpressionsUsingPOST({
                        molecularProfileId: q.molecularProfile.molecularProfileId,
                        coExpressionFilter: dataQueryFilter as CoExpressionFilter,
                        entrezGeneId: q.entrezGeneId,
                        threshold
                    });
                } else {
                    return Promise.resolve([]);
                }
            }
        }),
        q=>`${q.entrezGeneId},${q.molecularProfile.molecularProfileId}`
    );

    private get dataSetSelector() {
        if (this.selectedMolecularProfile && this.props.molecularProfileIdToProfiledSampleCount.isComplete) {
            let options = this.profiles.map(profile=>{
                const profiledSampleCount = this.props.molecularProfileIdToProfiledSampleCount.result![profile.molecularProfileId];
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
            return <LoadingIndicator isLoading={true}/>;
        }
    }

    @bind
    private header() {
        return (
            <div>
                {this.dataSetSelector}
            </div>
        );
    }

    @bind
    private geneTabs() {
        if (this.selectedMolecularProfile && this.selectedEntrezGeneId !== undefined) {
            const coExpressionVizElements = [];
            for (const gene of this.props.genes) {
                for (const profile of this.profiles) {
                    coExpressionVizElements.push(
                        <CoExpressionViz
                            key={`${gene.entrezGeneId},${profile.molecularProfileId}`}
                            coExpressionCache={this.coExpressionCache}
                            gene={gene}
                            molecularProfile={profile}
                            numericGeneMolecularDataCache={this.props.numericGeneMolecularDataCache}
                            mutationCache={this.hasMutationData ? this.props.mutationCache : undefined}
                            hidden={
                                (profile.molecularProfileId !== this.selectedMolecularProfile!.molecularProfileId) ||
                                (gene.entrezGeneId !== this.selectedEntrezGeneId!)
                            }
                            plotState={this.plotState}
                            plotHandlers={this.plotHandlers}
                            coverageInformation={this.props.coverageInformation}
                            studyToMutationMolecularProfile={this.props.studyToMutationMolecularProfile}
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
                        enablePagination={true}
                        arrowStyle={{'line-height':.8}}
                    >
                        {this.props.genes.map((gene:Gene, i:number)=>{
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
                <div style={{position:"relative"}}>
                    <LoadingIndicator isLoading={true} style={{position:"absolute", left:"50%", top:100, transform:"translate(-50%,0)"}}/>
                </div>
            );
        }
    }

    componentWillMount() {
        this.setMolecularProfileReaction = autorun(()=>{
            // set sourceMolecularProfile to default if its not already set
            // will only happen once, the first time profiles is nonempty array. it cant become undefined again
            if(!this.selectedMolecularProfile && this.profiles.length) {
                this.selectedMolecularProfile = this.profiles[0];
            }
        });

        this.setGeneReaction = autorun(()=>{
            // set gene to default if its not already set
            // will only happen once, the first time props.genes is set to nonempty array. it cant become undefined again
            if (!this.selectedEntrezGeneId && this.props.genes.length) {
                this.selectedEntrezGeneId = this.props.genes[0].entrezGeneId;
            }
        });
    }

    componentWillUnmount() {
        this.setMolecularProfileReaction();
        this.setGeneReaction();
    }

    render() {
        let divContents = null;
        if (this.profiles.length) {
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
                <div>
                    <span>There are no available profiles in the queried studies.</span>
                </div>
            );
        }
        return (
            <div>
                <div style={{marginBottom:10}}>
                    <NoOqlWarning store={this.props.store}/>
                </div>
                {divContents}
            </div>
        );
    }
}