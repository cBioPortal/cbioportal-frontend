import * as React from 'react';
import { observable } from 'mobx';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { observer } from 'mobx-react';

import { Link } from 'react-router-dom';
import { Collapse } from 'react-bootstrap';
import { StudyListEntry } from './utils/StudyList';
import LazyMobXTable from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import ClinicalTrialMatchTableOptions from './ClinicalTrialMatchTableOptions';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import styles from 'shared/components/loadingIndicator/styles.module.scss';
import { height } from 'pages/studyView/charts/violinPlotTable/StudyViewViolinPlot';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

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
                <div>
                    <ClinicalTrialMatchTableOptions
                        store={this.props.store}
                        onHide={() => {
                            this.setState({ isSearchCollapsed: false });
                        }}
                        show={this.state.isSearchCollapsed}
                    />
                </div>
                <th style={{ padding: '5px', borderBottom: '1px solid grey' }}>
                    <div style={{ padding: '3px' }}>
                        <button
                            className={'btn btn-default'}
                            onClick={() => {
                                this.setState({
                                    isSearchCollapsed: !this.state
                                        .isSearchCollapsed,
                                });
                            }}
                        >
                            Search clinical trials
                        </button>
                    </div>
                </th>
                <th
                    style={{
                        padding: '5px',
                        borderBottom: '1px solid grey',
                        textAlign: 'right',
                    }}
                >
                    <div style={{ padding: '3px' }}>
                        <h1>Clinical Trial Search</h1>
                    </div>
                </th>
                <tr>
                    <td colSpan={2}>
                        <div>
                            <label
                                style={{
                                    paddingTop: '8px',
                                    paddingLeft: '8px',
                                }}
                            >
                                {!(this.props.clinicalTrialMatches.length > 0)
                                    ? 'No Results have been found (yet). Press the button above to modify the search parameters.'
                                    : this.props.clinicalTrialMatches.length +
                                      ' results have been found. The results are based on: '}
                            </label>
                            <label
                                style={{
                                    paddingTop: '8px',
                                    paddingLeft: '8px',
                                    visibility:
                                        this.props.clinicalTrialMatches.length >
                                        0
                                            ? 'inherit'
                                            : 'hidden',
                                }}
                            >
                                <DefaultTooltip
                                    overlayStyle={{
                                        wordWrap: 'break-word',
                                        width: '400px',
                                    }}
                                    overlay={
                                        <div>
                                            <div>
                                                <b>Mutations: </b>
                                                {this.props.store.clinicalTrialSerchParams.necSymbolsToSearch
                                                    .concat(
                                                        this.props.store
                                                            .clinicalTrialSerchParams
                                                            .symbolsToSearch
                                                    )
                                                    .join(', ')}
                                            </div>
                                            <div>
                                                <b>Tumor Entities: </b>
                                                {this.props.store.clinicalTrialSerchParams.entitiesToSearch.join(
                                                    ', '
                                                )}
                                            </div>
                                            <div>
                                                <b>Recruiting Status: </b>
                                                {this.props.store.clinicalTrialSerchParams.clinicalTrialsRecruitingStatus.join(
                                                    ', '
                                                )}
                                            </div>
                                            <div>
                                                <b>Countries: </b>
                                                {this.props.store.clinicalTrialSerchParams.clinicalTrialsCountires.join(
                                                    ', '
                                                )}
                                            </div>
                                            <div>
                                                <b>Patient Age: </b>
                                                {this.props.store
                                                    .clinicalTrialSerchParams
                                                    .age !== 0
                                                    ? this.props.store
                                                          .clinicalTrialSerchParams
                                                          .age
                                                    : ''}
                                            </div>
                                            <div>
                                                <b>Patient Location: </b>
                                                {this.props.store
                                                    .clinicalTrialSerchParams
                                                    .patientLocation.city +
                                                    ' | ' +
                                                    this.props.store
                                                        .clinicalTrialSerchParams
                                                        .patientLocation
                                                        .admin_name +
                                                    ' | ' +
                                                    this.props.store
                                                        .clinicalTrialSerchParams
                                                        .patientLocation
                                                        .country}
                                            </div>
                                            <div>
                                                <b>
                                                    Max Distance From Location:{' '}
                                                </b>
                                                {this.props.store
                                                    .clinicalTrialSerchParams
                                                    .maximumDistance !== 0
                                                    ? this.props.store
                                                          .clinicalTrialSerchParams
                                                          .maximumDistance
                                                    : ''}
                                            </div>
                                        </div>
                                    }
                                    trigger={['hover', 'focus', 'click']}
                                    destroyTooltipOnHide={true}
                                >
                                    <Link
                                        to={''}
                                        onClick={e => e.preventDefault()}
                                    >
                                        <h3>Search parameters</h3>
                                    </Link>
                                </DefaultTooltip>
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
                            </a>{' '}
                            &{' '}
                            <DefaultTooltip
                                overlay={
                                    <div>
                                        <div>
                                            The maximum distance search is
                                            powered by simplemaps.
                                        </div>
                                        <div>
                                            This database is available under the{' '}
                                            <a href="https://creativecommons.org/licenses/by/4.0/">
                                                CC BY 4.0
                                            </a>
                                        </div>
                                    </div>
                                }
                            >
                                <a
                                    href="https://simplemaps.com/data/world-cities"
                                    target="_blank"
                                >
                                    simplemaps
                                </a>
                            </DefaultTooltip>
                        </div>
                    </td>
                </tr>
            </div>
        );
    }
}
