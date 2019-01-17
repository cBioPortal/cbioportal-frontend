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
    render() {
        return (
            <PageLayout noMargin={true} hideFooter={true} className={"subhead-dark"}>
                <div style={{display:"flex", flexDirection:"column"}}>
                    <div style={{marginBottom:30}}>
                        { this.store.sampleGroups.isComplete && (
                            <div style={{display:"flex", alignItems:"center"}}>
                                <h3 style={{marginRight:10}}>Enrichment analysis groups:</h3>
                                <div style={{width:200, marginRight:10}}>
                                    <ReactSelect
                                        options={this.store.sampleGroups.result!.map((g, i)=>({ label: `Group ${i}`, value: g.id, group: g }))}
                                        onChange={(option:any)=>(option && (this.store.enrichmentsGroup1 = option.group))}
                                        value={this.store.enrichmentsGroup1.id}
                                        clearable={false}
                                        searchable={false}
                                    />
                                </div>
                                <span>vs.&nbsp;&nbsp;</span>
                                <div style={{width:200, marginRight:10}}>
                                    <ReactSelect
                                        options={this.store.sampleGroups.result!.map((g, i)=>({ label: `Group ${i}`, value: g.id, group: g }))}
                                        onChange={(option:any)=>(option && (this.store.enrichmentsGroup2 = option.group))}
                                        value={this.store.enrichmentsGroup2.id}
                                        clearable={false}
                                        searchable={false}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <MSKTabs unmountOnHide={false} activeTabId={this.store.currentTabId} onTabClick={this.store.setTabId} className="secondaryTabs">
                            <MSKTab id={GroupComparisonTab.OVERLAP.toString()} linkText="Overlapping">
                                <Overlap store={this.store}/>
                            </MSKTab>
                            <MSKTab id={GroupComparisonTab.MUTATIONS.toString()} linkText="Mutations">
                                <MutationEnrichments store={this.store}/>
                            </MSKTab>
                            <MSKTab id={GroupComparisonTab.CNA.toString()} linkText="Copy-number">
                                <CopyNumberEnrichments store={this.store}/>
                            </MSKTab>
                            <MSKTab id={GroupComparisonTab.MRNA.toString()} linkText="mRNA">
                                <MRNAEnrichments store={this.store}/>
                            </MSKTab>
                            <MSKTab id={GroupComparisonTab.PROTEIN.toString()} linkText="Protein">
                                <span>GOES HERE</span>
                            </MSKTab>
                            {
                                this.store.showSurvivalTab &&
                                <MSKTab id={GroupComparisonTab.SURVIVAL.toString()} linkText="Survival">
                                    <Survival store={this.store}/>
                                </MSKTab>
                            }
                        </MSKTabs>
                    </div>
                </div>
            </PageLayout>
        );
    }
}