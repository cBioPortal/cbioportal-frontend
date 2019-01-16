import * as React from "react";
import {observer} from "mobx-react";
import GroupComparisonStore from "./GroupComparisonStore";
import MutationEnrichments from "./MutationEnrichments";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";

export enum GroupComparisonTab {
    MUTATIONS, CNA, MRNA, PROTEIN
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
                <MSKTabs unmountOnHide={false} activeTabId={this.store.currentTabId} onTabClick={this.store.setTabId} className="secondaryTabs">
                    <MSKTab id={GroupComparisonTab.MUTATIONS.toString()} linkText="Mutations">
                        <MutationEnrichments store={this.store}/>
                    </MSKTab>
                    <MSKTab id={GroupComparisonTab.CNA.toString()} linkText="Copy-number">
                        <span>GOES HERE</span>
                    </MSKTab>
                    <MSKTab id={GroupComparisonTab.MRNA.toString()} linkText="mRNA">
                        <span>GOES HERE</span>
                    </MSKTab>
                    <MSKTab id={GroupComparisonTab.PROTEIN.toString()} linkText="Protein">
                        <span>GOES HERE</span>
                    </MSKTab>
                </MSKTabs>
            </PageLayout>
        );
    }
}