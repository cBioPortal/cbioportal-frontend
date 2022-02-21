import * as React from 'react';
import { observable } from 'mobx';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { observer } from 'mobx-react';

import { Collapse } from 'react-collapse';
import { StudyListEntry } from './utils/StudyList';
import LazyMobXTable from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import ClinicalTrialMatchTableOptions from './ClinicalTrialMatchTableOptions';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

enum ColumnKey {
    NUM_FOUND = 'Appearences',
    KEYWORDS = 'Keywords Found',
    TITLE = 'Study Title',
    CONDITIONS = 'Conditions',
    NCT_NUMBER = 'NCT Number',
    STATUS = 'Status',
    LOCATIONS = 'Locations',
    INTERVENTIONS = 'Interventions',
    SCORE = 'Score',
    ELIGIBILITY = 'Eligibility Criteria',
    EXPLAINATION = 'Matching Criteria',
}

interface IClinicalTrialMatchProps {
    store: PatientViewPageStore;
    clinicalTrialMatches: IDetailedClinicalTrialMatch[];
}

interface ICollapseListState {
    isOpened: boolean;
}

interface ICollapseListProps {
    elements: string[];
}

interface ICompleteCollapseListProps {
    text: string;
}

export interface IDetailedClinicalTrialMatch {
    found: number;
    keywords: String;
    conditions: string[];
    title: String;
    nct: String;
    status: String;
    locations: string[];
    interventions: string[];
    condition_matching: boolean;
    score: number;
    eligibility: string;
    explanation: string[];
}

class ClinicalTrialMatchTableComponent extends LazyMobXTable<
    IDetailedClinicalTrialMatch
> {}

class CollapseList extends React.PureComponent<
    ICollapseListProps,
    ICollapseListState
> {
    NUM_LIST_ELEMENTS = 5;

    getDiplayStyle(str: String[]) {
        if (str.length <= this.NUM_LIST_ELEMENTS) {
            return (
                <div>
                    <ul>{this.asFirstListElement(str)}</ul>
                </div>
            );
        } else {
            return (
                <div>
                    <ul>{this.asFirstListElement(str)}</ul>
                    <Collapse isOpened={this.state.isOpened}>
                        <ul>{this.asHiddenListElement(str)}</ul>
                    </Collapse>
                    <div className="config">
                        <button
                            children={
                                !this.state.isOpened ? 'show more' : 'show less'
                            }
                            onClick={event => {
                                this.setState({
                                    isOpened: !this.state.isOpened,
                                });
                            }}
                        />
                    </div>
                </div>
            );
        }
    }

    asFirstListElement(str: String[]) {
        var res: String[] = [];
        if (str.length <= this.NUM_LIST_ELEMENTS) {
            for (var i = 0; i < str.length; i++) {
                res.push(str[i]);
            }
        } else {
            for (var i = 0; i < this.NUM_LIST_ELEMENTS; i++) {
                res.push(str[i]);
            }
        }
        return res.map(i => <li>{i}</li>);
    }

    asHiddenListElement(str: String[]) {
        var res: String[] = [];
        if (str.length > this.NUM_LIST_ELEMENTS) {
            for (var i = this.NUM_LIST_ELEMENTS; i < str.length; i++) {
                res.push(str[i]);
            }
            return res.map(i => <li>{i}</li>);
        } else {
            return <div></div>;
        }
    }

    constructor(props: ICollapseListProps) {
        super(props);
        this.state = { isOpened: false };
    }

    render() {
        const { isOpened } = this.state;
        const height = 100;

        return <div>{this.getDiplayStyle(this.props.elements)}</div>;
    }
}

class CompleteCollapseList extends React.PureComponent<
    ICompleteCollapseListProps,
    ICollapseListState
> {
    getDiplayStyle(str: string) {
        return (
            <div>
                <Collapse isOpened={this.state.isOpened}>
                    <div>{str}</div>
                </Collapse>
                <div className="config">
                    <button
                        children={!this.state.isOpened ? 'show' : 'collapse'}
                        onClick={event => {
                            this.setState({ isOpened: !this.state.isOpened });
                        }}
                    />
                </div>
            </div>
        );
    }

    constructor(props: ICompleteCollapseListProps) {
        super(props);
        this.state = { isOpened: false };
    }

    render() {
        const { isOpened } = this.state;
        const height = 100;

        return <div>{this.getDiplayStyle(this.props.text)}</div>;
    }
}

@observer
export class ClinicalTrialMatchTable extends React.Component<
    IClinicalTrialMatchProps,
    {}
> {
    private readonly ENTRIES_PER_PAGE = 10;
    private _columns = [
        /*{
            name: ColumnKey.SCORE,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>{trial.score}</div>
            ),
            width: 100,
        },*/
        {
            name: ColumnKey.STATUS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>{trial.status}</div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.EXPLAINATION,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <CollapseList elements={trial.explanation}></CollapseList>
                </div>
            ),
            width: 500,
        },
        {
            name: ColumnKey.TITLE,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <a
                        target="_blank"
                        href={
                            'https://clinicaltrials.gov/ct2/show/' + trial.nct
                        }
                    >
                        {trial.title}
                    </a>
                </div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.CONDITIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <CollapseList elements={trial.conditions}></CollapseList>
                </div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.INTERVENTIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <CollapseList elements={trial.interventions}></CollapseList>
                </div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.ELIGIBILITY,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <CompleteCollapseList
                        text={trial.eligibility}
                    ></CompleteCollapseList>
                </div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.LOCATIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <CollapseList elements={trial.locations}></CollapseList>
                </div>
            ),
            width: 300,
        },
    ];

    @observable
    studies: StudyListEntry[] = [];

    constructor(props: IClinicalTrialMatchProps) {
        super(props);
    }

    render() {
        var loading = this.props.store.isClinicalTrialsLoading;
        return (
            <div>
                <div>
                    <ClinicalTrialMatchTableOptions store={this.props.store} />
                </div>
                <div>
                    <LoadingIndicator
                        center={true}
                        isLoading={this.props.store.showLoadingScreen}
                        size="big"
                    ></LoadingIndicator>
                    <ClinicalTrialMatchTableComponent
                        data={this.props.clinicalTrialMatches}
                        columns={this._columns}
                        initialItemsPerPage={this.ENTRIES_PER_PAGE}
                    />
                </div>
                <div>
                    Powered by{' '}
                    <a href="https://oncokb.org/" target="_blank">
                        OncoKB
                    </a>{' '}
                    &{' '}
                    <a href="https://clinicaltrials.gov/" target="_blank">
                        ClinicalTrials.gov
                    </a>
                </div>
            </div>
        );
    }
}
