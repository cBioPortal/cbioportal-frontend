import * as React from "react";
import * as React from 'react';
import { observer } from "mobx-react";
import * as _ from 'lodash';
import { Group } from "pages/studyView/StudyViewPageStore";
import { MSKTabs, MSKTab } from "shared/components/MSKTabs/MSKTabs";
import { observable, action } from "mobx";

export interface IGroupComparisonProps {
    groups: Group[];
}

@observer
export class GroupComparison extends React.Component<IGroupComparisonProps, {}> {
    @observable activeTabId = ''

    @action private handleTabChange(id: string) {
        this.activeTabId = id;
    }
    public render() {


        return (
            <div>
                <div>
                    <span>Groups: </span>
                </div>
                <MSKTabs id="groupComparisonTabs" activeTabId={this.activeTabId}
                    onTabClick={(id: string) => this.handleTabChange(id)}
                    className="pillTabs">

                    <MSKTab key={0} id="overlap" linkText="Overlap">

                    </MSKTab>

                    <MSKTab key={0} id="survival" linkText="Survival Analysis">

                    </MSKTab>

                    <MSKTab key={0} id="differentialExpression" linkText="Differential Expression">

                    </MSKTab>
                    <MSKTab key={0} id="alterationFrequencies" linkText="Alteration Frequencies">

                    </MSKTab>

                    <MSKTab key={0} id="clinicalAttributes" linkText="Clinical Attributes">

                    </MSKTab>

                </MSKTabs>

            </div>
        );
    }
}

