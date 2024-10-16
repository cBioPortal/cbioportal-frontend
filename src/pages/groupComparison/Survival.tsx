import { DefaultTooltip } from 'cbioportal-frontend-commons';
import _ from 'lodash';
import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import SurvivalDescriptionTable from 'pages/resultsView/survival/SurvivalDescriptionTable';
import SurvivalPrefixTable from 'pages/resultsView/survival/SurvivalPrefixTable';
import {
    SURVIVAL_PLOT_X_LABEL_WITHOUT_EVENT_TOOLTIP,
    SURVIVAL_PLOT_X_LABEL_WITH_EVENT_TOOLTIP,
    SURVIVAL_PLOT_Y_LABEL_TOOLTIP,
} from 'pages/resultsView/survival/SurvivalUtil';
import * as React from 'react';
import 'react-rangeslider/lib/index.css';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import LeftTruncationCheckbox from 'shared/components/survival/LeftTruncationCheckbox';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { MakeMobxView } from '../../shared/components/MobxView';
import ComparisonStore, {
    OverlapStrategy,
} from '../../shared/lib/comparison/ComparisonStore';
import SurvivalChart from '../resultsView/survival/SurvivalChart';
import {
    GetHazardRatioCautionInfo,
    GetStatisticalCautionInfo,
    SURVIVAL_NOT_ENOUGH_GROUPS_MSG,
    SURVIVAL_TOO_MANY_GROUPS_MSG,
} from './GroupComparisonUtils';
import OverlapExclusionIndicator from './OverlapExclusionIndicator';
import SurvivalPageStore from './SurvivalPageStore';
import {
    GroupLegendLabelComponent,
    SurvivalTabGroupLegendLabelComponent,
} from './labelComponents/GroupLegendLabelComponent';
import survivalPlotStyle from './styles.module.scss';

export interface ISurvivalProps {
    store: ComparisonStore;
}
export const POSITIONS = [
    { label: 'First', value: 'FIRST' },
    { label: 'Last', value: 'LAST' },
];

@observer
export default class Survival extends React.Component<ISurvivalProps, {}> {
    @observable.ref private pageStore: SurvivalPageStore;
    private multipleDescriptionWarningMessageWithoutTooltip =
        'The survival data on patients from different cohorts may have been defined by ';
    private multipleDescriptionWarningMessageWithTooltip =
        'different criteria.';
    private differentDescriptionExistMessage =
        'Different descriptions of survival data were used for different studies.';

    constructor(props: ISurvivalProps) {
        super(props);
        makeObservable(this);
        this.pageStore = new SurvivalPageStore(this.props.store);
    }

    componentWillUnmount() {
        this.pageStore && this.pageStore.destroy();
    }

    @action.bound
    private onDeleteSurvivalPlot(prefix: string) {
        this.pageStore.setSurvivalPlotPrefix(undefined);
        this.pageStore.removeCustomSurvivalPlot(prefix);
    }

    readonly tabUI = MakeMobxView({
        await: () => {
            if (
                this.props.store._activeGroupsNotOverlapRemoved.isComplete &&
                this.props.store._activeGroupsNotOverlapRemoved.result.length >
                    10
            ) {
                // dont bother loading data for and computing UI if its not valid situation for it
                return [this.props.store._activeGroupsNotOverlapRemoved];
            } else {
                return [
                    this.props.store._activeGroupsNotOverlapRemoved,
                    this.survivalUI,
                    this.props.store.overlapComputations,
                    this.survivalPrefixTable,
                    this.pageStore.isLeftTruncationAvailable,
                ];
            }
        },
        render: () => {
            const numActiveGroups = this.props.store
                ._activeGroupsNotOverlapRemoved.result!.length;
            let content: any = [];
            if (numActiveGroups > 10) {
                content = <span>{SURVIVAL_TOO_MANY_GROUPS_MSG}</span>;
            } else if (numActiveGroups === 0) {
                content = <span>{SURVIVAL_NOT_ENOUGH_GROUPS_MSG}</span>;
            } else {
                var isGenieBpcStudy = this.props.store.studies.result!.find(s =>
                    s.studyId.includes('genie_bpc')
                );
                content = (
                    <>
                        <div
                            className={'tabMessageContainer'}
                            style={{ paddingBottom: 0 }}
                        >
                            <GetStatisticalCautionInfo />
                            <GetHazardRatioCautionInfo />
                            {isGenieBpcStudy &&
                                !this.pageStore.isLeftTruncationAvailable
                                    .result && (
                                    <div className="alert alert-info">
                                        <i
                                            className="fa fa-md fa-info-circle"
                                            style={{
                                                verticalAlign:
                                                    'middle !important',
                                                marginRight: 6,
                                                marginBottom: 1,
                                            }}
                                        />
                                        Kaplan-Meier estimates do not account
                                        for the lead time bias introduced by the
                                        inclusion criteria for the GENIE BPC
                                        Project.
                                    </div>
                                )}
                            <OverlapExclusionIndicator
                                store={this.props.store}
                                only="patient"
                                survivalTabMode={true}
                            />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                            }}
                        >
                            {this.survivalPrefixTable.component && (
                                <div
                                    style={{
                                        marginRight: 15,
                                        marginTop: 15,
                                        minWidth: 600,
                                        maxWidth: 600,
                                        height: 'fit-content',
                                        overflowX: 'scroll',
                                    }}
                                >
                                    {this.survivalPrefixTable.component}
                                </div>
                            )}
                            {this.survivalUI.component}
                        </div>
                    </>
                );
            }
            return (
                <div data-test="ComparisonPageSurvivalTabDiv">{content}</div>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    readonly survivalPrefixTable = MakeMobxView({
        await: () => [
            this.pageStore.survivalTitleByPrefix,
            this.pageStore.analysisGroupsComputations,
            this.pageStore.survivalPrefixes,
            this.pageStore.survivalPrefixTableDataStore,
            this.props.store.clinicalEventOptions,
        ],
        render: () => {
            const analysisGroups = this.pageStore.analysisGroupsComputations
                .result!.analysisGroups;
            const survivalTitleByPrefix = this.pageStore.survivalTitleByPrefix
                .result!;

            if (
                Object.keys(survivalTitleByPrefix).length > 1 ||
                !_.isEmpty(this.props.store.clinicalEventOptions.result)
            ) {
                // only show table if there's more than one prefix option
                return (
                    <SurvivalPrefixTable
                        groupNames={analysisGroups.map(g => g.name)}
                        survivalPrefixes={
                            this.pageStore.survivalPrefixes.result!
                        }
                        getSelectedPrefix={() =>
                            this.pageStore.selectedSurvivalPlotPrefix
                        }
                        setSelectedPrefix={this.pageStore.setSurvivalPlotPrefix}
                        dataStore={
                            this.pageStore.survivalPrefixTableDataStore.result!
                        }
                        removeCustomSurvivalPlot={this.onDeleteSurvivalPlot}
                        pageStore={this.pageStore}
                    />
                );
            } else {
                return null;
            }
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
    });

    readonly survivalUI = MakeMobxView({
        await: () => [
            this.pageStore.survivalDescriptions,
            this.pageStore.survivalXAxisLabelGroupByPrefix,
            this.pageStore.survivalClinicalAttributesPrefix,
            this.pageStore.patientSurvivals,
            this.pageStore.patientSurvivalsWithoutLeftTruncation,
            this.pageStore.allSurvivalAttributes,
            this.pageStore.analysisGroupsComputations,
            this.props.store.overlapComputations,
            this.props.store.uidToGroup,
            this.pageStore.survivalTitleByPrefix,
            this.pageStore.survivalYLabel,
            this.pageStore.sortedGroupedSurvivals,
            this.pageStore.pValuesByPrefix,
            this.pageStore.isLeftTruncationAvailable,
            this.pageStore.survivalPrefixTableDataStore,
            this.survivalPrefixTable,
            this.props.store.clinicalEventOptions,
        ],
        render: () => {
            let content: any = null;
            let plotHeader: any = null;
            const analysisGroups = this.pageStore.analysisGroupsComputations
                .result!.analysisGroups;
            const patientToAnalysisGroups = this.pageStore
                .analysisGroupsComputations.result!.patientToAnalysisGroups;
            const patientSurvivals = this.pageStore.patientSurvivals.result!;
            const attributeDescriptions: { [prefix: string]: string } = {};
            const survivalTitleByPrefix = this.pageStore.survivalTitleByPrefix
                .result!;
            const survivalYLabel = this.pageStore.survivalYLabel.result!;
            this.pageStore.survivalClinicalAttributesPrefix.result!.forEach(
                prefix => {
                    // get attribute description
                    // if only have one description, use it as plot title description
                    // if have more than one description, don't show description in title
                    attributeDescriptions[prefix] =
                        this.pageStore.survivalDescriptions.result![prefix]
                            .length === 1
                            ? this.pageStore.survivalDescriptions.result![
                                  prefix
                              ][0].description
                            : '';
                }
            );

            // do not set a default plot if there is a table component and all its data filtered out by default
            const doNotSetDefaultPlot =
                this.survivalPrefixTable.component &&
                _.isEmpty(
                    this.pageStore.survivalPrefixTableDataStore.result?.getSortedFilteredData()
                );

            // set default plot if applicable
            if (
                !doNotSetDefaultPlot &&
                this.pageStore.selectedSurvivalPlotPrefix === undefined
            ) {
                // if the table exists pick the first one from the table's store for consistency
                if (this.survivalPrefixTable.component) {
                    this.pageStore.setSurvivalPlotPrefix(
                        this.pageStore.survivalPrefixTableDataStore.result!.getSortedFilteredData()[0]
                            .prefix
                    );
                }
                // if there is no table, pick the first one from the default store
                else {
                    this.pageStore.setSurvivalPlotPrefix(
                        _.keys(patientSurvivals)[0]
                    );
                }
            }

            if (
                this.pageStore.selectedSurvivalPlotPrefix &&
                patientSurvivals?.[this.pageStore.selectedSurvivalPlotPrefix]
            ) {
                const value =
                    patientSurvivals[this.pageStore.selectedSurvivalPlotPrefix];
                const key = this.pageStore.selectedSurvivalPlotPrefix;

                if (value.length > 0) {
                    if (
                        this.pageStore.survivalDescriptions &&
                        this.pageStore.survivalDescriptions.result![key]
                            .length > 1
                    ) {
                        let messageBeforeTooltip = this
                            .multipleDescriptionWarningMessageWithoutTooltip;
                        const uniqDescriptions = _.uniq(
                            _.map(
                                this.pageStore.survivalDescriptions.result![
                                    key
                                ],
                                d => d.description
                            )
                        );
                        if (uniqDescriptions.length > 1) {
                            messageBeforeTooltip = `${this.differentDescriptionExistMessage} ${messageBeforeTooltip}`;
                        }

                        plotHeader = (
                            <div className={'tabMessageContainer'}>
                                <div
                                    className={'alert alert-warning'}
                                    role="alert"
                                >
                                    {messageBeforeTooltip}
                                    <DefaultTooltip
                                        placement="bottom"
                                        overlay={
                                            <SurvivalDescriptionTable
                                                survivalDescriptionData={
                                                    this.pageStore
                                                        .survivalDescriptions
                                                        .result![key]
                                                }
                                            />
                                        }
                                    >
                                        <a href="javascript:void(0)">
                                            {
                                                this
                                                    .multipleDescriptionWarningMessageWithTooltip
                                            }
                                        </a>
                                    </DefaultTooltip>
                                </div>
                            </div>
                        );
                    }
                    // Currently, left truncation is only appliable for Overall Survival data
                    const showLeftTruncationCheckbox =
                        key === 'OS'
                            ? this.pageStore.isLeftTruncationAvailable.result
                            : false;
                    content = (
                        <div style={{ marginBottom: 40 }}>
                            <h4 className="forceHeaderStyle h4">
                                {survivalTitleByPrefix[key]}
                            </h4>
                            <p
                                dangerouslySetInnerHTML={{
                                    __html: `${attributeDescriptions[
                                        key
                                    ].replace(/\r?\n/g, '<br/>')}`,
                                }}
                            ></p>
                            {showLeftTruncationCheckbox && (
                                <LeftTruncationCheckbox
                                    className={
                                        survivalPlotStyle.noPaddingLeftTruncationCheckbox
                                    }
                                    onToggleSurvivalPlotLeftTruncation={
                                        this.pageStore
                                            .toggleLeftTruncationSelection
                                    }
                                    isLeftTruncationChecked={
                                        this.pageStore.adjustForLeftTruncation
                                    }
                                    patientSurvivalsWithoutLeftTruncation={
                                        this.pageStore
                                            .patientSurvivalsWithoutLeftTruncation
                                            .result![key]
                                    }
                                    patientToAnalysisGroups={
                                        patientToAnalysisGroups
                                    }
                                    sortedGroupedSurvivals={
                                        this.pageStore.sortedGroupedSurvivals
                                            .result![
                                            this.pageStore
                                                .selectedSurvivalPlotPrefix
                                        ]
                                    }
                                />
                            )}
                            <div
                                data-test={'survivalTabView'}
                                className="borderedChart"
                                style={{ width: 'auto' }}
                            >
                                <SurvivalChart
                                    key={key}
                                    sortedGroupedSurvivals={
                                        this.pageStore.sortedGroupedSurvivals
                                            .result![
                                            this.pageStore
                                                .selectedSurvivalPlotPrefix
                                        ]
                                    }
                                    analysisGroups={analysisGroups}
                                    patientToAnalysisGroups={
                                        patientToAnalysisGroups
                                    }
                                    title={survivalTitleByPrefix[key]}
                                    xAxisLabel={
                                        this.pageStore
                                            .survivalXAxisLabelGroupByPrefix
                                            .result![key]
                                    }
                                    yAxisLabel={survivalYLabel[key]}
                                    totalCasesHeader="Number of Cases, Total"
                                    statusCasesHeader="Number of Events"
                                    medianMonthsHeader={`Median Months ${survivalTitleByPrefix[key]} (95% CI)`}
                                    yLabelTooltip={
                                        SURVIVAL_PLOT_Y_LABEL_TOOLTIP
                                    }
                                    xLabelWithEventTooltip={
                                        SURVIVAL_PLOT_X_LABEL_WITH_EVENT_TOOLTIP
                                    }
                                    xLabelWithoutEventTooltip={
                                        SURVIVAL_PLOT_X_LABEL_WITHOUT_EVENT_TOOLTIP
                                    }
                                    fileName={survivalTitleByPrefix[
                                        key
                                    ].replace(' ', '_')}
                                    showCurveInTooltip={true}
                                    legendLabelComponent={
                                        this.props.store.overlapStrategy ===
                                        OverlapStrategy.INCLUDE ? (
                                            <SurvivalTabGroupLegendLabelComponent
                                                maxLabelWidth={256}
                                                uidToGroup={
                                                    this.props.store.uidToGroup
                                                        .result!
                                                }
                                                dy="0.3em"
                                            />
                                        ) : (
                                            <GroupLegendLabelComponent
                                                maxLabelWidth={256}
                                                uidToGroup={
                                                    this.props.store.uidToGroup
                                                        .result!
                                                }
                                                dy="0.3em"
                                            />
                                        )
                                    }
                                    styleOpts={{
                                        tooltipYOffset: -28,
                                    }}
                                    pValue={
                                        this.pageStore.pValuesByPrefix.result![
                                            this.pageStore
                                                .selectedSurvivalPlotPrefix
                                        ]
                                    }
                                    compactMode={false}
                                />
                            </div>
                        </div>
                    );
                } else {
                    content = (
                        <div className={'alert alert-info'}>
                            {survivalTitleByPrefix[key]} not available
                        </div>
                    );
                }
            }
            // if there is actually table data, but filtered out because of the default threshold value,
            // then display a warning message that the filter can be adjusted to see available plot types.
            else if (
                this.survivalPrefixTable.component &&
                !_.isEmpty(this.pageStore.patientSurvivals.result) &&
                _.isEmpty(
                    this.pageStore.survivalPrefixTableDataStore.result?.getSortedFilteredData()
                )
            ) {
                content = (
                    <div className={'tabMessageContainer'}>
                        <div className={'alert alert-warning'} role="alert">
                            The current{' '}
                            <strong>Min. # Patients per Group</strong> is{' '}
                            <strong>
                                {
                                    this.pageStore.survivalPrefixTableDataStore
                                        .result?.patientMinThreshold
                                }
                            </strong>
                            . Adjust the filter to see comparisons for groups
                            with fewer patients.
                        </div>
                    </div>
                );
            }

            return (
                <div>
                    <div
                        className={
                            survivalPlotStyle['survivalPlotHeaderContainer']
                        }
                    >
                        <div
                            className={survivalPlotStyle['survivalPlotHeader']}
                        >
                            <ul className={'nav nav-pills'}>{plotHeader}</ul>
                        </div>
                    </div>
                    {content}
                </div>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    render() {
        if (!this.pageStore) {
            return null;
        }
        return this.tabUI.component;
    }
}
