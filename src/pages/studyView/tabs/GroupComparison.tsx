import * as React from "react";
import { observer } from "mobx-react";
import * as _ from 'lodash';
import { Group } from "pages/studyView/StudyViewPageStore";
import { MSKTabs, MSKTab } from "shared/components/MSKTabs/MSKTabs";
import { observable, action, computed } from "mobx";
import styles from "./styles.module.scss";
import classNames from 'classnames';
import { bind } from "bind-decorator";

export interface IGroupComparisonProps {
    groups: Group[];
}

@observer
export class GroupComparison extends React.Component<IGroupComparisonProps, {}> {
    @observable activeTabId = '';

    @observable private activeTabs = observable.map<boolean>();


    @bind
    @action private handleTabChange(id: string) {
        this.activeTabId = id;
    }

    @bind
    @action private toggleActive(name: string) {
        this.activeTabs.set(name, this.activeTabs.get(name) === undefined ? false : !this.activeTabs.get(name));
    }

    @computed get groups() {
        return this.props.groups.map(group => {
            let active = this.activeTabs.get(group.name) === undefined ? true : !!this.activeTabs.get(group.name);
            return (
                <GroupPill active={active} name={group.name} color='' toggleActive={this.toggleActive} />
            )
        });
    }
    public render() {
        return (
            <div style={{marginTop: '10px'}} >
                <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px' }}>Groups <sub style={{ fontStyle: 'italic' }}>(click to toggle, drag to re-order)</sub></span>
                    <div style={{ display: 'flex' }}>{this.groups}</div>
                </div>
                <MSKTabs id="groupComparisonTabs" activeTabId={this.activeTabId}
                    onTabClick={(id: string) => this.handleTabChange(id)}
                         vertical={true}
                    className="pillTabs">

                    <MSKTab key={0} id="overlap" linkText="Overlap">

                    </MSKTab>

                    <MSKTab key={1} id="survival" linkText="Survival Analysis">

                    </MSKTab>

                    <MSKTab key={2} id="differentialExpression" linkText="Differential Expression">

                    </MSKTab>
                    <MSKTab key={3} id="alterationFrequencies" linkText="Alteration Frequencies">

                    </MSKTab>

                    <MSKTab key={4} id="clinicalAttributes" linkText="Clinical Attributes">

                    </MSKTab>

                </MSKTabs>

            </div>
        );
    }
}

export interface IGroupPillProps {
    active: boolean;
    name: string;
    color: string;
    toggleActive: (name: string) => void;

}

@observer
class GroupPill extends React.Component<IGroupPillProps, {}> {

    @bind
    @action private toggleActive() {
        this.props.toggleActive(this.props.name);
    }
    public render() {
        return (<div className={styles.groupPill}>
            <a className={classNames({
                [styles.active]: this.props.active
            })} onClick={this.toggleActive}>{this.props.name}</a>
        </div>)
    }
}