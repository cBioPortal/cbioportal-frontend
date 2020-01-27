import * as React from 'react';
import * as _ from 'lodash';
import { inject, Observer, observer } from 'mobx-react';
import { MSKTab, MSKTabs } from '../../shared/components/MSKTabs/MSKTabs';
import { computed, IReactionDisposer, reaction, observable } from 'mobx';
import {
    CustomChart,
    StudyViewPageStore,
    StudyViewPageTabDescriptions,
    StudyViewURLQuery,
} from 'pages/studyView/StudyViewPageStore';
import { StudyViewPageTabKeyEnum } from 'pages/studyView/StudyViewPageTabs';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { ClinicalDataTab } from './tabs/ClinicalDataTab';
import {
    DefaultTooltip,
    getBrowserWindow,
    isWebdriver,
    remoteData,
} from 'cbioportal-frontend-commons';
import { PageLayout } from '../../shared/components/PageLayout/PageLayout';
import IFrameLoader from '../../shared/components/iframeLoader/IFrameLoader';
import { StudySummaryTab } from 'pages/studyView/tabs/SummaryTab';
import StudyPageHeader from './studyPageHeader/StudyPageHeader';
import CNSegments from './tabs/CNSegments';

import AddChartButton from './addChartButton/AddChartButton';
import { CSSTransition } from 'react-transition-group';
import { sleep } from '../../shared/lib/TimeUtils';
import { Else, If, Then } from 'react-if';
import CustomCaseSelection from './addChartButton/customCaseSelection/CustomCaseSelection';
import { AppStore } from '../../AppStore';
import ActionButtons from './studyPageHeader/ActionButtons';
import onMobxPromise from '../../shared/lib/onMobxPromise';
import {
    GACustomFieldsEnum,
    serializeEvent,
    trackEvent,
} from '../../shared/lib/tracking';
import ComparisonGroupManager from '../groupComparison/comparisonGroupManager/ComparisonGroupManager';
import classNames from 'classnames';
import AppConfig from 'appConfig';
import SocialAuthButton from '../../shared/components/SocialAuthButton';
import { ServerConfigHelpers } from '../../config/config';
import {
    getStudyViewTabId,
    getButtonNameWithDownPointer,
} from './StudyViewUtils';
import { Alert, Modal } from 'react-bootstrap';
import 'cbioportal-frontend-commons/dist/styles.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import styles from './styles.module.scss';
import './styles.scss';

export interface IStudyViewPageProps {
    routing: any;
    appStore: AppStore;
}

@observer
export class StudyResultsSummary extends React.Component<
    { store: StudyViewPageStore; appStore: AppStore; loadingComplete: boolean },
    {}
> {
    render() {
        return (
            <div className={styles.selectedInfo} data-test="selected-info">
                <strong>Selected:&nbsp;</strong>
                <strong data-test="selected-patients">
                    {this.props.store.selectedPatients.length.toLocaleString()}
                </strong>
                &nbsp;<strong>patients</strong>&nbsp;|&nbsp;
                <strong data-test="selected-samples">
                    {this.props.store.selectedSamples.result.length.toLocaleString()}
                </strong>
                &nbsp;<strong>samples</strong>
            </div>
        );
    }
}

@inject('routing', 'appStore')
@observer
export default class StudyViewPage extends React.Component<
    IStudyViewPageProps,
    {}
> {
    private store: StudyViewPageStore;
    private enableCustomSelectionInTabs = [
        StudyViewPageTabKeyEnum.SUMMARY,
        StudyViewPageTabKeyEnum.CLINICAL_DATA,
        StudyViewPageTabKeyEnum.CN_SEGMENTS,
    ];
    private enableAddChartInTabs = [
        StudyViewPageTabKeyEnum.SUMMARY,
        StudyViewPageTabKeyEnum.CLINICAL_DATA,
    ];
    private queryReaction: IReactionDisposer;
    @observable showCustomSelectTooltip = false;
    @observable showGroupsTooltip = false;
    @observable private showReturnToDefaultChartListModal: boolean = false;
    private studyViewQueryFilter: StudyViewURLQuery;

    constructor(props: IStudyViewPageProps) {
        super(props);
        this.store = new StudyViewPageStore(
            this.props.appStore,
            ServerConfigHelpers.sessionServiceIsEnabled()
        );

        this.queryReaction = reaction(
            () => [props.routing.location.query, props.routing.location.hash],
            ([query, hash]) => {
                if (
                    !getBrowserWindow().globalStores.routing.location.pathname.includes(
                        '/study'
                    )
                ) {
                    return;
                }

                this.store.updateCurrentTab(
                    getStudyViewTabId(
                        getBrowserWindow().globalStores.routing.location
                            .pathname
                    )
                );
                const newStudyViewFilter: StudyViewURLQuery = _.pick(query, [
                    'id',
                    'studyId',
                    'cancer_study_id',
                    'filters',
                    'filterAttributeId',
                    'filterValues',
                ]);

                const filterJson = hash || getBrowserWindow().studyPageFilter;
                delete (window as any).studyPageFilter;

                if (filterJson) {
                    const filters = filterJson.match(/filterJson=([^&]*)/);
                    if (filters && filters.length > 1) {
                        newStudyViewFilter.filters = filters[1];
                    }
                }
                if (!_.isEqual(newStudyViewFilter, this.studyViewQueryFilter)) {
                    this.store.updateStoreFromURL(newStudyViewFilter);
                    this.studyViewQueryFilter = newStudyViewFilter;
                }
            },
            { fireImmediately: true }
        );

        onMobxPromise(
            this.store.queriedPhysicalStudyIds,
            (strArr: string[]) => {
                trackEvent({
                    category: 'studyPage',
                    action: 'studyPageLoad',
                    label: strArr.join(',') + ',',
                    fieldsObject: {
                        [GACustomFieldsEnum.VirtualStudy]: (
                            this.store.filteredVirtualStudies.result!.length > 0
                        ).toString(),
                    },
                });
            }
        );
    }

    componentDidMount() {
        // make the route as the default tab value
        this.props.routing.updateRoute(
            {},
            `study/${this.store.currentTab}`,
            false,
            true
        );
    }

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({}, `study/${id}`);
    }

    private chartDataPromises = remoteData({
        await: () => {
            return [
                ..._.values(this.store.clinicalDataBinPromises),
                ..._.values(this.store.clinicalDataCountPromises),
                ..._.values(this.store.customChartsPromises),
                this.store.mutationProfiles,
                this.store.cnaProfiles,
                this.store.selectedSamples,
                this.store.molecularProfileSampleCounts,
            ];
        },
        invoke: async () => {
            // this gives time for charts to render
            // product requirement that the summary data show after charts have rendered
            // to call attention to the summary results
            return await sleep(10);
        },
    });

    @computed
    get addChartButtonText() {
        if (this.store.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
            return getButtonNameWithDownPointer('Charts');
        } else if (
            this.store.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA
        ) {
            return getButtonNameWithDownPointer('Columns');
        } else {
            return '';
        }
    }

    @computed
    get groupsButton() {
        return (
            <>
                {/* MODEL FOF USER OF INFO BEACON.  YOU NEED TO CUSTOMIZE <WrappedTour> COMPONENT FOR USE CASE */}
                {/*<If condition={!isWebdriver()}>*/}
                {/*    <InfoBeacon*/}
                {/*        top={-15}*/}
                {/*        right={45}*/}
                {/*        interaction={'mouseover'}*/}
                {/*        color={'green'}*/}
                {/*        id={'groupComparison1'}*/}
                {/*    >*/}
                {/*        <WrappedTour/>*/}
                {/*    </InfoBeacon>*/}
                {/*</If>*/}
                <DefaultTooltip
                    visible={this.showGroupsTooltip}
                    trigger={['click']}
                    placement="bottomLeft"
                    destroyTooltipOnHide={true}
                    onPopupAlign={(tooltipEl: any) => {
                        const arrowEl = tooltipEl.querySelector(
                            '.rc-tooltip-arrow'
                        );
                        arrowEl.style.right = '10px';
                    }}
                    onVisibleChange={visible => {
                        this.showGroupsTooltip = !!visible;
                    }}
                    getTooltipContainer={() =>
                        document.getElementById(
                            'comparisonGroupManagerContainer'
                        )!
                    }
                    overlay={
                        <div style={{ width: 350 }}>
                            {this.props.appStore.isLoggedIn ? (
                                <ComparisonGroupManager store={this.store} />
                            ) : (
                                <span>
                                    Please log in to use the custom groups
                                    feature to save and compare sub-cohorts.
                                    <If
                                        condition={
                                            AppConfig.serverConfig
                                                .authenticationMethod &&
                                            AppConfig.serverConfig.authenticationMethod.includes(
                                                'social_auth'
                                            )
                                        }
                                    >
                                        <div
                                            className={'text-center'}
                                            style={{ padding: 20 }}
                                        >
                                            <SocialAuthButton
                                                appStore={this.props.appStore}
                                            />
                                        </div>
                                    </If>
                                </span>
                            )}
                        </div>
                    }
                >
                    <button
                        className={classNames('btn btn-primary btn-xs', {
                            active: this.showGroupsTooltip,
                        })}
                        id={'groupManagementButton'}
                        data-test="groups-button"
                        aria-pressed={this.showGroupsTooltip}
                        style={{ marginLeft: '10px' }}
                        data-event={serializeEvent({
                            action: 'openGroupManagement',
                            label: '',
                            category: 'groupComparison',
                        })}
                    >
                        {getButtonNameWithDownPointer('Groups')}
                    </button>
                </DefaultTooltip>
            </>
        );
    }

    content() {
        return (
            <div className="studyView">
                {this.store.comparisonConfirmationModal}
                {this.store.unknownQueriedIds.isComplete &&
                    this.store.unknownQueriedIds.result.length > 0 && (
                        <Alert bsStyle="danger">
                            <span>
                                Unknown/Unauthorized studies{' '}
                                {this.store.unknownQueriedIds.result.join(', ')}
                            </span>
                        </Alert>
                    )}
                <LoadingIndicator
                    size={'big'}
                    isLoading={
                        this.store.queriedSampleIdentifiers.isPending ||
                        this.store.invalidSampleIds.isPending
                    }
                    center={true}
                />
                {this.store.queriedSampleIdentifiers.isComplete &&
                    this.store.invalidSampleIds.isComplete &&
                    this.store.unknownQueriedIds.isComplete &&
                    this.store.displayedStudies.isComplete && (
                        <div>
                            <StudyPageHeader store={this.store} />

                            <div className={styles.mainTabs}>
                                <MSKTabs
                                    id="studyViewTabs"
                                    activeTabId={this.store.currentTab}
                                    onTabClick={(id: string) =>
                                        this.handleTabChange(id)
                                    }
                                    className="mainTabs"
                                    unmountOnHide={false}
                                >
                                    <MSKTab
                                        key={0}
                                        id={StudyViewPageTabKeyEnum.SUMMARY}
                                        linkText={
                                            StudyViewPageTabDescriptions.SUMMARY
                                        }
                                    >
                                        <StudySummaryTab
                                            store={this.store}
                                        ></StudySummaryTab>
                                    </MSKTab>
                                    <MSKTab
                                        key={1}
                                        id={
                                            StudyViewPageTabKeyEnum.CLINICAL_DATA
                                        }
                                        linkText={
                                            StudyViewPageTabDescriptions.CLINICAL_DATA
                                        }
                                    >
                                        <ClinicalDataTab store={this.store} />
                                    </MSKTab>
                                    <MSKTab
                                        key={2}
                                        id={StudyViewPageTabKeyEnum.HEATMAPS}
                                        linkText={
                                            StudyViewPageTabDescriptions.HEATMAPS
                                        }
                                        hide={
                                            this.store.MDACCHeatmapStudyMeta
                                                .result.length === 0
                                        }
                                    >
                                        <IFrameLoader
                                            className="mdacc-heatmap-iframe"
                                            url={`https://bioinformatics.mdanderson.org/TCGA/NGCHMPortal/?${this.store.MDACCHeatmapStudyMeta.result[0]}`}
                                        />
                                    </MSKTab>
                                    <MSKTab
                                        key={3}
                                        id={StudyViewPageTabKeyEnum.CN_SEGMENTS}
                                        linkText={
                                            StudyViewPageTabDescriptions.CN_SEGMENTS
                                        }
                                        hide={
                                            !this.store
                                                .initialMolecularProfileSampleCounts
                                                .result ||
                                            !(
                                                this.store
                                                    .initialMolecularProfileSampleCounts
                                                    .result
                                                    .numberOfCNSegmentSamples >
                                                0
                                            )
                                        }
                                    >
                                        <CNSegments store={this.store} />
                                    </MSKTab>
                                </MSKTabs>

                                <div className={styles.absolutePanel}>
                                    <Observer>
                                        {() => {
                                            // create element here to get correct mobx subscriber list
                                            const summary = (
                                                <StudyResultsSummary
                                                    store={this.store}
                                                    appStore={
                                                        this.props.appStore
                                                    }
                                                    loadingComplete={
                                                        this.chartDataPromises
                                                            .isComplete
                                                    }
                                                />
                                            );
                                            const buttons = (
                                                <ActionButtons
                                                    store={this.store}
                                                    appStore={
                                                        this.props.appStore
                                                    }
                                                    loadingComplete={
                                                        this.chartDataPromises
                                                            .isComplete
                                                    }
                                                />
                                            );

                                            return (
                                                <CSSTransition
                                                    classNames="studyFilterResult"
                                                    in={true}
                                                    appear
                                                    timeout={{ enter: 200 }}
                                                >
                                                    {() => {
                                                        return (
                                                            <div
                                                                className={
                                                                    styles.studyFilterResult
                                                                }
                                                            >
                                                                <If
                                                                    condition={
                                                                        this
                                                                            .store
                                                                            .selectedSamples
                                                                            .isComplete
                                                                    }
                                                                >
                                                                    <Then>
                                                                        {
                                                                            summary
                                                                        }
                                                                        {
                                                                            buttons
                                                                        }
                                                                    </Then>
                                                                    <Else>
                                                                        <LoadingIndicator
                                                                            isLoading={
                                                                                true
                                                                            }
                                                                            size={
                                                                                'small'
                                                                            }
                                                                            className={
                                                                                styles.selectedInfoLoadingIndicator
                                                                            }
                                                                        />
                                                                        {
                                                                            buttons
                                                                        }
                                                                    </Else>
                                                                </If>
                                                            </div>
                                                        );
                                                    }}
                                                </CSSTransition>
                                            );
                                        }}
                                    </Observer>
                                    <div
                                        id="comparisonGroupManagerContainer"
                                        style={{
                                            display: 'flex',
                                            position: 'relative',
                                        }}
                                    >
                                        {this.enableCustomSelectionInTabs.includes(
                                            this.store.currentTab
                                        ) && (
                                            <>
                                                <DefaultTooltip
                                                    visible={
                                                        this
                                                            .showCustomSelectTooltip
                                                    }
                                                    trigger={['click']}
                                                    placement={'bottomLeft'}
                                                    onVisibleChange={visible =>
                                                        (this.showCustomSelectTooltip = !!visible)
                                                    }
                                                    destroyTooltipOnHide={true}
                                                    overlay={() => (
                                                        <div
                                                            style={{
                                                                width: '350px',
                                                            }}
                                                        >
                                                            <CustomCaseSelection
                                                                allSamples={
                                                                    this.store
                                                                        .samples
                                                                        .result
                                                                }
                                                                selectedSamples={
                                                                    this.store
                                                                        .selectedSamples
                                                                        .result
                                                                }
                                                                disableGrouping={
                                                                    true
                                                                }
                                                                queriedStudies={
                                                                    this.store
                                                                        .queriedPhysicalStudyIds
                                                                        .result
                                                                }
                                                                onSubmit={(
                                                                    chart: CustomChart
                                                                ) => {
                                                                    this.showCustomSelectTooltip = false;
                                                                    this.store.updateCustomSelect(
                                                                        chart
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                >
                                                    <button
                                                        className={classNames(
                                                            'btn btn-primary btn-sm',
                                                            {
                                                                active: this
                                                                    .showCustomSelectTooltip,
                                                            }
                                                        )}
                                                        aria-pressed={
                                                            this
                                                                .showCustomSelectTooltip
                                                        }
                                                        data-test="custom-selection-button"
                                                        style={{
                                                            marginLeft: '10px',
                                                        }}
                                                    >
                                                        {getButtonNameWithDownPointer(
                                                            'Custom Selection'
                                                        )}
                                                    </button>
                                                </DefaultTooltip>
                                            </>
                                        )}
                                        {this.enableAddChartInTabs.includes(
                                            this.store.currentTab
                                        ) && (
                                            <AddChartButton
                                                buttonText={
                                                    this.addChartButtonText
                                                }
                                                store={this.store}
                                                currentTab={
                                                    this.store.currentTab
                                                }
                                                addChartOverlayClassName="studyViewAddChartOverlay"
                                                disableCustomTab={
                                                    this.store.currentTab ===
                                                    StudyViewPageTabKeyEnum.CLINICAL_DATA
                                                }
                                                showResetPopup={() => {
                                                    this.showReturnToDefaultChartListModal = true;
                                                }}
                                            />
                                        )}

                                        <Modal
                                            bsSize={'small'}
                                            show={
                                                this
                                                    .showReturnToDefaultChartListModal
                                            }
                                            onHide={() => {
                                                this.showReturnToDefaultChartListModal = false;
                                            }}
                                            keyboard
                                        >
                                            <Modal.Header closeButton>
                                                <Modal.Title>
                                                    Reset charts
                                                </Modal.Title>
                                            </Modal.Header>
                                            <Modal.Body>
                                                <div>
                                                    Please confirm that you
                                                    would like to replace the
                                                    current charts with the
                                                    default list.
                                                </div>
                                            </Modal.Body>
                                            <Modal.Footer>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    style={{
                                                        marginTop: '10px',
                                                        marginBottom: '0',
                                                    }}
                                                    onClick={() => {
                                                        this.store.resetToDefaultSettings();
                                                        this.showReturnToDefaultChartListModal = false;
                                                    }}
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    style={{
                                                        marginTop: '10px',
                                                        marginBottom: '0',
                                                    }}
                                                    onClick={() => {
                                                        this.showReturnToDefaultChartListModal = false;
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </Modal.Footer>
                                        </Modal>

                                        {ServerConfigHelpers.sessionServiceIsEnabled() &&
                                            this.groupsButton}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        );
    }

    componentWillUnmount(): void {
        this.queryReaction();
        this.store.destroy();
    }

    render() {
        return (
            <PageLayout
                noMargin={true}
                hideFooter={true}
                className={'subhead-dark'}
            >
                {this.content()}
            </PageLayout>
        );
    }
}
