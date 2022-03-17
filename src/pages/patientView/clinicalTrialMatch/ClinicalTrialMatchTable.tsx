import * as React from 'react';
import { observable } from 'mobx';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { observer } from 'mobx-react';

import { Collapse } from 'react-bootstrap';
import { StudyListEntry } from './utils/StudyList';
import LazyMobXTable from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import ClinicalTrialMatchTableOptions from './ClinicalTrialMatchTableOptions';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import styles from 'shared/components/loadingIndicator/styles.module.scss';
import { height } from 'pages/studyView/charts/violinPlotTable/StudyViewViolinPlot';

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

interface ICollapseSearchState {
    isSearchCollapsed: boolean;
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
                    <div>{this.asFirstListElement(str)}</div>
                </div>
            );
        } else {
            return (
                <div>
                    <div>{this.asFirstListElement(str)}</div>
                    <Collapse in={this.state.isOpened}>
                        <div>{this.asHiddenListElement(str)}</div>
                    </Collapse>
                    <div className="config">
                        <button
                            className={'btn btn-default'}
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
        return res.map(i => <div>{i}</div>);
    }

    asHiddenListElement(str: String[]) {
        var res: String[] = [];
        if (str.length > this.NUM_LIST_ELEMENTS) {
            for (var i = this.NUM_LIST_ELEMENTS; i < str.length; i++) {
                res.push(str[i]);
            }
            return res.map(i => <div>{i}</div>);
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

        return (
            <div style={{ justifyContent: 'space-evenly' }}>
                {this.getDiplayStyle(this.props.elements)}
            </div>
        );
    }
}

class CompleteCollapseList extends React.PureComponent<
    ICompleteCollapseListProps,
    ICollapseListState
> {
    getDiplayStyle(str: string) {
        return (
            <div>
                <Collapse in={this.state.isOpened}>
                    <div>{str}</div>
                </Collapse>
                <div className="config">
                    <button
                        className={'btn btn-default'}
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
    ICollapseSearchState,
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
            width: 250,
            resizable: true,
        },
        {
            name: ColumnKey.EXPLAINATION,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <CollapseList elements={trial.explanation}></CollapseList>
                </div>
            ),
            width: 300,
            resizable: true,
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
            width: 350,
            resizable: true,
        },
        {
            name: ColumnKey.CONDITIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <CollapseList elements={trial.conditions}></CollapseList>
                </div>
            ),
            width: 200,
            resizable: true,
        },
        {
            name: ColumnKey.INTERVENTIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <CollapseList elements={trial.interventions}></CollapseList>
                </div>
            ),
            width: 200,
            resizable: true,
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
            resizable: true,
        },
        {
            name: ColumnKey.LOCATIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <CollapseList
                        elements={trial.locations.map(str =>
                            str
                                .replace('undefined', '')
                                .split(':')
                                .join(' | ')
                        )}
                    ></CollapseList>
                </div>
            ),
            width: 400,
            resizable: true,
        },
    ];

    @observable
    studies: StudyListEntry[] = [];

    constructor(props: IClinicalTrialMatchProps) {
        super(props);
        this.state = {
            isSearchCollapsed: false,
        };
    }

    render() {
        var loading = this.props.store.isClinicalTrialsLoading;
        return (
            <div>
                <th
                    colSpan={2}
                    style={{ padding: '10px', borderBottom: '1px solid grey' }}
                >
                    <div>
                        <button
                            style={{
                                fontSize: '2',
                                opacity: 0.4,
                                height: '22px',
                                width: '30px',
                            }}
                            onClick={() => {
                                this.setState({
                                    isSearchCollapsed: !this.state
                                        .isSearchCollapsed,
                                });
                            }}
                            children={
                                this.state.isSearchCollapsed === true
                                    ? '>>'
                                    : '<<'
                            }
                        ></button>
                        <h1 style={{ display: 'inline', paddingLeft: '20' }}>
                            Clinical Trial Search
                        </h1>
                    </div>
                </th>
                <tr>
                    <td>
                        <Collapse
                            in={!this.state.isSearchCollapsed}
                            dimension={'width'}
                        >
                            <div>
                                <ClinicalTrialMatchTableOptions
                                    store={this.props.store}
                                />
                            </div>
                        </Collapse>
                    </td>

                    <td>
                        <div>
                            <label
                                style={{
                                    paddingTop: '8px',
                                    paddingLeft: '8px',
                                }}
                            >
                                {!(this.props.clinicalTrialMatches.length > 0)
                                    ? ''
                                    : '\n' +
                                      this.props.clinicalTrialMatches.length +
                                      ' results have been found'}
                            </label>
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
                            <a
                                href="https://clinicaltrials.gov/"
                                target="_blank"
                            >
                                ClinicalTrials.gov
                            </a>
                        </div>
                    </td>
                </tr>
            </div>
        );
    }
}
