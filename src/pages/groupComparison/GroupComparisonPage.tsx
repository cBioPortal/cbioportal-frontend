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
import GroupSelector from "./groupSelector/GroupSelector";
import {getTabId, GroupComparisonTab} from "./GroupComparisonUtils";
import styles from "./styles.module.scss";
import {StudyLink} from "shared/components/StudyLink/StudyLink";
import {action, IReactionDisposer, observable, reaction} from "mobx";
import autobind from "autobind-decorator";
import {AppStore} from "../../AppStore";
import _ from "lodash";
import ClinicalData from "./ClinicalData";
import ReactSelect from "react-select2";
import {trackEvent} from "shared/lib/tracking";

export interface IGroupComparisonPageProps {
    routing:any;
    appStore:AppStore;
}

export type GroupComparisonURLQuery = {
    sessionId: string;
    groupOrder?:string; // json stringified array of names
    unselectedGroups?:string; // json stringified array of names
    overlapStrategy?:OverlapStrategy;
};

@inject('routing', 'appStore')
@observer
export default class GroupComparisonPage extends React.Component<IGroupComparisonPageProps, {}> {
    @observable.ref private store:GroupComparisonStore;
    private queryReaction:IReactionDisposer;
    private pathnameReaction:IReactionDisposer;
    private lastQuery:Partial<GroupComparisonURLQuery>;

    constructor(props:IGroupComparisonPageProps) {
        super(props);
        this.queryReaction = reaction(
            () => props.routing.location.query,
            query => {

                if (!props.routing.location.pathname.includes("/comparison") ||
                    _.isEqual(query, this.lastQuery) ||
                    (this.lastQuery && (query.sessionId === this.lastQuery.sessionId))) {
                    return;
                }

                if (this.store) {
                    this.store.destroy();
                }

                this.store = new GroupComparisonStore((query as GroupComparisonURLQuery).sessionId, this.props.appStore, this.props.routing);
                this.setTabIdInStore(props.routing.location.pathname);
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

                this.setTabIdInStore(pathname);
            },
            {fireImmediately: true}
        );

        (window as any).groupComparisonPage = this;
    }

    private setTabIdInStore(pathname:string) {
        const tabId = getTabId(pathname);
        if (tabId) {
            this.store.setTabId(tabId);
        }
    }

    @autobind
    private setTabIdInUrl(id:string, replace?:boolean) {
        this.props.routing.updateRoute({},`comparison/${id}`, false, replace);
    }

    componentWillUnmount() {
        this.queryReaction && this.queryReaction();
        this.pathnameReaction && this.pathnameReaction();
        this.store && this.store.destroy();
    }

    readonly tabs = MakeMobxView({
        await:()=>[
            this.store._activeGroupsNotOverlapRemoved,
            this.store.activeGroups,
            this.store.mutationEnrichmentProfiles,
            this.store.copyNumberEnrichmentProfiles,
            this.store.mRNAEnrichmentProfiles,
            this.store.proteinEnrichmentProfiles,
            this.store.survivalClinicalDataExists,
        ],
        render:()=>{
            return <MSKTabs unmountOnHide={false} activeTabId={this.store.currentTabId} onTabClick={this.setTabIdInUrl} className="primaryTabs mainTabs">
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
                <MSKTab id={GroupComparisonTab.CLINICAL} linkText="Clinical"
                    anchorClassName={this.store.clinicalTabGrey ? "greyedOut" : ""}>
                    <ClinicalData store={this.store}/>
                </MSKTab>
                {this.store.showMutationsTab && (
                    <MSKTab id={GroupComparisonTab.MUTATIONS} linkText="Mutations"
                        anchorClassName={this.store.mutationsTabGrey ? "greyedOut" : ""}
                    >
                        <MutationEnrichments store={this.store}/>
                    </MSKTab>
                )}
                {this.store.showCopyNumberTab && (
                    <MSKTab id={GroupComparisonTab.CNA} linkText="Copy-number"
                        anchorClassName={this.store.copyNumberTabGrey ? "greyedOut" : ""}
                    >
                        <CopyNumberEnrichments store={this.store}/>
                    </MSKTab>
                )}
                {this.store.showMRNATab && (
                    <MSKTab id={GroupComparisonTab.MRNA} linkText="mRNA"
                        anchorClassName={this.store.mRNATabGrey ? "greyedOut" : ""}
                    >
                        <MRNAEnrichments store={this.store}/>
                    </MSKTab>
                )}
                {this.store.showProteinTab && (
                    <MSKTab id={GroupComparisonTab.PROTEIN} linkText="Protein"
                        anchorClassName={this.store.proteinTabGrey ? "greyedOut" : ""}
                    >
                        <ProteinEnrichments store={this.store}/>
                    </MSKTab>
                )}
            </MSKTabs>;
        },
        renderPending:()=><LoadingIndicator center={true} isLoading={true}  size={"big"} />,
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
            if (this.store.sessionClinicalAttributeName) {
                ret = <span>{studyHeader}Groups from <span style={{fontWeight:"bold", fontStyle:"italic"}}>{this.store.sessionClinicalAttributeName}</span></span>
            } else {
                ret = studyHeader;
            }
            return ret;
        }
    });

    @autobind
    @action
    public onOverlapStrategySelect(option:any) {
        trackEvent({ category:'groupComparison', action:'setOverlapStrategy', label:option.value});
        this.store.updateOverlapStrategy(option.value as OverlapStrategy);
    }

    readonly overlapStrategySelector = MakeMobxView({
        await:()=>[this.store.overlapComputations],
        render:()=>{
            if (!this.store.overlapComputations.result!.totalSampleOverlap && !this.store.overlapComputations.result!.totalPatientOverlap) {
                return null;
            } else {
                const includeLabel = "Include overlapping samples and patients";
                const excludeLabel = "Exclude overlapping samples and patients";
                return (
                    <div style={{minWidth:355, width:355, zIndex:20}}>
                        <ReactSelect
                            name="select overlap strategy"
                            onChange={(option:any|null)=>{
                                if (option) {
                                    this.onOverlapStrategySelect(option);
                                }
                            }}
                            options={[
                                { label: includeLabel, value: OverlapStrategy.INCLUDE },
                                { label: excludeLabel, value: OverlapStrategy.EXCLUDE }
                            ]}
                            clearable={false}
                            searchable={false}
                            value={{ label: this.store.overlapStrategy === OverlapStrategy.EXCLUDE ? excludeLabel : includeLabel, value: this.store.overlapStrategy}}
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
            <PageLayout noMargin={true} hideFooter={true} className={"subhead-dark"}>
                <div>
                    <LoadingIndicator center={true} isLoading={this.store.newSessionPending}  size={"big"} />
                    <div className={"headBlock"}>
                        <div style={{display:"flex", justifyContent:"space-between"}}>
                            {this.studyLink.component}
                            {this.overlapStrategySelector.component}
                        </div>
                        <div>
                            <div className={styles.headerControls}>
                                <GroupSelector
                                    store = {this.store}
                                />
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
