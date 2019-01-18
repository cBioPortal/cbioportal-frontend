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
            this.store.survivalClinicalDataExists
        ],
        render:()=>{
            if ((this.store.mutationEnrichmentProfiles.result!.length > 0) ||
                (this.store.copyNumberEnrichmentProfiles.result!.length > 0) ||
                (this.store.mRNAEnrichmentProfiles.result!.length > 0) ||
                (this.store.proteinEnrichmentProfiles.result!.length > 0) ||
                this.store.showSurvivalTab
            ) {
                return <MSKTabs unmountOnHide={false} activeTabId={this.store.currentTabId} onTabClick={this.store.setTabId} className="secondaryTabs">
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
                        <MSKTab id={GroupComparisonTab.MRNA.toString()} linkText="mRNA">
                            <MRNAEnrichments store={this.store}/>
                        </MSKTab>
                    )}
                    {this.store.proteinEnrichmentProfiles.result!.length > 0 && (
                        <MSKTab id={GroupComparisonTab.PROTEIN.toString()} linkText="Protein">
                            <ProteinEnrichments store={this.store}/>
                        </MSKTab>
                    )}
                    {
                        this.store.showSurvivalTab &&
                        <MSKTab key={0} id={GroupComparisonTab.SURVIVAL.toString()} linkText="Survival">
                            <Survival store={this.store}/>
                        </MSKTab>
                    }
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
                        { this.store.sampleGroups.isComplete && (
                            <div style={{display:"flex", alignItems:"center"}}>
                                <h3 style={{marginRight:10}}>Enrichment analysis groups:</h3>
                                <div style={{width:200, marginRight:10}}>
                                    <ReactSelect
                                        options={this.store.sampleGroups.result!.map((g, i)=>({ label: g.name || "Group", value: g.id, group: g }))}
                                        onChange={(option:any)=>(option && (this.store.setEnrichmentsGroup1(option.group)))}
                                        value={this.store.enrichmentsGroup1.result && this.store.enrichmentsGroup1.result.id}
                                        placeholder="Loading sample groups.."
                                        clearable={false}
                                        searchable={false}
                                    />
                                </div>
                                <span>vs.&nbsp;&nbsp;</span>
                                <div style={{width:200, marginRight:10}}>
                                    <ReactSelect
                                        options={this.store.sampleGroups.result!.map((g, i)=>({ label: `Group ${i}`, value: g.id, group: g }))}
                                        onChange={(option:any)=>(option && (this.store.setEnrichmentsGroup2(option.group)))}
                                        value={this.store.enrichmentsGroup2.result && this.store.enrichmentsGroup2.result.id}
                                        placeholder="Loading sample groups.."
                                        clearable={false}
                                        searchable={false}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        {this.tabs.component}
                    </div>
                </div>
            </PageLayout>
        );
    }
}