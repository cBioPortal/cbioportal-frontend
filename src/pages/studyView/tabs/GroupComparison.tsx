import * as React from "react";
import { observer } from "mobx-react";
import * as _ from 'lodash';
import { Group, SurvivalType, AnalysisGroup } from "pages/studyView/StudyViewPageStore";
import { MSKTabs, MSKTab } from "shared/components/MSKTabs/MSKTabs";
import { observable, action, computed } from "mobx";
import styles from "./styles.module.scss";
import classNames from 'classnames';
import { bind } from "bind-decorator";
import SurvivalChart, { LegendLocation } from "pages/resultsView/survival/SurvivalChart";
import MobxPromise from "mobxpromise";
import { remoteData } from "shared/api/remoteData";
import { makeSurvivalChartData } from "pages/studyView/charts/survival/StudyViewSurvivalUtils";
import { COLORS } from "pages/studyView/StudyViewUtils";

export interface IGroupComparisonProps {
    groups: Group[];
    survivalPlotData: MobxPromise<SurvivalType[]>
}

@observer
export class GroupComparison extends React.Component<IGroupComparisonProps, {}> {
    @observable activeTabId = 'survival';

    @observable private activeGroups = observable.map<boolean>();


    @bind
    @action private handleTabChange(id: string) {
        this.activeTabId = id;
    }

    @bind
    @action private toggleActive(name: string) {
        this.activeGroups.set(name, this.activeGroups.get(name) === undefined ? false : !this.activeGroups.get(name));
    }

    @computed get groupWithColors() {
        let count = -1;
        return this.props.groups.map(group => {
            count = count + 1;
            return {
                name: group.name,
                samples: group.samples,
                color: COLORS[count]
            }
        })
    }

    @computed get groups() {
        return this.groupWithColors.map(group => {
            let active = this.activeGroups.get(group.name) === undefined ? true : !!this.activeGroups.get(group.name);
            let numOfSamples = group.samples.length;
            let numOfPatients = _.uniq(group.samples.map(sample => sample.uniquePatientKey)).length;
            return (
                <GroupPill active={active} name={group.name} label={`${group.name} (${numOfSamples}/${numOfPatients})`} color={group.color} toggleActive={this.toggleActive} />
            )
        });
    }

    @computed get analysisGroups() {
        return _.reduce(this.groupWithColors, (acc, group) => {
            let isActive = this.activeGroups.get(group.name) === undefined ? true : !!this.activeGroups.get(group.name);
            if (isActive) {
                acc.push({
                    value: group.name,
                    color: group.color
                })
            }
            return acc;
        }, [] as AnalysisGroup[]);
    }

    @computed get patientToAnalysisGroup() {
        return _.reduce(this.groupWithColors, (acc, next) => {
            next.samples.forEach(sample => {
                acc[sample.uniquePatientKey] = next.name
            })
            return acc;
        }, {} as { [id: string]: string })
    }

    @computed get survivalCharts() {
        if (!_.isEmpty(this.patientToAnalysisGroup) && this.props.survivalPlotData.isComplete) {
            return _.map(this.props.survivalPlotData.result || [], (survivalData) => {
                let survivalChartData = makeSurvivalChartData(
                    survivalData.alteredGroup.concat(survivalData.unalteredGroup),
                    this.analysisGroups,
                    this.patientToAnalysisGroup,
                    true,
                    [],
                );
                return (
                    <div>
                        <span>{survivalData.title}</span>

                        <SurvivalChart
                            patientSurvivals={survivalChartData.patientSurvivals}
                            patientToAnalysisGroup={survivalChartData.patientToAnalysisGroup}
                            analysisGroups={survivalChartData.analysisGroups}
                            legendLocation={LegendLocation.TOOLTIP}
                            title={'Survival'}
                            xAxisLabel="Months Survival"
                            yAxisLabel="Surviving"
                            totalCasesHeader="Number of Cases, Total"
                            statusCasesHeader="Number of Cases, Deceased"
                            medianMonthsHeader="Median Months Survival"
                            yLabelTooltip="Survival estimate"
                            xLabelWithEventTooltip="Time of death"
                            xLabelWithoutEventTooltip="Time of last observation"
                            showDownloadButtons={false}
                            showTable={false}
                            fileName="Overall_Survival"
                            styleOpts={{
                                width: 400,
                                height: 380,
                                legend: {
                                    x: 190,
                                    y: 12
                                },
                                axis: {
                                    y: {
                                        axisLabel: {
                                            padding: 40
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                )
            })
        } else {
            return [];
        }
    };

    public render() {
        return (
            <div className={styles.main} style={{ margin: '10px' }} >
                <div className={styles.header}>
                    <span>Groups <span className={styles.sub}>(click to toggle, drag to re-order)</span></span>
                    <div className={styles.groups}>{this.groups}</div>
                </div>
                <MSKTabs id="groupComparisonTabs" activeTabId={this.activeTabId}
                    onTabClick={(id: string) => this.handleTabChange(id)}
                    vertical={true}
                    className="pillTabs">

                    <MSKTab key={0} id="overlap" linkText="Overlap">

                    </MSKTab>

                    {
                        this.survivalCharts.length > 0 &&
                        <MSKTab key={1} id="survival" linkText="Survival">
                            <div style={{ display: 'flex', padding: '0 10px' }}>
                                {this.survivalCharts}
                            </div>
                        </MSKTab>
                    }

                    <MSKTab key={2} id="differentialExpression" linkText="Mutations">

                    </MSKTab>
                    <MSKTab key={3} id="alterationFrequencies" linkText="Copy-Number">

                    </MSKTab>
                    <MSKTab key={4} id="alterationFrequencies" linkText="Expression">

                    </MSKTab>
                    <MSKTab key={5} id="clinicalAttributes" linkText="Clinical">

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
    label: string;
    toggleActive: (name: string) => void;

}

@observer
class GroupPill extends React.Component<IGroupPillProps, {}> {

    @bind
    @action private toggleActive() {
        this.props.toggleActive(this.props.name);
    }

    public render() {
        return (<div className={classNames(styles.groupPill, {
            [styles.active]: this.props.active
        })} style={{ backgroundColor: this.props.active ? this.props.color : '' }} onClick={this.toggleActive}>
            <span>{this.props.label}</span>
        </div>)
    }
}