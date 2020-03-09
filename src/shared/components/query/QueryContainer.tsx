import * as React from 'react';
import CancerStudySelector from './CancerStudySelector';
import { FlexCol, FlexRow } from '../flexbox/FlexBox';
import * as styles_any from './styles/styles.module.scss';
import MolecularProfileSelector from './MolecularProfileSelector';
import { observer } from 'mobx-react';
import DataTypePrioritySelector from './DataTypePrioritySelector';
import GenesetsSelector from './GenesetsSelector';
import GeneSetSelector from './GeneSetSelector';
import LabeledCheckbox from '../labeledCheckbox/LabeledCheckbox';
import { QueryStore } from './QueryStore';
import { providesStoreContext } from '../../lib/ContextUtils';
import CaseSetSelector from './CaseSetSelector';
import UnknownStudiesWarning from '../unknownStudies/UnknownStudiesWarning';
import classNames from 'classnames';
import LoadingIndicator from '../loadingIndicator/LoadingIndicator';
import { computed, observable } from 'mobx';
import { Else, If, Then } from 'react-if';
import autobind from 'autobind-decorator';
import SectionHeader from 'shared/components/sectionHeader/SectionHeader';
import { Fade } from 'react-reveal';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { StudySelectorStats } from 'shared/components/query/StudySelectorStats';
import $ from 'jquery';
import { serializeEvent } from 'shared/lib/tracking';
import { ModifyQueryParams } from 'pages/resultsView/ResultsViewPageStore';

const styles = styles_any as {
    QueryContainer: string;
    StudySelection: string;
    queryContainerContent: string;
    errorMessage: string;
    oqlMessage: string;
    downloadSubmitExplanation: string;
    transposeDataMatrix: string;
    submitRow: string;
    submit: string;
    genomeSpace: string;
    forkedButtons: string;
    studyName: string;
};

interface QueryContainerProps {
    store: QueryStore;
    onSubmit?: () => void;
    forkedMode?: boolean;
    modifyQueryParams?: ModifyQueryParams | undefined;
    showAlerts?: boolean;
}

@providesStoreContext(QueryStore)
@observer
export default class QueryContainer extends React.Component<
    QueryContainerProps,
    {}
> {
    get store() {
        return this.props.store;
    }

    // indicates we have loaded the study data necessary to show default selected studies (e.g. modify query scenario), studiesHaveChangedSinceInitialization indicates all data is ready and we don't need to consider other conditions anymore.
    @computed get studiesDataReady(): boolean {
        return (
            this.store.studiesHaveChangedSinceInitialization ||
            (this.store.selectableStudiesSet.isComplete &&
                this.store.initiallySelected.profileIds &&
                this.store.cancerTypes.isComplete &&
                this.store.cancerStudies.isComplete &&
                this.store.profiledSamplesCount.isComplete)
        );
    }

    @observable _showQueryControls = false;

    @computed get showQueryControls() {
        return this.props.forkedMode === false || this._showQueryControls;
    }

    constructor(props: QueryContainerProps) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    @computed get selectedStudySummary() {
        const LIMIT = 4;
        let overflow: JSX.Element | null = null;

        if (this.store.selectableSelectedStudies.length > LIMIT) {
            const overlay = () =>
                this.store.selectableSelectedStudies
                    .slice(LIMIT)
                    .map(study => <div>{study.name}</div>);
            overflow = (
                <span className={'inlineBlock'}>
                    <DefaultTooltip overlay={overlay}>
                        <a>
                            and{' '}
                            {this.store.selectableSelectedStudies.length -
                                LIMIT}{' '}
                            more
                        </a>
                    </DefaultTooltip>
                </span>
            );
        }

        return (
            <span className={'inlineBlock'}>
                {this.store.selectableSelectedStudies
                    .slice(0, LIMIT)
                    .reduce((acc: (string | JSX.Element)[], study, i, arr) => {
                        acc.push(
                            <span className={styles.studyName}>
                                {study.name}
                            </span>
                        );
                        return acc;
                    }, [])}
                {overflow}
                {overflow && <span>&nbsp;</span>}(
                <b>{this.store.profiledSamplesCount.result.all}</b>{' '}
                {this.store.profiledSamplesCount.result.all === 1
                    ? 'sample'
                    : 'total samples'}
                )
            </span>
        );
    }

    @computed get getWrappedCancerStudySelector() {
        const control = (
            <CancerStudySelector
                queryStore={this.store}
                forkedMode={this.props.forkedMode!}
            />
        );
        //NOTE: we have to wrap with div in order to deal with margin applied by css selector
        //react-reveal does not allow us to add inline-css to it's wrapper
        return this.props.forkedMode ? (
            <div style={{ marginTop: 0 }}>
                <Fade
                    duration={500}
                    collapse={false}
                    className={'monkeys'}
                    unmountOnExit={true}
                    when={!this.showQueryControls}
                >
                    {control}
                </Fade>
            </div>
        ) : (
            control
        );
    }

    handleSubmit() {
        this.store.submit();
        if (this.props.onSubmit) {
            this.props.onSubmit();
        }
    }

    @autobind
    toggleQueryControls() {
        // scroll to top
        $(document).scrollTop(0);
        this._showQueryControls = !this._showQueryControls;
    }

    @computed get studyLimitedReached() {
        return this.store.selectableSelectedStudyIds.length > 50;
    }

    @computed get exploreCohortsButtonDisabled() {
        return this.studyLimitedReached || !this.store.hasSelectedStudies;
    }

    @computed get exploreCohortsButtonTooltipMessage() {
        if (this.store.selectableSelectedStudyIds.length === 0) {
            return 'Please select at least one study above';
        } else if (this.studyLimitedReached) {
            return 'Too many studies selected for study summary (limit: 50)';
        } else {
            return 'Open summary of selected studies';
        }
    }

    @computed get queryByGeneTooltipMessage() {
        if (this.store.selectableSelectedStudies.length === 0) {
            return 'Please select at least one study above';
        } else {
            return 'Continue to query configuration';
        }
    }

    render(): JSX.Element {
        return (
            <FlexCol
                padded
                overflow
                className={classNames('small', styles.QueryContainer, {
                    forkedMode: this.props.forkedMode,
                })}
            >
                {this.props.showAlerts &&
                    this.store.genes.isComplete &&
                    this.store.genes.result.suggestions.length > 0 && (
                        <div
                            className="alert alert-danger"
                            data-test="invalidQueryAlert"
                            style={{ marginBottom: 0 }}
                        >
                            <i className={'fa fa-exclamation-triangle'} /> Your
                            query has invalid or out-dated gene symbols. Please
                            correct below.
                        </div>
                    )}

                {this.store.unknownStudyIds.isComplete && (
                    <UnknownStudiesWarning
                        ids={this.store.unknownStudyIds.result}
                    />
                )}

                {this.store.forDownloadTab && (
                    <div className={'alert alert-danger'} role="alert">
                        The Download interface has been removed. Enhanced
                        download functionality is now available through the
                        Query interface. Run a query with your gene(s) of
                        interest and use the Download tab to download all
                        available data types.
                    </div>
                )}

                {!this.store.forDownloadTab && (
                    <If
                        condition={
                            this.store.defaultSelectedIds.size === 0 ||
                            this.studiesDataReady
                        }
                    >
                        <Then>
                            <If
                                condition={
                                    this.props.forkedMode &&
                                    this.showQueryControls
                                }
                            >
                                <FlexRow className={styles.StudySelection}>
                                    <SectionHeader className={'sectionLabel'}>
                                        Selected Studies:{' '}
                                        <button
                                            data-test="modifyStudySelectionButton"
                                            className={'btn btn-default btn-xs'}
                                            onClick={this.toggleQueryControls}
                                        >
                                            Modify
                                        </button>
                                    </SectionHeader>
                                    <div style={{ marginLeft: 8 }}>
                                        {this.selectedStudySummary}
                                    </div>
                                </FlexRow>
                            </If>

                            {this.getWrappedCancerStudySelector}

                            <If condition={this.showQueryControls}>
                                <>
                                    {this.store.physicalStudyIdsInSelection
                                        .length > 1 ? (
                                        <DataTypePrioritySelector />
                                    ) : (
                                        <MolecularProfileSelector />
                                    )}

                                    {this.store.selectableSelectedStudyIds
                                        .length > 0 && (
                                        <CaseSetSelector
                                            modifyQueryParams={
                                                this.props.modifyQueryParams
                                            }
                                        />
                                    )}

                                    <GeneSetSelector />

                                    {!!this.store.isGenesetProfileSelected && (
                                        <GenesetsSelector />
                                    )}

                                    {!!this.store.forDownloadTab && (
                                        <span
                                            className={
                                                styles.downloadSubmitExplanation
                                            }
                                        >
                                            Clicking submit will generate a
                                            tab-delimited file containing your
                                            requested data.
                                        </span>
                                    )}

                                    {!!this.store.forDownloadTab && (
                                        <LabeledCheckbox
                                            labelProps={{
                                                className:
                                                    styles.transposeDataMatrix,
                                            }}
                                            checked={
                                                this.store.transposeDataMatrix
                                            }
                                            onChange={event =>
                                                (this.store.transposeDataMatrix =
                                                    event.currentTarget.checked)
                                            }
                                        >
                                            Transpose data matrix
                                        </LabeledCheckbox>
                                    )}
                                    <FlexRow
                                        overflow={true}
                                        padded
                                        className={classNames(
                                            styles.submitRow,
                                            'posRelative'
                                        )}
                                    >
                                        <button
                                            style={{
                                                paddingLeft: 50,
                                                paddingRight: 50,
                                                marginRight: 50,
                                            }}
                                            disabled={!this.store.submitEnabled}
                                            className="btn btn-primary btn-lg"
                                            onClick={() => this.handleSubmit()}
                                            data-test="queryButton"
                                        >
                                            {!this.store.forDownloadTab
                                                ? 'Submit Query'
                                                : 'Download'}
                                        </button>
                                        <FlexCol>
                                            {!!this.store.submitError && (
                                                <span
                                                    className={
                                                        styles.errorMessage
                                                    }
                                                    data-test="oqlErrorMessage"
                                                >
                                                    {this.store.submitError}
                                                </span>
                                            )}

                                            {this.store.oqlMessages.map(msg => {
                                                return (
                                                    <span
                                                        className={
                                                            styles.oqlMessage
                                                        }
                                                    >
                                                        <i
                                                            className="fa fa-info-circle"
                                                            style={{
                                                                marginRight: 5,
                                                            }}
                                                        />
                                                        {msg}
                                                    </span>
                                                );
                                            })}
                                        </FlexCol>
                                    </FlexRow>
                                </>
                            </If>
                            <If condition={!this.showQueryControls}>
                                <FlexRow className={styles.forkedButtons}>
                                    <div
                                        style={{
                                            width: 330,
                                            textAlign: 'right',
                                            marginRight: 20,
                                        }}
                                    >
                                        <StudySelectorStats
                                            store={this.store}
                                        />
                                    </div>
                                    <DefaultTooltip
                                        placement={'top'}
                                        trigger={['hover']}
                                        destroyTooltipOnHide={true}
                                        mouseEnterDelay={0}
                                        mouseLeaveDelay={0}
                                        disabled={
                                            this.store.selectableSelectedStudies
                                                .length > 0
                                        }
                                        overlay={this.queryByGeneTooltipMessage}
                                    >
                                        <a
                                            id="queryByGene"
                                            data-test="queryByGeneButton"
                                            onClick={() =>
                                                this.store.hasSelectedStudies &&
                                                this.toggleQueryControls()
                                            }
                                            data-event={serializeEvent({
                                                action:
                                                    'clickQueryByGeneButton',
                                                label: '',
                                                category: 'homePage',
                                            })}
                                            className={classNames(
                                                'btn btn-primary btn-lg',
                                                {
                                                    disabled: !this.store
                                                        .hasSelectedStudies,
                                                }
                                            )}
                                        >
                                            Query By Gene
                                        </a>
                                    </DefaultTooltip>
                                    OR
                                    <DefaultTooltip
                                        placement={'top'}
                                        trigger={['hover']}
                                        destroyTooltipOnHide={true}
                                        mouseEnterDelay={0}
                                        mouseLeaveDelay={0}
                                        disabled={
                                            !this.exploreCohortsButtonDisabled
                                        }
                                        overlay={
                                            this
                                                .exploreCohortsButtonTooltipMessage
                                        }
                                    >
                                        <a
                                            id="exploreSelectedStudies"
                                            onClick={() =>
                                                !this
                                                    .exploreCohortsButtonDisabled &&
                                                this.store.openSummary()
                                            }
                                            data-event={serializeEvent({
                                                action:
                                                    'clickExploreStudiesButton',
                                                label: '',
                                                category: 'homePage',
                                            })}
                                            className={classNames(
                                                'btn btn-primary btn-lg',
                                                {
                                                    disabled: this
                                                        .exploreCohortsButtonDisabled,
                                                }
                                            )}
                                        >
                                            <i
                                                style={{ marginTop: 5 }}
                                                className="ci ci-pie-chart"
                                            ></i>{' '}
                                            Explore Selected Studies
                                        </a>
                                    </DefaultTooltip>
                                </FlexRow>
                            </If>
                        </Then>
                        <Else>
                            <LoadingIndicator
                                isLoading={true}
                                center={true}
                                size={'big'}
                            />
                        </Else>
                    </If>
                )}
            </FlexCol>
        );
    }
}
