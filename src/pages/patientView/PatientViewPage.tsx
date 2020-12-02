import * as React from 'react';
import * as _ from 'lodash';
import GenomicOverview from './genomicOverview/GenomicOverview';
import {
    CancerStudy,
    ClinicalData,
    ResourceData,
} from 'cbioportal-ts-api-client';
import {
    ClinicalDataBySampleId,
    RequestStatus,
} from 'cbioportal-ts-api-client';
import { Else, If, Then } from 'react-if';
import SampleManager from './SampleManager';
import PatientHeader from './patientHeader/PatientHeader';
import SignificantMutationalSignatures from './patientHeader/SignificantMutationalSignatures';
import { PaginationControls } from '../../shared/components/paginationControls/PaginationControls';
import { IColumnVisibilityDef } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import { toggleColumnVisibility } from 'cbioportal-frontend-commons';
import {
    parseCohortIds,
    PatientViewPageStore,
    buildCohortIdsFromNavCaseIds,
} from './clinicalInformation/PatientViewPageStore';
import ClinicalInformationPatientTable from './clinicalInformation/ClinicalInformationPatientTable';
import ClinicalInformationSamples from './clinicalInformation/ClinicalInformationSamplesTable';
import { inject, Observer, observer } from 'mobx-react';
import { getSpanElementsFromCleanData } from './clinicalInformation/lib/clinicalAttributesUtil.js';
import CopyNumberTableWrapper from './copyNumberAlterations/CopyNumberTableWrapper';
import { action, computed, observable, reaction } from 'mobx';
import Timeline from './timeline/Timeline';
import { default as PatientViewMutationTable } from './mutation/PatientViewMutationTable';
import PathologyReport from './pathologyReport/PathologyReport';
import { MSKTab, MSKTabs } from '../../shared/components/MSKTabs/MSKTabs';
import { validateParametersPatientView } from '../../shared/lib/validateParameters';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ValidationAlert from 'shared/components/ValidationAlert';
import PatientViewMutationsDataStore from './mutation/PatientViewMutationsDataStore';
import AppConfig from 'appConfig';
import { getMouseIcon } from './SVGIcons';

import './patient.scss';
import IFrameLoader from '../../shared/components/iframeLoader/IFrameLoader';
import {
    getDigitalSlideArchiveIFrameUrl,
    getSampleViewUrl,
    getWholeSlideViewerUrl,
} from '../../shared/api/urls';
import { PageLayout } from '../../shared/components/PageLayout/PageLayout';
import Helmet from 'react-helmet';
import { ServerConfigHelpers } from '../../config/config';
import autobind from 'autobind-decorator';
import { showCustomTab } from '../../shared/lib/customTabs';
import { StudyLink } from '../../shared/components/StudyLink/StudyLink';
import WindowStore from 'shared/components/window/WindowStore';
import { QueryParams } from 'url';
import { AppStore } from '../../AppStore';
import request from 'superagent';
import { remoteData, getBrowserWindow } from 'cbioportal-frontend-commons';
import TrialMatchTable from './trialMatch/TrialMatchTable';

import 'cbioportal-frontend-commons/dist/styles.css';
import 'react-mutation-mapper/dist/styles.css';
import 'react-table/react-table.css';
import { trackPatient } from 'shared/lib/tracking';
import PatientViewUrlWrapper from './PatientViewUrlWrapper';
import { PagePath } from 'shared/enums/PagePaths';
import { GeneFilterOption } from './mutation/GeneFilterMenu';
import { checkNonProfiledGenesExist } from './PatientViewPageUtils';
import PatientViewMutationsTab from './mutation/PatientViewMutationsTab';
import PatientViewGenePanelModal from './PatientViewGenePanelModal/PatientViewGenePanelModal';
import {
    extractResourceIdFromTabId,
    getPatientViewResourceTabId,
    PatientViewPageTabs,
} from './PatientViewPageTabs';
import ResourcesTab, { RESOURCES_TAB_NAME } from './resources/ResourcesTab';
import { MakeMobxView } from '../../shared/components/MobxView';
import ResourceTab from '../../shared/components/resources/ResourceTab';
import PatientViewStructuralVariantTable from './structuralVariant/PatientViewStructuralVariantTable';
import TimelineWrapper from './timeline2/TimelineWrapper';
import { isFusion } from '../../shared/lib/MutationUtils';
import { Mutation } from 'cbioportal-ts-api-client';
import ClinicalEventsTables from './timeline2/ClinicalEventsTables';
import { OncoKB } from 'react-mutation-mapper';
import {
    getSampleNumericalClinicalDataValue,
    OTHER_BIOMARKERS_CLINICAL_ATTR,
} from 'shared/lib/StoreUtils';
import { CLINICAL_ATTRIBUTE_ID_ENUM } from 'shared/constants';
import { OtherBiomarkersQueryType } from 'react-mutation-mapper';
import { OtherBiomarkerAnnotation } from 'pages/patientView/oncokb/OtherBiomarkerAnnotation';
import MutationalSignaturesContainer from './mutationalSignatures/MutationalSignaturesContainer';
import SampleSummaryList from './sampleHeader/SampleSummaryList';

export interface IPatientViewPageProps {
    params: any; // react route
    routing: any;
    appStore: AppStore;
    samples?: ClinicalDataBySampleId[];
    loadClinicalInformationTableData?: () => Promise<any>;
    patient?: {
        id: string;
        clinicalData: ClinicalData[];
    };
    clinicalDataStatus?: RequestStatus;
}

export interface PatientViewUrlParams extends QueryParams {
    studyId: string;
    caseId?: string;
    sampleId?: string;
}

@inject('routing', 'appStore')
@observer
export default class PatientViewPage extends React.Component<
    IPatientViewPageProps,
    {}
> {
    @observable private mutationTableColumnVisibility:
        | { [columnId: string]: boolean }
        | undefined;
    @observable private cnaTableColumnVisibility:
        | { [columnId: string]: boolean }
        | undefined;
    @observable genePanelModal = { genePanelId: '', isOpen: false };

    // use this wrapper rather than interacting with the url directly
    @observable
    public urlWrapper: PatientViewUrlWrapper;
    private patientViewPageStore: PatientViewPageStore;

    constructor(props: IPatientViewPageProps) {
        super(props);
        this.urlWrapper = new PatientViewUrlWrapper(props.routing);
        this.patientViewPageStore = new PatientViewPageStore(
            this.props.appStore
        );

        this.dataStore = new PatientViewMutationsDataStore(
            () => this.mergedMutations,
            this.urlWrapper
        );

        getBrowserWindow().patientViewPageStore = this.patientViewPageStore;

        const openResourceId =
            this.urlWrapper.activeTabId &&
            extractResourceIdFromTabId(this.urlWrapper.activeTabId);
        if (openResourceId) {
            this.patientViewPageStore.setResourceTabOpen(openResourceId, true);
        }

        reaction(
            () => [this.urlWrapper.query.caseId, this.urlWrapper.query.studyId],
            ([_, studyId]) => {
                if (
                    studyId &&
                    this.props.routing.location.pathname.includes(
                        '/' + PagePath.Patient
                    )
                ) {
                    trackPatient(studyId);
                }
            },
            { fireImmediately: true }
        );

        //TODO: this should be done by a module so that it can be reused on other pages
        reaction(
            () => [
                props.routing.query,
                props.routing.location.hash,
                props.routing.location.pathname,
            ],
            ([query, hash, pathname]) => {
                // we don't want to update patient if we aren't on a patient page route
                if (!pathname.includes('/' + PagePath.Patient)) {
                    return;
                }

                const validationResult = validateParametersPatientView(query);

                if (validationResult.isValid) {
                    this.patientViewPageStore.urlValidationError = null;

                    if ('studyId' in query) {
                        this.patientViewPageStore.studyId = query.studyId;
                    }
                    if ('caseId' in query) {
                        this.patientViewPageStore.setPatientId(
                            query.caseId as string
                        );
                    } else if ('sampleId' in query) {
                        this.patientViewPageStore.setSampleId(
                            query.sampleId as string
                        );
                    }

                    // if there is a navCaseId list in url
                    const navCaseIdMatch = hash.match(/navCaseIds=([^&]*)/);
                    if (navCaseIdMatch && navCaseIdMatch.length > 1) {
                        this.patientViewPageStore.patientIdsInCohort = parseCohortIds(
                            navCaseIdMatch[1]
                        );
                    }
                } else {
                    this.patientViewPageStore.urlValidationError =
                        validationResult.message;
                }
            },
            { fireImmediately: true }
        );
    }

    private dataStore: PatientViewMutationsDataStore;

    @computed get mergedMutations() {
        // remove fusions
        return this.patientViewPageStore.mergedMutationDataIncludingUncalledFilteredByGene.filter(
            mutationArray => {
                return !isFusion(mutationArray[0]);
            }
        );
    }

    componentDidMount() {
        // Load posted data, if it exists
        const postData = getBrowserWindow().clientPostedData;
        if (postData && postData.navCaseIds) {
            this.patientViewPageStore.patientIdsInCohort = buildCohortIdsFromNavCaseIds(
                postData.navCaseIds
            );
            getBrowserWindow().clientPostedData = null;
        }
    }

    public get showNewTimeline() {
        return !AppConfig.serverConfig.patient_view_use_legacy_timeline;
    }

    public get showOldTimeline() {
        return AppConfig.serverConfig.patient_view_use_legacy_timeline;
    }

    @autobind
    @action
    public handleSampleClick(
        id: string,
        e: React.MouseEvent<HTMLAnchorElement>
    ) {
        if (!e.shiftKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            this.urlWrapper.updateURL({ caseId: undefined, sampleId: id });
        }
        // otherwise do nothing, we want default behavior of link
        // namely that href will open in a new window/tab
    }

    @autobind
    @action
    private handlePatientClick(id: string) {
        let values = id.split(':');
        if (values.length == 2) {
            this.urlWrapper.updateURL({
                studyId: values[0],
                caseId: values[1],
                sampleId: undefined,
            });
        } else {
            this.urlWrapper.updateURL({ caseId: id, sampleId: undefined });
        }
    }

    @computed get cnaTableStatus() {
        if (this.patientViewPageStore.molecularProfileIdDiscrete.isComplete) {
            if (
                this.patientViewPageStore.molecularProfileIdDiscrete.result ===
                undefined
            ) {
                return 'unavailable';
            } else if (this.patientViewPageStore.discreteCNAData.isComplete) {
                return 'available';
            } else {
                return 'loading';
            }
        } else {
            return 'loading';
        }
    }

    @computed get isSampleSummaryListLoading() {
        return (
            this.patientViewPageStore.studyMetaData.isPending ||
            this.patientViewPageStore.hasMutationalSignatureData.isPending ||
            this.patientViewPageStore.mutationalSignatureDataGroupByVersion
                .isPending ||
            this.patientViewPageStore.allSamplesForPatient.isPending
        );
    }

    @computed get showWholeSlideViewerTab() {
        return (
            this.patientViewPageStore.clinicalDataForSamples.isComplete &&
            _.some(
                this.patientViewPageStore.clinicalDataForSamples.result,
                s => {
                    return s.clinicalAttributeId === 'MSK_SLIDE_ID';
                }
            )
        );
    }

    @autobind
    @action
    private onCnaTableColumnVisibilityToggled(
        columnId: string,
        columnVisibility?: IColumnVisibilityDef[]
    ) {
        this.cnaTableColumnVisibility = toggleColumnVisibility(
            this.cnaTableColumnVisibility,
            columnId,
            columnVisibility
        );
    }

    @autobind
    @action
    private onMutationTableColumnVisibilityToggled(
        columnId: string,
        columnVisibility?: IColumnVisibilityDef[]
    ) {
        this.mutationTableColumnVisibility = toggleColumnVisibility(
            this.mutationTableColumnVisibility,
            columnId,
            columnVisibility
        );
    }

    @computed
    private get shouldShowResources(): boolean {
        if (this.patientViewPageStore.resourceIdToResourceData.isComplete) {
            return _.some(
                this.patientViewPageStore.resourceIdToResourceData.result,
                data => data.length > 0
            );
        } else {
            return false;
        }
    }

    @computed
    private get shouldShowPathologyReport(): boolean {
        return (
            this.patientViewPageStore.pathologyReport.isComplete &&
            this.patientViewPageStore.pathologyReport.result.length > 0
        );
    }

    @computed
    private get hideTissueImageTab() {
        return (
            this.patientViewPageStore.hasTissueImageIFrameUrl.isPending ||
            this.patientViewPageStore.hasTissueImageIFrameUrl.isError ||
            (this.patientViewPageStore.hasTissueImageIFrameUrl.isComplete &&
                !this.patientViewPageStore.hasTissueImageIFrameUrl.result)
        );
    }

    @computed
    private get shouldShowTrialMatch(): boolean {
        return (
            getBrowserWindow().localStorage.trialmatch === 'true' &&
            this.patientViewPageStore.detailedTrialMatches.isComplete &&
            this.patientViewPageStore.detailedTrialMatches.result.length > 0
        );
    }

    @autobind
    private customTabMountCallback(div: HTMLDivElement, tab: any) {
        showCustomTab(
            div,
            tab,
            this.props.routing.location,
            this.patientViewPageStore
        );
    }

    private wholeSlideViewerUrl = remoteData<string | undefined>({
        await: () => [this.patientViewPageStore.getWholeSlideViewerIds],
        invoke: async () => {
            if (
                !_.isEmpty(
                    this.patientViewPageStore.getWholeSlideViewerIds.result
                )
            ) {
                const url = getWholeSlideViewerUrl(
                    this.patientViewPageStore.getWholeSlideViewerIds.result!,
                    this.props.appStore.userName!
                );
                //if request succeeds then we return the url because we know request works.
                try {
                    await request.get(url);
                    return url;
                } catch (er) {
                    //but if request fails, we will return undefined.
                    return undefined;
                }
            }
            return undefined;
        },
    });

    @autobind
    private onFilterGenesMutationTable(option: GeneFilterOption): void {
        this.patientViewPageStore.mutationTableGeneFilterOption = option;
    }

    @autobind
    private onFilterGenesCopyNumberTable(option: GeneFilterOption): void {
        this.patientViewPageStore.copyNumberTableGeneFilterOption = option;
    }

    @autobind
    @action
    toggleGenePanelModal(genePanelId?: string | undefined) {
        this.genePanelModal = {
            isOpen: !this.genePanelModal.isOpen,
            genePanelId: genePanelId || '',
        };
    }

    @computed get modalSelectedGenePanel() {
        return this.patientViewPageStore.genePanelIdToPanel.result[
            this.genePanelModal.genePanelId
        ];
    }

    @autobind
    private onMutationTableRowClick(d: Mutation[]) {
        if (d.length) {
            this.dataStore.toggleSelectedMutation(d[0]);
        }
    }
    @autobind
    private onMutationTableRowMouseEnter(d: Mutation[]) {
        if (d.length) {
            this.dataStore.setMouseOverMutation(d[0]);
        }
    }
    @autobind
    private onMutationTableRowMouseLeave() {
        this.dataStore.setMouseOverMutation(null);
    }

    readonly resourceTabs = MakeMobxView({
        await: () => [
            this.patientViewPageStore.resourceDefinitions,
            this.patientViewPageStore.resourceIdToResourceData,
        ],
        render: () => {
            const openDefinitions = this.patientViewPageStore.resourceDefinitions.result!.filter(
                d => this.patientViewPageStore.isResourceTabOpen(d.resourceId)
            );
            const sorted = _.sortBy(openDefinitions, d => d.priority);
            const resourceDataById = this.patientViewPageStore
                .resourceIdToResourceData.result!;

            const tabs: JSX.Element[] = sorted.reduce((list, def) => {
                const data = resourceDataById[def.resourceId];
                if (data && data.length > 0) {
                    list.push(
                        <MSKTab
                            key={getPatientViewResourceTabId(def.resourceId)}
                            id={getPatientViewResourceTabId(def.resourceId)}
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

    @autobind
    @action
    private openResource(resource: ResourceData) {
        // first we make the resource tab visible
        this.patientViewPageStore.setResourceTabOpen(resource.resourceId, true);
        // next, navigate to that tab
        this.urlWrapper.setActiveTab(
            getPatientViewResourceTabId(resource.resourceId)
        );
        // finally, within that tab, navigate to the specific target link, e.g. if there are multiple for the same resource
        this.urlWrapper.setResourceUrl(resource.url);
    }

    @autobind
    @action
    private closeResourceTab(tabId: string) {
        const resourceId = extractResourceIdFromTabId(tabId);
        if (resourceId) {
            // hide the resource tab
            this.patientViewPageStore.setResourceTabOpen(resourceId, false);

            // then, if we were currently on that tab..
            if (
                this.urlWrapper.activeTabId ===
                getPatientViewResourceTabId(resourceId)
            ) {
                // ..navigate to the files & links tab
                this.urlWrapper.setActiveTab(PatientViewPageTabs.FilesAndLinks);
            }
        }
    }

    @autobind
    @action
    private onMutationalSignatureVersionChange(version: string) {
        this.patientViewPageStore.setMutationalSignaturesVersion(version);
    }

    public render() {
        let sampleManager: SampleManager | null = null;
        if (this.patientViewPageStore.sampleManager.isComplete) {
            sampleManager = this.patientViewPageStore.sampleManager.result!;
        }
        let cohortNav: JSX.Element | null = null;
        let studyName: JSX.Element | null = null;

        if (this.patientViewPageStore.urlValidationError) {
            return (
                <ValidationAlert
                    urlValidationError={
                        this.patientViewPageStore.urlValidationError
                    }
                />
            );
        }

        if (this.patientViewPageStore.studyMetaData.isComplete) {
            let study: CancerStudy = this.patientViewPageStore.studyMetaData
                .result;
            studyName = (
                <StudyLink studyId={study.studyId}>{study.name}</StudyLink>
            );
        }

        if (
            this.patientViewPageStore.patientIdsInCohort &&
            this.patientViewPageStore.patientIdsInCohort.length > 0
        ) {
            const indexInCohort = this.patientViewPageStore.patientIdsInCohort.indexOf(
                this.patientViewPageStore.studyId +
                    ':' +
                    this.patientViewPageStore.patientId
            );
            cohortNav = (
                <PaginationControls
                    currentPage={indexInCohort + 1}
                    showMoreButton={false}
                    showItemsPerPageSelector={false}
                    showFirstPage={true}
                    showLastPage={true}
                    textBetweenButtons={` of ${this.patientViewPageStore.patientIdsInCohort.length} patients`}
                    firstPageDisabled={indexInCohort === 0}
                    previousPageDisabled={indexInCohort === 0}
                    nextPageDisabled={
                        indexInCohort ===
                        this.patientViewPageStore.patientIdsInCohort.length - 1
                    }
                    lastPageDisabled={
                        indexInCohort ===
                        this.patientViewPageStore.patientIdsInCohort.length - 1
                    }
                    onFirstPageClick={() =>
                        this.handlePatientClick(
                            this.patientViewPageStore.patientIdsInCohort[0]
                        )
                    }
                    onPreviousPageClick={() =>
                        this.handlePatientClick(
                            this.patientViewPageStore.patientIdsInCohort[
                                indexInCohort - 1
                            ]
                        )
                    }
                    onNextPageClick={() =>
                        this.handlePatientClick(
                            this.patientViewPageStore.patientIdsInCohort[
                                indexInCohort + 1
                            ]
                        )
                    }
                    onLastPageClick={() =>
                        this.handlePatientClick(
                            this.patientViewPageStore.patientIdsInCohort[
                                this.patientViewPageStore.patientIdsInCohort
                                    .length - 1
                            ]
                        )
                    }
                    onChangeCurrentPage={newPage => {
                        if (
                            newPage > 0 &&
                            newPage <=
                                this.patientViewPageStore.patientIdsInCohort
                                    .length
                        ) {
                            this.handlePatientClick(
                                this.patientViewPageStore.patientIdsInCohort[
                                    newPage - 1
                                ]
                            );
                        }
                    }}
                    pageNumberEditable={true}
                    className="cohortNav"
                />
            );
        }

        return (
            <PageLayout noMargin={true} hideFooter={true}>
                {this.patientViewPageStore.patientViewData.isComplete && (
                    <Helmet>
                        <title>{this.patientViewPageStore.pageTitle}</title>
                        <meta
                            name="description"
                            content={this.patientViewPageStore.metaDescription}
                        />
                    </Helmet>
                )}
                <div className="patientViewPage">
                    {this.genePanelModal.isOpen && (
                        <PatientViewGenePanelModal
                            genePanel={this.modalSelectedGenePanel}
                            show={this.genePanelModal.isOpen}
                            onHide={this.toggleGenePanelModal}
                            columns={3}
                        />
                    )}
                    <div className="headBlock">
                        {this.patientViewPageStore.patientViewData
                            .isComplete && (
                            <div className="patientPageHeader">
                                <i
                                    className="fa fa-user-circle-o patientIcon"
                                    aria-hidden="true"
                                ></i>
                                <div className="patientDataTable">
                                    <table>
                                        <tr>
                                            <td>Patient:</td>
                                            <td>
                                                <PatientHeader
                                                    handlePatientClick={(
                                                        id: string
                                                    ) =>
                                                        this.handlePatientClick(
                                                            id
                                                        )
                                                    }
                                                    patient={
                                                        this
                                                            .patientViewPageStore
                                                            .patientViewData
                                                            .result.patient
                                                    }
                                                    studyId={
                                                        this
                                                            .patientViewPageStore
                                                            .studyId
                                                    }
                                                    darwinUrl={
                                                        this
                                                            .patientViewPageStore
                                                            .darwinUrl.result
                                                    }
                                                    sampleManager={
                                                        sampleManager
                                                    }
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Samples:</td>
                                            <td>
                                                <div className="patientSamples">
                                                    {sampleManager !== null && (
                                                        <If
                                                            condition={
                                                                this
                                                                    .isSampleSummaryListLoading
                                                            }
                                                        >
                                                            <Then>
                                                                <LoadingIndicator
                                                                    isLoading={
                                                                        true
                                                                    }
                                                                />
                                                            </Then>
                                                            <Else>
                                                                <SampleSummaryList
                                                                    sampleManager={
                                                                        sampleManager
                                                                    }
                                                                    patientViewPageStore={
                                                                        this
                                                                            .patientViewPageStore
                                                                    }
                                                                    handleSampleClick={
                                                                        this
                                                                            .handleSampleClick
                                                                    }
                                                                    toggleGenePanelModal={
                                                                        this
                                                                            .toggleGenePanelModal
                                                                    }
                                                                    genePanelModal={
                                                                        this
                                                                            .genePanelModal
                                                                    }
                                                                    handlePatientClick={
                                                                        this
                                                                            .handlePatientClick
                                                                    }
                                                                />
                                                            </Else>
                                                        </If>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                <div className="studyMetaBar">
                                    {studyName}{' '}
                                    <If condition={cohortNav != null}>
                                        {cohortNav}
                                    </If>
                                </div>
                            </div>
                        )}
                    </div>
                    <If
                        condition={
                            this.patientViewPageStore.patientViewData.isComplete
                        }
                    >
                        <Then>
                            <MSKTabs
                                id="patientViewPageTabs"
                                activeTabId={this.urlWrapper.activeTabId}
                                onTabClick={(id: string) =>
                                    this.urlWrapper.setActiveTab(id)
                                }
                                className="mainTabs"
                                getPaginationWidth={WindowStore.getWindowWidth}
                            >
                                <MSKTab
                                    key={0}
                                    id={PatientViewPageTabs.Summary}
                                    linkText="Summary"
                                >
                                    <LoadingIndicator
                                        isLoading={
                                            this.patientViewPageStore
                                                .clinicalEvents.isPending
                                        }
                                    />

                                    {!!sampleManager &&
                                        this.patientViewPageStore.clinicalEvents
                                            .isComplete &&
                                        this.patientViewPageStore.clinicalEvents
                                            .result.length > 0 && (
                                            <div>
                                                <div
                                                    style={{
                                                        marginTop: 20,
                                                        marginBottom: 20,
                                                    }}
                                                >
                                                    {' '}
                                                    {this.showNewTimeline && (
                                                        <TimelineWrapper
                                                            dataStore={
                                                                this.dataStore
                                                            }
                                                            caseMetaData={{
                                                                color:
                                                                    sampleManager.sampleColors,
                                                                label:
                                                                    sampleManager.sampleLabels,
                                                                index:
                                                                    sampleManager.sampleIndex,
                                                            }}
                                                            data={
                                                                this
                                                                    .patientViewPageStore
                                                                    .clinicalEvents
                                                                    .result
                                                            }
                                                            sampleManager={
                                                                sampleManager
                                                            }
                                                            width={
                                                                WindowStore.size
                                                                    .width
                                                            }
                                                            samples={
                                                                this
                                                                    .patientViewPageStore
                                                                    .samples
                                                                    .result
                                                            }
                                                            mutationProfileId={
                                                                this
                                                                    .patientViewPageStore
                                                                    .mutationMolecularProfileId
                                                                    .result!
                                                            }
                                                            // coverageInformation={
                                                            //     this
                                                            //         .patientViewPageStore
                                                            //         .coverageInformation
                                                            //         .result
                                                            // }
                                                        />
                                                    )}
                                                </div>

                                                {this.showOldTimeline && (
                                                    <div
                                                        style={{
                                                            marginTop: 20,
                                                        }}
                                                    >
                                                        <Timeline
                                                            store={
                                                                this
                                                                    .patientViewPageStore
                                                            }
                                                            width={
                                                                WindowStore.size
                                                                    .width - 60
                                                            }
                                                            sampleManager={
                                                                sampleManager
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                <hr />
                                            </div>
                                        )}

                                    <LoadingIndicator
                                        isLoading={
                                            this.patientViewPageStore
                                                .mutationData.isPending ||
                                            this.patientViewPageStore
                                                .cnaSegments.isPending
                                        }
                                    />

                                    {this.patientViewPageStore.mutationData
                                        .isComplete &&
                                        this.patientViewPageStore.cnaSegments
                                            .isComplete &&
                                        this.patientViewPageStore
                                            .sequencedSampleIdsInStudy
                                            .isComplete &&
                                        this.patientViewPageStore
                                            .sampleToMutationGenePanelId
                                            .isComplete &&
                                        this.patientViewPageStore
                                            .sampleToDiscreteGenePanelId
                                            .isComplete &&
                                        (this.patientViewPageStore
                                            .mergedMutationDataFilteredByGene
                                            .length > 0 ||
                                            this.patientViewPageStore
                                                .cnaSegments.result.length >
                                                0) &&
                                        sampleManager && (
                                            <div>
                                                <GenomicOverview
                                                    mergedMutations={
                                                        this
                                                            .patientViewPageStore
                                                            .mergedMutationDataFilteredByGene
                                                    }
                                                    samples={
                                                        this
                                                            .patientViewPageStore
                                                            .samples.result
                                                    }
                                                    cnaSegments={
                                                        this
                                                            .patientViewPageStore
                                                            .cnaSegments.result
                                                    }
                                                    sampleOrder={
                                                        sampleManager.sampleIndex
                                                    }
                                                    sampleLabels={
                                                        sampleManager.sampleLabels
                                                    }
                                                    sampleColors={
                                                        sampleManager.sampleColors
                                                    }
                                                    sampleManager={
                                                        sampleManager
                                                    }
                                                    containerWidth={
                                                        WindowStore.size.width -
                                                        20
                                                    }
                                                    sampleIdToMutationGenePanelId={
                                                        this
                                                            .patientViewPageStore
                                                            .sampleToMutationGenePanelId
                                                            .result
                                                    }
                                                    sampleIdToCopyNumberGenePanelId={
                                                        this
                                                            .patientViewPageStore
                                                            .sampleToDiscreteGenePanelId
                                                            .result
                                                    }
                                                    onSelectGenePanel={
                                                        this
                                                            .toggleGenePanelModal
                                                    }
                                                    disableTooltip={
                                                        this.genePanelModal
                                                            .isOpen
                                                    }
                                                />
                                                <hr />
                                            </div>
                                        )}

                                    <LoadingIndicator
                                        isLoading={
                                            this.patientViewPageStore
                                                .mutationData.isPending ||
                                            this.patientViewPageStore
                                                .uncalledMutationData
                                                .isPending ||
                                            this.patientViewPageStore
                                                .oncoKbAnnotatedGenes
                                                .isPending ||
                                            this.patientViewPageStore
                                                .studyIdToStudy.isPending
                                        }
                                    />

                                    {this.patientViewPageStore
                                        .oncoKbAnnotatedGenes.isComplete &&
                                        this.patientViewPageStore.mutationData
                                            .isComplete &&
                                        this.patientViewPageStore
                                            .uncalledMutationData.isComplete &&
                                        this.patientViewPageStore.studyIdToStudy
                                            .isComplete &&
                                        this.patientViewPageStore
                                            .sampleToMutationGenePanelId
                                            .isComplete &&
                                        this.patientViewPageStore
                                            .genePanelIdToEntrezGeneIds
                                            .isComplete &&
                                        !!sampleManager && (
                                            <div data-test="patientview-mutation-table">
                                                <PatientViewMutationTable
                                                    studyIdToStudy={
                                                        this
                                                            .patientViewPageStore
                                                            .studyIdToStudy
                                                            .result
                                                    }
                                                    sampleManager={
                                                        sampleManager
                                                    }
                                                    sampleToGenePanelId={
                                                        this
                                                            .patientViewPageStore
                                                            .sampleToMutationGenePanelId
                                                            .result
                                                    }
                                                    genePanelIdToEntrezGeneIds={
                                                        this
                                                            .patientViewPageStore
                                                            .genePanelIdToEntrezGeneIds
                                                            .result
                                                    }
                                                    sampleIds={
                                                        sampleManager
                                                            ? sampleManager.getSampleIdsInOrder()
                                                            : []
                                                    }
                                                    uniqueSampleKeyToTumorType={
                                                        this
                                                            .patientViewPageStore
                                                            .uniqueSampleKeyToTumorType
                                                    }
                                                    molecularProfileIdToMolecularProfile={
                                                        this
                                                            .patientViewPageStore
                                                            .molecularProfileIdToMolecularProfile
                                                            .result
                                                    }
                                                    variantCountCache={
                                                        this
                                                            .patientViewPageStore
                                                            .variantCountCache
                                                    }
                                                    indexedVariantAnnotations={
                                                        this
                                                            .patientViewPageStore
                                                            .indexedVariantAnnotations
                                                    }
                                                    indexedMyVariantInfoAnnotations={
                                                        this
                                                            .patientViewPageStore
                                                            .indexedMyVariantInfoAnnotations
                                                    }
                                                    discreteCNACache={
                                                        this
                                                            .patientViewPageStore
                                                            .discreteCNACache
                                                    }
                                                    mrnaExprRankCache={
                                                        this
                                                            .patientViewPageStore
                                                            .mrnaExprRankCache
                                                    }
                                                    pubMedCache={
                                                        this
                                                            .patientViewPageStore
                                                            .pubMedCache
                                                    }
                                                    genomeNexusCache={
                                                        this
                                                            .patientViewPageStore
                                                            .genomeNexusCache
                                                    }
                                                    genomeNexusMutationAssessorCache={
                                                        this
                                                            .patientViewPageStore
                                                            .genomeNexusMutationAssessorCache
                                                    }
                                                    mrnaExprRankMolecularProfileId={
                                                        this
                                                            .patientViewPageStore
                                                            .mrnaRankMolecularProfileId
                                                            .result || undefined
                                                    }
                                                    discreteCNAMolecularProfileId={
                                                        this
                                                            .patientViewPageStore
                                                            .molecularProfileIdDiscrete
                                                            .result
                                                    }
                                                    data={
                                                        this
                                                            .patientViewPageStore
                                                            .mergedMutationDataIncludingUncalledFilteredByGene
                                                    }
                                                    downloadDataFetcher={
                                                        this
                                                            .patientViewPageStore
                                                            .downloadDataFetcher
                                                    }
                                                    mutSigData={
                                                        this
                                                            .patientViewPageStore
                                                            .mutSigData.result
                                                    }
                                                    myCancerGenomeData={
                                                        this
                                                            .patientViewPageStore
                                                            .myCancerGenomeData
                                                    }
                                                    hotspotData={
                                                        this
                                                            .patientViewPageStore
                                                            .indexedHotspotData
                                                    }
                                                    cosmicData={
                                                        this
                                                            .patientViewPageStore
                                                            .cosmicData.result
                                                    }
                                                    oncoKbData={
                                                        this
                                                            .patientViewPageStore
                                                            .oncoKbData
                                                    }
                                                    oncoKbCancerGenes={
                                                        this
                                                            .patientViewPageStore
                                                            .oncoKbCancerGenes
                                                    }
                                                    usingPublicOncoKbInstance={
                                                        this
                                                            .patientViewPageStore
                                                            .usingPublicOncoKbInstance
                                                    }
                                                    civicGenes={
                                                        this
                                                            .patientViewPageStore
                                                            .civicGenes
                                                    }
                                                    civicVariants={
                                                        this
                                                            .patientViewPageStore
                                                            .civicVariants
                                                    }
                                                    userEmailAddress={ServerConfigHelpers.getUserEmailAddress()}
                                                    enableOncoKb={
                                                        AppConfig.serverConfig
                                                            .show_oncokb
                                                    }
                                                    enableFunctionalImpact={
                                                        AppConfig.serverConfig
                                                            .show_genomenexus
                                                    }
                                                    enableHotspot={
                                                        AppConfig.serverConfig
                                                            .show_hotspot
                                                    }
                                                    enableMyCancerGenome={
                                                        AppConfig.serverConfig
                                                            .mycancergenome_show
                                                    }
                                                    enableCivic={
                                                        AppConfig.serverConfig
                                                            .show_civic
                                                    }
                                                    columnVisibility={
                                                        this
                                                            .mutationTableColumnVisibility
                                                    }
                                                    showGeneFilterMenu={
                                                        this
                                                            .patientViewPageStore
                                                            .mutationTableShowGeneFilterMenu
                                                            .result
                                                    }
                                                    currentGeneFilter={
                                                        this
                                                            .patientViewPageStore
                                                            .mutationTableGeneFilterOption
                                                    }
                                                    onFilterGenes={
                                                        this
                                                            .onFilterGenesMutationTable
                                                    }
                                                    columnVisibilityProps={{
                                                        onColumnToggled: this
                                                            .onMutationTableColumnVisibilityToggled,
                                                    }}
                                                    onSelectGenePanel={
                                                        this
                                                            .toggleGenePanelModal
                                                    }
                                                    disableTooltip={
                                                        this.genePanelModal
                                                            .isOpen
                                                    }
                                                    generateGenomeNexusHgvsgUrl={
                                                        this
                                                            .patientViewPageStore
                                                            .generateGenomeNexusHgvsgUrl
                                                    }
                                                    onRowClick={
                                                        this
                                                            .onMutationTableRowClick
                                                    }
                                                    onRowMouseEnter={
                                                        this
                                                            .onMutationTableRowMouseEnter
                                                    }
                                                    onRowMouseLeave={
                                                        this
                                                            .onMutationTableRowMouseLeave
                                                    }
                                                    sampleIdToClinicalDataMap={
                                                        this
                                                            .patientViewPageStore
                                                            .clinicalDataGroupedBySampleMap
                                                    }
                                                    existsSomeMutationWithAscnProperty={
                                                        this
                                                            .patientViewPageStore
                                                            .existsSomeMutationWithAscnProperty
                                                    }
                                                />
                                            </div>
                                        )}

                                    <hr />

                                    <LoadingIndicator
                                        isLoading={
                                            this.cnaTableStatus === 'loading' ||
                                            this.patientViewPageStore
                                                .studyIdToStudy.isPending
                                        }
                                    />

                                    {this.patientViewPageStore.studyIdToStudy
                                        .isComplete &&
                                        this.patientViewPageStore
                                            .genePanelIdToEntrezGeneIds
                                            .isComplete &&
                                        this.patientViewPageStore.referenceGenes
                                            .isComplete && (
                                            <div data-test="patientview-copynumber-table">
                                                <CopyNumberTableWrapper
                                                    uniqueSampleKeyToTumorType={
                                                        this
                                                            .patientViewPageStore
                                                            .uniqueSampleKeyToTumorType
                                                    }
                                                    studyIdToStudy={
                                                        this
                                                            .patientViewPageStore
                                                            .studyIdToStudy
                                                            .result
                                                    }
                                                    sampleIds={
                                                        sampleManager
                                                            ? sampleManager.getSampleIdsInOrder()
                                                            : []
                                                    }
                                                    sampleManager={
                                                        sampleManager
                                                    }
                                                    sampleToGenePanelId={
                                                        this
                                                            .patientViewPageStore
                                                            .sampleToDiscreteGenePanelId
                                                            .result
                                                    }
                                                    genePanelIdToEntrezGeneIds={
                                                        this
                                                            .patientViewPageStore
                                                            .genePanelIdToEntrezGeneIds
                                                            .result
                                                    }
                                                    cnaOncoKbData={
                                                        this
                                                            .patientViewPageStore
                                                            .cnaOncoKbData
                                                    }
                                                    cnaCivicGenes={
                                                        this
                                                            .patientViewPageStore
                                                            .cnaCivicGenes
                                                    }
                                                    cnaCivicVariants={
                                                        this
                                                            .patientViewPageStore
                                                            .cnaCivicVariants
                                                    }
                                                    oncoKbCancerGenes={
                                                        this
                                                            .patientViewPageStore
                                                            .oncoKbCancerGenes
                                                    }
                                                    usingPublicOncoKbInstance={
                                                        this
                                                            .patientViewPageStore
                                                            .usingPublicOncoKbInstance
                                                    }
                                                    enableOncoKb={
                                                        AppConfig.serverConfig
                                                            .show_oncokb
                                                    }
                                                    enableCivic={
                                                        AppConfig.serverConfig
                                                            .show_civic
                                                    }
                                                    userEmailAddress={
                                                        AppConfig.serverConfig
                                                            .user_email_address
                                                    }
                                                    pubMedCache={
                                                        this
                                                            .patientViewPageStore
                                                            .pubMedCache
                                                    }
                                                    referenceGenes={
                                                        this
                                                            .patientViewPageStore
                                                            .referenceGenes
                                                            .result
                                                    }
                                                    data={
                                                        this
                                                            .patientViewPageStore
                                                            .mergedDiscreteCNADataFilteredByGene
                                                    }
                                                    copyNumberCountCache={
                                                        this
                                                            .patientViewPageStore
                                                            .copyNumberCountCache
                                                    }
                                                    mrnaExprRankCache={
                                                        this
                                                            .patientViewPageStore
                                                            .mrnaExprRankCache
                                                    }
                                                    gisticData={
                                                        this
                                                            .patientViewPageStore
                                                            .gisticData.result
                                                    }
                                                    mrnaExprRankMolecularProfileId={
                                                        this
                                                            .patientViewPageStore
                                                            .mrnaRankMolecularProfileId
                                                            .result || undefined
                                                    }
                                                    status={this.cnaTableStatus}
                                                    columnVisibility={
                                                        this
                                                            .cnaTableColumnVisibility
                                                    }
                                                    showGeneFilterMenu={
                                                        this
                                                            .patientViewPageStore
                                                            .cnaTableShowGeneFilterMenu
                                                            .result
                                                    }
                                                    currentGeneFilter={
                                                        this
                                                            .patientViewPageStore
                                                            .copyNumberTableGeneFilterOption
                                                    }
                                                    onFilterGenes={
                                                        this
                                                            .onFilterGenesCopyNumberTable
                                                    }
                                                    columnVisibilityProps={{
                                                        onColumnToggled: this
                                                            .onCnaTableColumnVisibilityToggled,
                                                    }}
                                                    onSelectGenePanel={
                                                        this
                                                            .toggleGenePanelModal
                                                    }
                                                    disableTooltip={
                                                        this.genePanelModal
                                                            .isOpen
                                                    }
                                                />
                                            </div>
                                        )}

                                    <hr />
                                    <PatientViewStructuralVariantTable
                                        store={this.patientViewPageStore}
                                        onSelectGenePanel={
                                            this.toggleGenePanelModal
                                        }
                                    />
                                </MSKTab>
                                {!!sampleManager &&
                                    this.patientViewPageStore.sampleIds.length >
                                        1 &&
                                    this.patientViewPageStore
                                        .existsSomeMutationWithVAFData && (
                                        <MSKTab
                                            key={1}
                                            id="genomicEvolution"
                                            linkText="Genomic Evolution"
                                        >
                                            <PatientViewMutationsTab
                                                patientViewPageStore={
                                                    this.patientViewPageStore
                                                }
                                                mutationTableColumnVisibility={
                                                    this
                                                        .mutationTableColumnVisibility
                                                }
                                                onMutationTableColumnVisibilityToggled={
                                                    this
                                                        .onMutationTableColumnVisibilityToggled
                                                }
                                                sampleManager={sampleManager}
                                                urlWrapper={this.urlWrapper}
                                            />
                                        </MSKTab>
                                    )}

                                <MSKTab
                                    key={2}
                                    id={PatientViewPageTabs.ClinicalData}
                                    linkText="Clinical Data"
                                    className={'patient-clinical-data-tab'}
                                >
                                    <div className="clearfix">
                                        <h3 className={'pull-left'}>Patient</h3>
                                        {this.patientViewPageStore
                                            .clinicalDataPatient.isComplete && (
                                            <ClinicalInformationPatientTable
                                                showTitleBar={true}
                                                data={
                                                    this.patientViewPageStore
                                                        .clinicalDataPatient
                                                        .result
                                                }
                                            />
                                        )}
                                    </div>

                                    <div className="clearfix">
                                        <h3 className={'pull-left'}>Samples</h3>
                                        {this.patientViewPageStore
                                            .clinicalDataGroupedBySample
                                            .isComplete && (
                                            <ClinicalInformationSamples
                                                samples={
                                                    this.patientViewPageStore
                                                        .clinicalDataGroupedBySample
                                                        .result!
                                                }
                                            />
                                        )}
                                    </div>

                                    <h2 className={'divider'}>Timeline Data</h2>

                                    {this.patientViewPageStore.clinicalEvents
                                        .isComplete && (
                                        <ClinicalEventsTables
                                            clinicalEvents={
                                                this.patientViewPageStore
                                                    .clinicalEvents.result
                                            }
                                        />
                                    )}
                                </MSKTab>

                                <MSKTab
                                    key={4}
                                    id={PatientViewPageTabs.FilesAndLinks}
                                    linkText={RESOURCES_TAB_NAME}
                                    hide={!this.shouldShowResources}
                                >
                                    <div>
                                        <ResourcesTab
                                            store={this.patientViewPageStore}
                                            sampleManager={
                                                this.patientViewPageStore
                                                    .sampleManager.result!
                                            }
                                            openResource={this.openResource}
                                        />
                                    </div>
                                </MSKTab>

                                <MSKTab
                                    key={3}
                                    id={PatientViewPageTabs.PathologyReport}
                                    linkText="Pathology Report"
                                    hide={!this.shouldShowPathologyReport}
                                >
                                    <div>
                                        <PathologyReport
                                            iframeHeight={
                                                WindowStore.size.height - 220
                                            }
                                            pdfs={
                                                this.patientViewPageStore
                                                    .pathologyReport.result
                                            }
                                        />
                                    </div>
                                </MSKTab>

                                <MSKTab
                                    key={5}
                                    id={PatientViewPageTabs.TissueImage}
                                    linkText="Tissue Image"
                                    hide={this.hideTissueImageTab}
                                >
                                    <div>
                                        <IFrameLoader
                                            height={
                                                WindowStore.size.height - 220
                                            }
                                            url={getDigitalSlideArchiveIFrameUrl(
                                                this.patientViewPageStore
                                                    .patientId
                                            )}
                                        />
                                    </div>
                                </MSKTab>

                                {this.showWholeSlideViewerTab &&
                                    this.wholeSlideViewerUrl.result && (
                                        <MSKTab
                                            key={6}
                                            id={
                                                PatientViewPageTabs.MSKTissueImage
                                            }
                                            linkText="Tissue Image"
                                            unmountOnHide={false}
                                        >
                                            <div>
                                                <IFrameLoader
                                                    height={
                                                        WindowStore.size
                                                            .height - 220
                                                    }
                                                    url={
                                                        this.wholeSlideViewerUrl
                                                            .result!
                                                    }
                                                />
                                            </div>
                                        </MSKTab>
                                    )}

                                {this.shouldShowTrialMatch && (
                                    <MSKTab
                                        key={7}
                                        id={PatientViewPageTabs.TrialMatchTab}
                                        linkText="Matched Trials"
                                    >
                                        <TrialMatchTable
                                            sampleManager={sampleManager}
                                            detailedTrialMatches={
                                                this.patientViewPageStore
                                                    .detailedTrialMatches.result
                                            }
                                            containerWidth={
                                                WindowStore.size.width - 20
                                            }
                                        />
                                    </MSKTab>
                                )}

                                {this.patientViewPageStore
                                    .hasMutationalSignatureData.result && (
                                    <MSKTab
                                        key={8}
                                        id="mutationalSignatures"
                                        linkText="Mutational Signature Data"
                                        hide={
                                            this.patientViewPageStore
                                                .mutationalSignatureMolecularProfiles
                                                .isPending ||
                                            _.isEmpty(
                                                this.patientViewPageStore
                                                    .mutationalSignatureDataGroupByVersion
                                                    .result
                                            )
                                        }
                                    >
                                        <MutationalSignaturesContainer
                                            data={
                                                this.patientViewPageStore
                                                    .mutationalSignatureDataGroupByVersion
                                                    .result
                                            }
                                            profiles={
                                                this.patientViewPageStore
                                                    .mutationalSignatureMolecularProfiles
                                                    .result
                                            }
                                            onVersionChange={
                                                this
                                                    .onMutationalSignatureVersionChange
                                            }
                                            version={
                                                this.patientViewPageStore
                                                    .selectedMutationalSignatureVersion
                                            }
                                        />
                                    </MSKTab>
                                )}

                                {this.resourceTabs.component}

                                {AppConfig.serverConfig.custom_tabs &&
                                    AppConfig.serverConfig.custom_tabs
                                        .filter(
                                            (tab: any) =>
                                                tab.location === 'PATIENT_PAGE'
                                        )
                                        .map((tab: any, i: number) => {
                                            return (
                                                <MSKTab
                                                    key={100 + i}
                                                    id={'customTab' + 1}
                                                    unmountOnHide={
                                                        tab.unmountOnHide ===
                                                        true
                                                    }
                                                    onTabDidMount={div => {
                                                        this.customTabMountCallback(
                                                            div,
                                                            tab
                                                        );
                                                    }}
                                                    linkText={tab.title}
                                                ></MSKTab>
                                            );
                                        })}
                            </MSKTabs>
                        </Then>
                        <Else>
                            <LoadingIndicator
                                isLoading={true}
                                center={true}
                                size={'big'}
                            />
                        </Else>
                    </If>
                </div>
            </PageLayout>
        );
    }
}
