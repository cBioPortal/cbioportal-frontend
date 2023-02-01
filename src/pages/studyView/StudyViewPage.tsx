import * as React from 'react';
import _ from 'lodash';
import { inject, Observer, observer } from 'mobx-react';
import { MSKTab, MSKTabs } from '../../shared/components/MSKTabs/MSKTabs';
import { action, computed, observable, makeObservable } from 'mobx';
import {
    StudyViewPageStore,
    StudyViewPageTabDescriptions,
    StudyViewURLQuery,
} from 'pages/studyView/StudyViewPageStore';
import {
    extractResourceIdFromTabId,
    getStudyViewResourceTabId,
    StudyViewPageTabKeyEnum,
} from 'pages/studyView/StudyViewPageTabs';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { ClinicalDataTab } from './tabs/ClinicalDataTab';
import {
    DefaultTooltip,
    getBrowserWindow,
    remoteData,
} from 'cbioportal-frontend-commons';
import { PageLayout } from '../../shared/components/PageLayout/PageLayout';
import IFrameLoader from '../../shared/components/iframeLoader/IFrameLoader';
import { StudySummaryTab } from 'pages/studyView/tabs/SummaryTab';
import StudyPageHeader from './studyPageHeader/StudyPageHeader';
import CNSegments from './tabs/CNSegments';

import AddChartButton from './addChartButton/AddChartButton';
import { sleep } from '../../shared/lib/TimeUtils';
import { Else, If, Then } from 'react-if';
import CustomCaseSelection from './addChartButton/customCaseSelection/CustomCaseSelection';
import { AppStore } from '../../AppStore';
import ActionButtons from './studyPageHeader/ActionButtons';
import { onMobxPromise } from 'cbioportal-frontend-commons';
import {
    GACustomFieldsEnum,
    serializeEvent,
    trackEvent,
} from '../../shared/lib/tracking';
import ComparisonGroupManager from '../groupComparison/comparisonGroupManager/ComparisonGroupManager';
import classNames from 'classnames';
import { getServerConfig, ServerConfigHelpers } from '../../config/config';
import {
    AlterationMenuHeader,
    getButtonNameWithDownPointer,
    ChartMetaDataTypeEnum,
} from './StudyViewUtils';
import { Alert, Modal } from 'react-bootstrap';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import styles from './styles.module.scss';
import './styles.scss';
import autobind from 'autobind-decorator';
import { BookmarkModal } from 'pages/resultsView/bookmark/BookmarkModal';
import { ShareUrls } from 'pages/resultsView/querySummary/ShareUI';
import { getBitlyShortenedUrl } from '../../shared/lib/bitly';
import { MakeMobxView } from '../../shared/components/MobxView';
import ResourceTab from '../../shared/components/resources/ResourceTab';
import StudyViewURLWrapper from './StudyViewURLWrapper';
import ResourcesTab, { RESOURCES_TAB_NAME } from './resources/ResourcesTab';
import { ResourceData } from 'cbioportal-ts-api-client';
import $ from 'jquery';
import { StudyViewComparisonGroup } from 'pages/groupComparison/GroupComparisonUtils';
import { parse } from 'query-string';
import SettingsMenu from 'shared/components/driverAnnotations/SettingsMenu';
import ErrorScreen from 'shared/components/errorScreen/ErrorScreen';
import { CustomChartData } from 'shared/api/session-service/sessionServiceModels';
import { HelpWidget } from 'shared/components/HelpWidget/HelpWidget';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import Tooltip from 'rc-tooltip';
import { StudyViewContext } from 'pages/studyView/StudyViewContext';

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
    private urlWrapper: StudyViewURLWrapper;
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

    private toolbar: any;
    private toolbarLeftUpdater: any;
    @observable private toolbarLeft: number = 0;

    @observable showCustomSelectTooltip = false;
    @observable showAlterationFilterTooltip = false;
    @observable private showReturnToDefaultChartListModal: boolean = false;

    constructor(props: IStudyViewPageProps) {
        super(props);

        makeObservable(this);

        this.urlWrapper = new StudyViewURLWrapper(this.props.routing);

        this.store = new StudyViewPageStore(
            this.props.appStore,
            ServerConfigHelpers.sessionServiceIsEnabled(),
            this.urlWrapper
        );

        const openResourceId =
            this.urlWrapper.tabId &&
            extractResourceIdFromTabId(this.urlWrapper.tabId);
        if (openResourceId) {
            this.store.setResourceTabOpen(openResourceId, true);
        }

        getBrowserWindow().studyPage = this;

        if (
            !getBrowserWindow().globalStores.routing.location.pathname.includes(
                '/study'
            )
        ) {
            return;
        }

        const query = props.routing.query;
        const hash = props.routing.location.hash;
        // clear hash if any
        props.routing.location.hash = '';
        const newStudyViewFilter: StudyViewURLQuery = _.pick(query, [
            'id',
            'studyId',
            'cancer_study_id',
            'filterAttributeId',
            'filterValues',
        ]);

        newStudyViewFilter.filterJson = query['filters'];

        let hashString: string = hash || getBrowserWindow().studyPageFilter;
        delete (window as any).studyPageFilter;

        if (hashString) {
            const params = parse(hashString) as Partial<StudyViewURLQuery>;

            if (params.filterJson) {
                newStudyViewFilter.filterJson = params.filterJson;
            }
            if (params.sharedGroups) {
                newStudyViewFilter.sharedGroups = params.sharedGroups;
            }
            if (params.sharedCustomData) {
                newStudyViewFilter.sharedCustomData = params.sharedCustomData;
            }
        }
        if (!_.isEqual(newStudyViewFilter, this.store.studyViewQueryFilter)) {
            this.store.updateStoreFromURL(newStudyViewFilter);
            this.store.studyViewQueryFilter = newStudyViewFilter;
        }

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

        this.toolbarLeftUpdater = setInterval(() => {
            if (this.toolbar) {
                this.toolbarLeft = $(this.toolbar).position().left;
            }
        }, 500);
    }

    @autobind
    private toolbarRef(ref: any) {
        this.toolbar = ref;
    }

    private handleTabChange(id: string) {
        this.urlWrapper.setTab(id);
    }

    @observable showBookmarkModal = false;

    @action.bound
    toggleBookmarkModal() {
        this.showBookmarkModal = !this.showBookmarkModal;
    }

    @observable shareLinkModal = false;

    @action.bound
    toggleShareLinkModal() {
        this.shareLinkModal = !this.shareLinkModal;
        this.sharedGroups = [];
    }

    @action.bound
    toggleShareCustomDataLinkModal() {
        this.shareCustomDataLinkModal = !this.shareCustomDataLinkModal;
    }

    private getShareBookmarkUrl: Promise<any> = Promise.resolve(null);
    private sharedGroups: StudyViewComparisonGroup[] = [];

    @observable shareCustomDataLinkModal = false;
    private getShareCustomChartBookmarkUrl: Promise<any> = Promise.resolve(
        null
    );

    @action.bound
    openShareUrlModal(groups: StudyViewComparisonGroup[]) {
        this.shareLinkModal = true;
        this.sharedGroups = groups;
        const groupIds = groups.map(group => group.uid);
        this.getShareBookmarkUrl = Promise.resolve({
            bitlyUrl: undefined,
            fullUrl: `${window.location.protocol}//${window.location.host}${
                window.location.pathname
            }${window.location.search}#sharedGroups=${groupIds.join(',')}`,
            sessionUrl: undefined,
        });
    }

    @action.bound
    openShareCustomDataUrlModal(customDataIds: string[]) {
        this.shareCustomDataLinkModal = true;
        this.getShareCustomChartBookmarkUrl = Promise.resolve({
            bitlyUrl: undefined,
            fullUrl: `${window.location.protocol}//${window.location.host}${
                window.location.pathname
            }${window.location.search}#sharedCustomData=${customDataIds.join(
                ','
            )}`,
            sessionUrl: undefined,
        });
    }

    @autobind
    onBookmarkClick() {
        this.toggleBookmarkModal();
    }

    @action.bound
    private openResource(resource: ResourceData) {
        // open tab
        this.store.setResourceTabOpen(resource.resourceId, true);
        // go to tab
        this.urlWrapper.setTab(getStudyViewResourceTabId(resource.resourceId));
        // deep link
        this.urlWrapper.setResourceUrl(resource.url);
    }

    @action.bound
    private closeResourceTab(tabId: string) {
        // close tab
        const resourceId = extractResourceIdFromTabId(tabId);
        if (resourceId) {
            this.store.setResourceTabOpen(resourceId, false);
            // go to resources tab if we're currently on that tab
            if (
                this.urlWrapper.tabId === getStudyViewResourceTabId(resourceId)
            ) {
                this.urlWrapper.setTab(StudyViewPageTabKeyEnum.FILES_AND_LINKS);
            }
        }
    }

    @computed get shouldShowResources() {
        if (this.store.resourceIdToResourceData.isComplete) {
            return _.some(
                this.store.resourceIdToResourceData.result,
                data => data.length > 0
            );
        } else {
            return false;
        }
    }

    @computed get studyViewFullUrlWithFilter() {
        return `${window.location.protocol}//${window.location.host}${
            window.location.pathname
        }${window.location.search}#filterJson=${JSON.stringify(
            this.store.filters
        )}`;
    }

    async getBookmarkUrl(): Promise<ShareUrls> {
        const bitlyUrl = await getBitlyShortenedUrl(
            this.studyViewFullUrlWithFilter,
            getServerConfig().bitly_access_token
        );

        return {
            bitlyUrl,
            fullUrl: this.studyViewFullUrlWithFilter,
            sessionUrl: undefined,
        };
    }

    private chartDataPromises = remoteData({
        await: () => {
            return [
                ..._.values(this.store.clinicalDataBinPromises),
                ..._.values(this.store.clinicalDataCountPromises),
                ..._.values(this.store.genericAssayDataCountPromises),
                this.store.mutationProfiles,
                this.store.cnaProfiles,
                this.store.selectedSamples,
                this.store.molecularProfileSampleCounts,
                this.store.sampleTreatments,
                this.store.patientTreatments,
                this.store.patientTreatmentGroups,
                this.store.sampleTreatmentGroups,
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
                    trigger={['click']}
                    placement="bottomLeft"
                    destroyTooltipOnHide={true}
                    onPopupAlign={(tooltipEl: any) => {
                        const arrowEl = tooltipEl.querySelector(
                            '.rc-tooltip-arrow'
                        );
                        arrowEl.style.right = '10px';
                    }}
                    getTooltipContainer={() =>
                        document.getElementById(
                            'comparisonGroupManagerContainer'
                        )!
                    }
                    overlay={
                        <div style={{ width: 350 }}>
                            <ComparisonGroupManager
                                store={this.store}
                                shareGroups={this.openShareUrlModal}
                                onGroupColorChange={
                                    this.store.onGroupColorChange
                                }
                            />
                        </div>
                    }
                >
                    <button
                        className={classNames('btn btn-primary btn-xs', {
                            active: this.store.showComparisonGroupUI,
                        })}
                        id={'groupManagementButton'}
                        data-test="groups-button"
                        aria-pressed={this.store.showComparisonGroupUI}
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

    readonly resourceTabs = MakeMobxView({
        await: () => [
            this.store.resourceDefinitions,
            this.store.resourceIdToResourceData,
        ],
        render: () => {
            const openDefinitions = this.store.resourceDefinitions.result!.filter(
                d => this.store.isResourceTabOpen(d.resourceId)
            );
            const sorted = _.sortBy(openDefinitions, d => d.priority);
            const resourceDataById = this.store.resourceIdToResourceData
                .result!;

            const tabs: JSX.Element[] = sorted.reduce((list, def) => {
                const data = resourceDataById[def.resourceId];
                if (data && data.length > 0) {
                    list.push(
                        <MSKTab
                            key={getStudyViewResourceTabId(def.resourceId)}
                            id={getStudyViewResourceTabId(def.resourceId)}
                            linkText={def.displayName}
                            onClickClose={this.closeResourceTab}
                        >
                            <ResourceTab
                                resourceData={resourceDataById[def.resourceId]}
                                urlWrapper={this.urlWrapper}
                            />
                        </MSKTab>
                    );
                }
                return list;
            }, [] as JSX.Element[]);
            return tabs;
        },
    });

    content() {
        return (
            <StudyViewContext.Provider
                value={{ hesitateUpdate: this.store.hesitateUpdate }}
            >
                <div className="studyView">
                    {this.showBookmarkModal && (
                        <BookmarkModal
                            onHide={this.toggleBookmarkModal}
                            title={'Bookmark this filter'}
                            urlPromise={this.getBookmarkUrl()}
                        />
                    )}
                    {this.shareLinkModal && (
                        <BookmarkModal
                            onHide={this.toggleShareLinkModal}
                            title={
                                this.sharedGroups.length > 1
                                    ? `Share ${this.sharedGroups.length} Groups`
                                    : 'Share Group'
                            }
                            urlPromise={this.getShareBookmarkUrl}
                            description={
                                'Please send the following link to users with whom you want to share the selected group(s).'
                            }
                        />
                    )}
                    {this.shareCustomDataLinkModal && (
                        <BookmarkModal
                            onHide={this.toggleShareCustomDataLinkModal}
                            title={'Share custom data'}
                            urlPromise={this.getShareCustomChartBookmarkUrl}
                            description={
                                'Please send the following link to users with whom you want to share the selected custom data'
                            }
                        />
                    )}

                    {this.store.comparisonConfirmationModal}
                    {this.store.queriedSampleIdentifiers.isComplete &&
                        this.store.invalidSampleIds.isComplete &&
                        this.store.unknownQueriedIds.isComplete &&
                        this.store.displayedStudies.isComplete &&
                        this.store.queriedPhysicalStudies.isComplete &&
                        this.store.queriedPhysicalStudies.result.length > 0 && (
                            <div>
                                <StudyPageHeader
                                    store={this.store}
                                    onBookmarkClick={this.onBookmarkClick}
                                />

                                <div className={styles.mainTabs}>
                                    <MSKTabs
                                        id="studyViewTabs"
                                        activeTabId={this.store.currentTab}
                                        onTabClick={(id: string) =>
                                            this.handleTabChange(id)
                                        }
                                        className="mainTabs"
                                        unmountOnHide={false}
                                        getPaginationWidth={() => {
                                            return this.toolbarLeft;
                                        }} // dont run into other study view UI
                                        contentWindowExtra={
                                            <HelpWidget
                                                path={
                                                    this.props.routing.location
                                                        .pathname
                                                }
                                            />
                                        }
                                        hrefRoot={buildCBioPortalPageUrl(
                                            'study'
                                        )}
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
                                            hide={
                                                this.store.selectedSamples
                                                    .result.length === 0
                                            }
                                        >
                                            <ClinicalDataTab
                                                store={this.store}
                                            />
                                        </MSKTab>
                                        <MSKTab
                                            key={2}
                                            id={
                                                StudyViewPageTabKeyEnum.HEATMAPS
                                            }
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
                                            id={
                                                StudyViewPageTabKeyEnum.CN_SEGMENTS
                                            }
                                            linkText={
                                                StudyViewPageTabDescriptions.CN_SEGMENTS
                                            }
                                            hide={
                                                this.store.hasCNSegmentData
                                                    .isPending ||
                                                !this.store.hasCNSegmentData
                                                    .result
                                            }
                                        >
                                            <CNSegments store={this.store} />
                                        </MSKTab>
                                        <MSKTab
                                            key={4}
                                            id={
                                                StudyViewPageTabKeyEnum.FILES_AND_LINKS
                                            }
                                            linkText={RESOURCES_TAB_NAME}
                                            hide={!this.shouldShowResources}
                                        >
                                            <div>
                                                <ResourcesTab
                                                    store={this.store}
                                                    openResource={
                                                        this.openResource
                                                    }
                                                />
                                            </div>
                                        </MSKTab>

                                        {this.resourceTabs.component}
                                    </MSKTabs>

                                    <div
                                        ref={this.toolbarRef}
                                        className={styles.absolutePanel}
                                    >
                                        <div
                                            className={classNames(
                                                styles.studyFilterResult,
                                                styles.hesitateControls,
                                                'btn-group'
                                            )}
                                        >
                                            <button
                                                className={classNames(
                                                    'btn btn-default btn-sm',
                                                    styles.actionButtons
                                                )}
                                                onClick={() =>
                                                    (this.store.hesitateUpdate = !this
                                                        .store.hesitateUpdate)
                                                }
                                            >
                                                <Tooltip
                                                    placement="top"
                                                    overlayStyle={{
                                                        maxWidth: 400,
                                                    }}
                                                    overlay="Disabling autosubmit is a beta feature still under evaluation"
                                                >
                                                    <i
                                                        className={classNames(
                                                            'fa fa-info-circle',
                                                            styles.hesitateControlsAlign
                                                        )}
                                                    />
                                                </Tooltip>{' '}
                                                Autosubmit{' '}
                                                <input
                                                    className={classNames(
                                                        styles.hesitateControlsAlign
                                                    )}
                                                    type="checkbox"
                                                    checked={
                                                        !this.store
                                                            .hesitateUpdate
                                                    }
                                                />
                                            </button>
                                            <button
                                                disabled={
                                                    !this.store.hesitateUpdate
                                                }
                                                className={classNames(
                                                    'btn btn-sm btn-primary',
                                                    styles.actionButtons
                                                )}
                                                onClick={() =>
                                                    (this.store.filters = this.store.filtersProx)
                                                }
                                            >
                                                Submit ►
                                            </button>
                                        </div>
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
                                                            this
                                                                .chartDataPromises
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
                                                            this
                                                                .chartDataPromises
                                                                .isComplete
                                                        }
                                                    />
                                                );
                                                return (
                                                    <div
                                                        className={
                                                            styles.studyFilterResult
                                                        }
                                                    >
                                                        <If
                                                            condition={
                                                                this.store
                                                                    .selectedSamples
                                                                    .isComplete
                                                            }
                                                        >
                                                            <Then>
                                                                {summary}
                                                                {buttons}
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
                                                                {buttons}
                                                            </Else>
                                                        </If>
                                                    </div>
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
                                                        destroyTooltipOnHide={
                                                            true
                                                        }
                                                        overlay={() => (
                                                            <div
                                                                style={{
                                                                    width:
                                                                        '350px',
                                                                }}
                                                            >
                                                                <CustomCaseSelection
                                                                    allSamples={
                                                                        this
                                                                            .store
                                                                            .samples
                                                                            .result
                                                                    }
                                                                    selectedSamples={
                                                                        this
                                                                            .store
                                                                            .selectedSamples
                                                                            .result
                                                                    }
                                                                    disableGrouping={
                                                                        true
                                                                    }
                                                                    queriedStudies={
                                                                        this
                                                                            .store
                                                                            .queriedPhysicalStudyIds
                                                                            .result
                                                                    }
                                                                    onSubmit={(
                                                                        chart: CustomChartData
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
                                                                marginLeft:
                                                                    '10px',
                                                            }}
                                                        >
                                                            {getButtonNameWithDownPointer(
                                                                'Custom Selection'
                                                            )}
                                                        </button>
                                                    </DefaultTooltip>
                                                </>
                                            )}
                                            {getServerConfig()
                                                .skin_show_settings_menu && (
                                                <DefaultTooltip
                                                    trigger={['click']}
                                                    placement={'bottomLeft'}
                                                    overlay={
                                                        <SettingsMenu
                                                            store={this.store}
                                                            infoElement={
                                                                <AlterationMenuHeader
                                                                    includeCnaTable={
                                                                        this
                                                                            .store
                                                                            .hasCnaProfileData
                                                                    }
                                                                />
                                                            }
                                                            customDriverSourceName={
                                                                getServerConfig()
                                                                    .oncoprint_custom_driver_annotation_binary_menu_label!
                                                            }
                                                            showDriverAnnotationSection={
                                                                this.store
                                                                    .doShowDriverAnnotationSectionInGlobalMenu
                                                            }
                                                            showTierAnnotationSection={
                                                                this.store
                                                                    .doShowTierAnnotationSectionInGlobalMenu
                                                            }
                                                        />
                                                    }
                                                    visible={
                                                        this
                                                            .showAlterationFilterTooltip
                                                    }
                                                    onVisibleChange={visible => {
                                                        this.showAlterationFilterTooltip = !!visible;
                                                    }}
                                                >
                                                    <button
                                                        data-test="AlterationFilterButton"
                                                        style={{
                                                            marginLeft: '10px',
                                                        }}
                                                        className="btn btn-primary btn-sm"
                                                    >
                                                        {getButtonNameWithDownPointer(
                                                            'Alteration Filter'
                                                        )}
                                                    </button>
                                                </DefaultTooltip>
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
                                                    defaultActiveTab={
                                                        this.store
                                                            .showCustomDataSelectionUI
                                                            ? ChartMetaDataTypeEnum.CUSTOM_DATA
                                                            : ChartMetaDataTypeEnum.CLINICAL
                                                    }
                                                    addChartOverlayClassName="studyViewAddChartOverlay"
                                                    disableCustomTab={
                                                        this.store
                                                            .currentTab ===
                                                        StudyViewPageTabKeyEnum.CLINICAL_DATA
                                                    }
                                                    disableGeneSpecificTab={
                                                        this.store
                                                            .currentTab ===
                                                        StudyViewPageTabKeyEnum.CLINICAL_DATA
                                                    }
                                                    disableGenericAssayTabs={
                                                        this.store
                                                            .currentTab ===
                                                        StudyViewPageTabKeyEnum.CLINICAL_DATA
                                                    }
                                                    showResetPopup={() => {
                                                        this.showReturnToDefaultChartListModal = true;
                                                    }}
                                                    openShareCustomDataUrlModal={
                                                        this
                                                            .openShareCustomDataUrlModal
                                                    }
                                                    isShareLinkModalVisible={
                                                        this
                                                            .shareCustomDataLinkModal
                                                    }
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
                                                        would like to replace
                                                        the current charts with
                                                        the default list.
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
                                                            this.store.resetToDefaultChartSettings();
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
            </StudyViewContext.Provider>
        );
    }

    private readonly body = MakeMobxView({
        await: () => [
            this.store.unknownQueriedIds,
            this.store.queriedPhysicalStudyIds,
        ],
        render: () => {
            // we can tell if there are any valid studies
            // by looking to see if there is anything in queriedPhysicalStudyIds
            // we have to do this because studyIds property has the virtualStudy id (in that setting)
            if (
                this.store.unknownQueriedIds.result.length &&
                this.store.queriedPhysicalStudyIds.result.length === 0
            ) {
                const pluralForm =
                    this.store.unknownQueriedIds.result.length > 1
                        ? 'Studies'
                        : 'Study';
                return (
                    <ErrorScreen
                        title={`Unknown/Unauthorized ${pluralForm}`}
                        body={`The following studies are unknown or you lack privileges to view them:
                            ${this.store.unknownQueriedIds.result.join(', ')}
                            `}
                    />
                );
            } else {
                return this.content();
            }
        },
    });

    componentWillUnmount(): void {
        this.store.destroy();
        clearInterval(this.toolbarLeftUpdater);
    }

    render() {
        return (
            <PageLayout
                noMargin={true}
                hideFooter={true}
                className={'subhead-dark'}
            >
                <LoadingIndicator
                    size={'big'}
                    isLoading={
                        this.store.queriedSampleIdentifiers.isPending ||
                        this.store.invalidSampleIds.isPending ||
                        this.body.isPending
                    }
                    center={true}
                />
                {this.body.component}
            </PageLayout>
        );
    }
}
