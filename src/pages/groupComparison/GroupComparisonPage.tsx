import * as React from "react";
import {inject, observer} from "mobx-react";
import GroupComparisonStore, {OverlapStrategy} from "./GroupComparisonStore";
import MutationEnrichments from "./MutationEnrichments";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import 'react-select/dist/react-select.css';
import Survival from "./Survival";
import Overlap from "./Overlap";
import CopyNumberEnrichments from "./CopyNumberEnrichments";
import MRNAEnrichments from "./MRNAEnrichments";
import ProteinEnrichments from "./ProteinEnrichments";
import {MakeMobxView} from "../../shared/components/MobxView";
import LoadingIndicator from "../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../shared/components/ErrorMessage";
import GroupSelector from "./GroupSelector";
import {caseCountsInParens, getTabId, GroupComparisonTab} from "./GroupComparisonUtils";
import styles from "./styles.module.scss";
import {StudyLink} from "shared/components/StudyLink/StudyLink";
import {computed, IReactionDisposer, reaction} from "mobx";
import autobind from "autobind-decorator";
import {AppStore} from "../../AppStore";
import _ from "lodash";
import ClinicalData from "./ClinicalData";
import ReactSelect from "react-select2";

export interface IGroupComparisonPageProps {
    routing:any;
    appStore:AppStore;
}

export type GroupComparisonURLQuery = {
    sessionId: string;
};

@inject('routing', 'appStore')
@observer
export default class GroupComparisonPage extends React.Component<IGroupComparisonPageProps, {}> {
    private store:GroupComparisonStore;
    private queryReaction:IReactionDisposer;
    private pathnameReaction:IReactionDisposer;
    private lastQuery:Partial<GroupComparisonURLQuery>;

    constructor(props:IGroupComparisonPageProps) {
        super(props);
        this.queryReaction = reaction(
            () => props.routing.location.query,
            query => {

                if (!props.routing.location.pathname.includes("/comparison") ||
                    _.isEqual(query, this.lastQuery)) {
                    return;
                }

                this.store = new GroupComparisonStore((query as GroupComparisonURLQuery).sessionId);
                (window as any).groupComparisonStore = this.store;

                this.lastQuery = query;
            },
            {fireImmediately: true}
        );

        this.pathnameReaction = reaction(
            () => props.routing.location.pathname,
            pathname => {

                if (!pathname.includes("/comparison")) {
                    return;
                }

                const tabId = getTabId(pathname);
                if (tabId) {
                    this.store.setTabId(tabId);
                }
            },
            {fireImmediately: true}
        );
    }

    @autobind
    private setTabId(id:string, replace?:boolean) {
        this.props.routing.updateRoute({},`comparison/${id}`, false, replace);
    }

    componentWillUnmount() {
        this.queryReaction && this.queryReaction();
        this.pathnameReaction && this.pathnameReaction();
    }

    readonly tabs = MakeMobxView({
        await:()=>[
            this.store.activeGroups,
            this.store.mutationEnrichmentProfiles,
            this.store.copyNumberEnrichmentProfiles,
            this.store.mRNAEnrichmentProfiles,
            this.store.proteinEnrichmentProfiles,
            this.store.survivalClinicalDataExists,
        ],
        render:()=>{
            if (this.store.activeGroups.result!.length === 0) {
                return <div style={{display:"flex", justifyContent:"center", alignItems:"center"}}>To get started, select groups from the Active Groups section above.</div>;
            } else if ((this.store.mutationEnrichmentProfiles.result!.length > 0) ||
                (this.store.copyNumberEnrichmentProfiles.result!.length > 0) ||
                (this.store.mRNAEnrichmentProfiles.result!.length > 0) ||
                (this.store.proteinEnrichmentProfiles.result!.length > 0) ||
                this.store.showSurvivalTab
            ) {
                return <MSKTabs unmountOnHide={false} activeTabId={this.store.currentTabId} onTabClick={this.setTabId} className="primaryTabs mainTabs">
                    <MSKTab id={GroupComparisonTab.OVERLAP} linkText="Overlap">
                        <Overlap store={this.store}/>
                    </MSKTab>
                    {
                        this.store.showSurvivalTab &&
                        <MSKTab id={GroupComparisonTab.SURVIVAL} linkText="Survival"
                                anchorClassName={this.store.survivalTabGrey ? "greyedOut" : ""}
                        >
                            <Survival store={this.store}/>
                        </MSKTab>
                    }
                    <MSKTab id={GroupComparisonTab.CLINICAL} linkText="Clinical">
                        <ClinicalData store={this.store}/>
                    </MSKTab>
                    {this.store.mutationEnrichmentProfiles.result!.length > 0 && (
                        <MSKTab id={GroupComparisonTab.MUTATIONS} linkText="Mutations"
                            anchorClassName={this.store.mutationsTabGrey ? "greyedOut" : ""}
                        >
                            <MutationEnrichments store={this.store}/>
                        </MSKTab>
                    )}
                    {this.store.copyNumberEnrichmentProfiles.result!.length > 0 && (
                        <MSKTab id={GroupComparisonTab.CNA} linkText="Copy-number"
                            anchorClassName={this.store.copyNumberTabGrey ? "greyedOut" : ""}
                        >
                            <CopyNumberEnrichments store={this.store}/>
                        </MSKTab>
                    )}
                    {this.store.mRNAEnrichmentProfiles.result!.length > 0 && (
                        <MSKTab id={GroupComparisonTab.MRNA} linkText="mRNA"
                            anchorClassName={this.store.mRNATabGrey ? "greyedOut" : ""}
                        >
                            <MRNAEnrichments store={this.store}/>
                        </MSKTab>
                    )}
                    {this.store.proteinEnrichmentProfiles.result!.length > 0 && (
                        <MSKTab id={GroupComparisonTab.PROTEIN} linkText="Protein"
                            anchorClassName={this.store.proteinTabGrey ? "greyedOut" : ""}
                        >
                            <ProteinEnrichments store={this.store}/>
                        </MSKTab>
                    )}
                </MSKTabs>;
            } else {
                return <span>No data.</span>;
            }
        },
        renderPending:()=><LoadingIndicator isLoading={true} big={true}/>,
        renderError:()=><ErrorMessage/>
    });

    readonly studyLink = MakeMobxView({
        await:()=>[this.store.studies],
        render:()=>{
            const studies = this.store.studies.result!;
            let studyHeader = <span/>;
            switch (studies.length) {
                case 0:
                    studyHeader = <span/>;
                    break;
                case 1:
                    studyHeader = <h3><StudyLink studyId={studies[0].studyId}>{studies[0].name}</StudyLink></h3>;
                    break;
                default:
                    studyHeader = (<h4>
                        <a
                            href={`study?id=${studies.map(study => study.studyId).join(',')}`}
                            target="_blank"
                        >
                            Multiple studies
                        </a>
                    </h4>);
            }
            let ret;
            if (this.store.sessionClinicalAttribute) {
                ret = <span>{studyHeader}Groups from <span style={{color:"#3487c7"}}>{this.store.sessionClinicalAttribute.displayName}</span></span>
            } else {
                ret = studyHeader;
            }
            return ret;
        } 
    });

    readonly overlapStrategySelector = MakeMobxView({
        await:()=>[this.store._selectionInfo],
        render:()=>{
            if (this.store._selectionInfo.result!.overlappingSamples.length === 0 &&
                this.store._selectionInfo.result!.overlappingPatients.length === 0) {
                return null;
            } else {
                // (${caseCountsInParens(this.store._selectionInfo.result.overlappingSamples, this.store._selectionInfo.result.overlappingPatients)})
                return (
                    <div style={{width:355, zIndex:20}}>
                        <ReactSelect
                            name="select overlap strategy"
                            onChange={(option:any|null)=>{
                                if (option) {
                                    this.store.setOverlapStrategy(option.value);
                                }
                            }}
                            options={[
                                { label: OverlapStrategy.INCLUDE, value: OverlapStrategy.INCLUDE},
                                { label: OverlapStrategy.EXCLUDE, value: OverlapStrategy.EXCLUDE},
                                { label: OverlapStrategy.GROUP, value: OverlapStrategy.GROUP }
                            ]}
                            clearable={false}
                            searchable={false}
                            value={{ label: this.store.overlapStrategy, value: this.store.overlapStrategy}}
                        />
                    </div>
                );
            }
        }
    });

    render() {
        if (!this.store) {
            return null;
        }

        return (
            <PageLayout noMargin={true} className={"subhead-dark"}>
                <div>
                    <div className={"headBlock"}>
                        {this.studyLink.component}
                        <div>
                            <div className={styles.headerControls}>
                                <GroupSelector
                                    store = {this.store}
                                />
                                {this.overlapStrategySelector.component}
                            </div>
                        </div>
                    </div>
                    <div>
                        {this.tabs.component}
                    </div>
                </div>
            </PageLayout>
        );
    }
}