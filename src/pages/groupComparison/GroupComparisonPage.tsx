import * as React from "react";
import {observer} from "mobx-react";
import GroupComparisonStore from "./GroupComparisonStore";
import MutationEnrichments from "./MutationEnrichments";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import ReactSelect from "react-select";
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
import { Checkbox, Button } from "react-bootstrap";
import InfoIcon from "shared/components/InfoIcon";
import { caseCountsInParens } from "./GroupComparisonUtils";

export enum GroupComparisonTab {
    OVERLAP, MUTATIONS, CNA, MRNA, PROTEIN, SURVIVAL
}

@observer
export default class GroupComparisonPage extends React.Component<{}, {}> {
    private store:GroupComparisonStore;
    constructor() {
        super();
        this.store = new GroupComparisonStore();
        (window as any).groupComparisonStore = this.store;
    }

    readonly tabs = MakeMobxView({
        await:()=>[
            this.store.mutationEnrichmentProfiles,
            this.store.copyNumberEnrichmentProfiles,
            this.store.mRNAEnrichmentProfiles,
            this.store.proteinEnrichmentProfiles,
            this.store.survivalClinicalDataExists,
            this.store.studyIds
        ],
        render:()=>{
            if ((this.store.mutationEnrichmentProfiles.result!.length > 0) ||
                (this.store.copyNumberEnrichmentProfiles.result!.length > 0) ||
                (this.store.mRNAEnrichmentProfiles.result!.length > 0) ||
                (this.store.proteinEnrichmentProfiles.result!.length > 0) ||
                this.store.showSurvivalTab
            ) {
                let mrnaAndProteinAnchorStyle:any = {};
                if(this.store.studyIds.result!.length > 1) {
                    mrnaAndProteinAnchorStyle = {color:"#afafaf"};
                }
                return <MSKTabs unmountOnHide={false} activeTabId={this.store.currentTabId} onTabClick={this.store.setTabId} className="primaryTabs">
                    {
                        this.store.showSurvivalTab &&
                        <MSKTab key={0} id={GroupComparisonTab.SURVIVAL.toString()} linkText="Survival">
                            <Survival store={this.store}/>
                        </MSKTab>
                    }
                    {this.store.mutationEnrichmentProfiles.result!.length > 0 && (
                        <MSKTab id={GroupComparisonTab.MUTATIONS.toString()} linkText="Mutations">
                            <MutationEnrichments store={this.store}/>
                        </MSKTab>
                    )}
                    {this.store.copyNumberEnrichmentProfiles.result!.length > 0 && (
                        <MSKTab id={GroupComparisonTab.CNA.toString()} linkText="Copy-number">
                            <CopyNumberEnrichments store={this.store}/>
                        </MSKTab>
                    )}
                    {this.store.mRNAEnrichmentProfiles.result!.length > 0 && (
                        <MSKTab id={GroupComparisonTab.MRNA.toString()} linkText="mRNA"
                            anchorStyle={mrnaAndProteinAnchorStyle}
                        >
                            <MRNAEnrichments store={this.store}/>
                        </MSKTab>
                    )}
                    {this.store.proteinEnrichmentProfiles.result!.length > 0 && (
                        <MSKTab id={GroupComparisonTab.PROTEIN.toString()} linkText="Protein"
                            anchorStyle={mrnaAndProteinAnchorStyle}
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

    render() {
        return (
            <PageLayout>
                <div style={{display:"flex", flexDirection:"column"}}>
                    <div style={{marginBottom:30}}>
                        <div style={{display:"flex", flexDirection:"row", alignItems:"center"}}>
                            <span style={{marginRight:10}}>Groups (click to toggle):</span>
                            <GroupSelector
                                store = {this.store}
                            />
                            <span style={{marginLeft:10}}>
                                <button type="button" className="btn" 
                                    style={{border:"1px solid #dddddd"}}
                                    onClick={this.store.toggleExcludeOverlapping}
                                >
                                    <input
                                        type="checkbox"
                                        checked={this.store.excludeOverlapping}
                                    />
                                    <span style={{marginLeft:7}}>
                                        {`Exclude overlapping samples/patients ${caseCountsInParens(this.store.overlappingSelectedSamples, this.store.overlappingSelectedPatients)}`}
                                    </span> 
                                    <div style={{display:"inline-block", marginLeft:7}}>
                                        <InfoIcon 
                                            tooltip={<span style={{maxWidth:200}}>Exclude samples from analysis which occur in more than one selected group.</span>}
                                        />
                                    </div>
                                </button>
                            </span>
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