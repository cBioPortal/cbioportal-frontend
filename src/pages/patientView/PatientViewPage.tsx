import * as React from 'react';
import _ from 'lodash';
import {
    CancerStudy,
    ClinicalData,
    DiscreteCopyNumberData,
    ResourceData,
} from 'cbioportal-ts-api-client';
import {
    ClinicalDataBySampleId,
    RequestStatus,
} from 'cbioportal-ts-api-client';
import { Else, If, Then } from 'react-if';
import SampleManager from './SampleManager';
import PatientHeader from './patientHeader/PatientHeader';
import { PaginationControls } from '../../shared/components/paginationControls/PaginationControls';
import { IColumnVisibilityDef } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import { toggleColumnVisibility } from 'cbioportal-frontend-commons';
import {
    parseCohortIds,
    PatientViewPageStore,
    buildCohortIdsFromNavCaseIds,
} from './clinicalInformation/PatientViewPageStore';
import { inject, observer } from 'mobx-react';
import { action, computed, observable, reaction, makeObservable } from 'mobx';
import { default as PatientViewMutationTable } from './mutation/PatientViewMutationTable';
import { MSKTab } from '../../shared/components/MSKTabs/MSKTabs';
import { validateParametersPatientView } from '../../shared/lib/validateParameters';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ValidationAlert from 'shared/components/ValidationAlert';
import PatientViewMutationsDataStore from './mutation/PatientViewMutationsDataStore';
import PatientViewCnaDataStore from './copyNumberAlterations/PatientViewCnaDataStore';

import './patient.scss';

import { getWholeSlideViewerUrl } from '../../shared/api/urls';
import { PageLayout } from '../../shared/components/PageLayout/PageLayout';
import Helmet from 'react-helmet';
import { getServerConfig } from '../../config/config';
import autobind from 'autobind-decorator';
import { showCustomTab } from '../../shared/lib/customTabs';
import { StudyLink } from '../../shared/components/StudyLink/StudyLink';
import { QueryParams } from 'url';
import { AppStore } from '../../AppStore';
import request from 'superagent';
import { remoteData, getBrowserWindow } from 'cbioportal-frontend-commons';

import 'cbioportal-frontend-commons/dist/styles.css';
import 'react-mutation-mapper/dist/styles.css';
import 'react-table/react-table.css';
import { trackPatient } from 'shared/lib/tracking';
import PatientViewUrlWrapper from './PatientViewUrlWrapper';
import { PagePath } from 'shared/enums/PagePaths';
import { GeneFilterOption } from './mutation/GeneFilterMenu';
import { checkNonProfiledGenesExist } from './PatientViewPageUtils';
import PatientViewGenePanelModal from './PatientViewGenePanelModal/PatientViewGenePanelModal';
import {
    extractResourceIdFromTabId,
    getPatientViewResourceTabId,
    PatientViewPageTabs,
    patientViewTabs,
} from './PatientViewPageTabs';
import { MakeMobxView } from '../../shared/components/MobxView';
import ResourceTab from '../../shared/components/resources/ResourceTab';
import { isFusion } from '../../shared/lib/MutationUtils';
import { Mutation } from 'cbioportal-ts-api-client';
import SampleSummaryList from './sampleHeader/SampleSummaryList';
import { updateOncoKbIconStyle } from 'shared/lib/AnnotationColumnUtils';
import { ExtendedMutationTableColumnType } from 'shared/components/mutationTable/MutationTable';
import { extractColumnNames } from 'shared/components/mutationMapper/MutationMapperUtils';
import { prepareCustomTabConfigurations } from 'shared/lib/customTabs/customTabHelpers';
import setWindowVariable from 'shared/lib/setWindowVariable';

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
    @observable mutationTableColumnVisibility:
        | { [columnId: string]: boolean }
        | undefined;
    @observable cnaTableColumnVisibility:
        | { [columnId: string]: boolean }
        | undefined;
    @observable genePanelModal = { genePanelId: '', isOpen: false };
    @observable mergeMutationTableOncoKbIcons;
    // use this wrapper rather than interacting with the url directly
    @observable
    public urlWrapper: PatientViewUrlWrapper;
    public patientViewMutationDataStore: PatientViewMutationsDataStore;
    public patientViewCnaDataStore: PatientViewCnaDataStore;

    public patientViewPageStore: PatientViewPageStore;

    constructor(props: IPatientViewPageProps) {
        super(props);
        makeObservable(this);
        this.urlWrapper = new PatientViewUrlWrapper(props.routing);

        setWindowVariable('urlWrapper', this.urlWrapper);

        this.patientViewPageStore = new PatientViewPageStore(
            this.props.appStore
        );

        this.patientViewMutationDataStore = new PatientViewMutationsDataStore(
            () => this.mergedMutations,
            this.urlWrapper
        );

        this.patientViewCnaDataStore = new PatientViewCnaDataStore(
            () => this.mergedCnas,
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

        this.mergeMutationTableOncoKbIcons = this.patientViewPageStore.mergeOncoKbIcons;
    }

    @computed get mergedMutations() {
        // remove fusions
        return this.patientViewPageStore.mergedMutationDataIncludingUncalledFilteredByGene.filter(
            mutationArray => {
                return !isFusion(mutationArray[0]);
            }
        );
    }

    @computed get mergedCnas() {
        return this.patientViewPageStore.mergedDiscreteCNADataFilteredByGene;
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
        return !getServerConfig().patient_view_use_legacy_timeline;
    }

    public get showOldTimeline() {
        return getServerConfig().patient_view_use_legacy_timeline;
    }

    @action.bound
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

    @action.bound
    public handleLocusChange(locus: string) {
        if (this.patientViewPageStore.activeLocus !== locus) {
            this.patientViewPageStore.activeLocus = locus;
        }
    }

    @action.bound
    handlePatientClick(id: string) {
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

    @action.bound
    handleOncoKbIconToggle(mergeIcons: boolean) {
        this.mergeMutationTableOncoKbIcons = mergeIcons;
        updateOncoKbIconStyle({ mergeIcons });
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

    @action.bound
    onCnaTableColumnVisibilityToggled(
        columnId: string,
        columnVisibility?: IColumnVisibilityDef[]
    ) {
        this.cnaTableColumnVisibility = toggleColumnVisibility(
            this.cnaTableColumnVisibility,
            columnId,
            columnVisibility
        );
    }

    @action.bound
    onMutationTableColumnVisibilityToggled(
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
    get shouldShowResources(): boolean {
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
    get shouldShowPathologyReport(): boolean {
        return (
            this.patientViewPageStore.pathologyReport.isComplete &&
            this.patientViewPageStore.pathologyReport.result.length > 0
        );
    }

    @computed
    get hideTissueImageTab() {
        return (
            this.patientViewPageStore.hasTissueImageIFrameUrl.isPending ||
            this.patientViewPageStore.hasTissueImageIFrameUrl.isError ||
            (this.patientViewPageStore.hasTissueImageIFrameUrl.isComplete &&
                !this.patientViewPageStore.hasTissueImageIFrameUrl.result)
        );
    }

    @computed
    public get shouldShowTrialMatch(): boolean {
        return (
            getBrowserWindow().localStorage.trialmatch === 'true' &&
            this.patientViewPageStore.detailedTrialMatches.isComplete &&
            this.patientViewPageStore.detailedTrialMatches.result.length > 0
        );
    }

    @autobind
    customTabMountCallback(div: HTMLDivElement, tab: any) {
        showCustomTab(
            div,
            tab,
            this.props.routing.location,
            this.patientViewPageStore
        );
    }

    wholeSlideViewerUrl = remoteData<string | undefined>({
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
    onFilterGenesMutationTable(option: GeneFilterOption): void {
        this.patientViewPageStore.mutationTableGeneFilterOption = option;
    }

    @autobind
    onFilterGenesCopyNumberTable(option: GeneFilterOption): void {
        this.patientViewPageStore.copyNumberTableGeneFilterOption = option;
    }

    mutationTableShowGeneFilterMenu(sampleIds: string[]): boolean {
        const entrezGeneIds: number[] = _.uniq(
            _.map(
                this.patientViewPageStore.mergedMutationDataIncludingUncalled,
                mutations => mutations[0].entrezGeneId
            )
        );
        return (
            sampleIds.length > 1 &&
            checkNonProfiledGenesExist(
                sampleIds,
                entrezGeneIds,
                this.patientViewPageStore.sampleToMutationGenePanelId.result,
                this.patientViewPageStore.genePanelIdToEntrezGeneIds.result
            )
        );
    }

    cnaTableShowGeneFilterMenu(sampleIds: string[]): boolean {
        const entrezGeneIds: number[] = _.uniq(
            _.map(
                this.patientViewPageStore.mergedDiscreteCNAData,
                alterations => alterations[0].entrezGeneId
            )
        );
        return (
            sampleIds.length > 1 &&
            checkNonProfiledGenesExist(
                sampleIds,
                entrezGeneIds,
                this.patientViewPageStore.sampleToDiscreteGenePanelId.result,
                this.patientViewPageStore.genePanelIdToEntrezGeneIds.result
            )
        );
    }

    @action.bound
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
    onMutationTableRowClick(d: Mutation[]) {
        // select mutation and toggle off previous selected
        if (d.length) {
            this.patientViewMutationDataStore.setSelectedMutations([d[0]]);
            if (this.patientViewCnaDataStore.selectedCna.length > 0) {
                this.patientViewCnaDataStore.toggleSelectedCna(
                    this.patientViewCnaDataStore.selectedCna[0]
                );
            }
            this.handleLocusChange(d[0].gene.hugoGeneSymbol);
        }
    }

    @autobind
    onMutationTableRowMouseEnter(d: Mutation[]) {
        if (d.length) {
            this.patientViewMutationDataStore.setMouseOverMutation(d[0]);
        }
    }

    @autobind
    onMutationTableRowMouseLeave() {
        this.patientViewMutationDataStore.setMouseOverMutation(null);
    }

    @action.bound
    onCnaTableRowClick(d: DiscreteCopyNumberData[]) {
        // select cna and toggle off previous selected
        if (d.length) {
            this.patientViewCnaDataStore.setSelectedCna([d[0]]);
            if (
                this.patientViewMutationDataStore.selectedMutations.length > 0
            ) {
                this.patientViewMutationDataStore.toggleSelectedMutation(
                    this.patientViewMutationDataStore.selectedMutations[0]
                );
            }
            this.handleLocusChange(d[0].gene.hugoGeneSymbol);
        }
    }

    @action.bound
    onResetViewClick() {
        // toggle off selected cna/mutation row
        if (this.patientViewCnaDataStore.selectedCna.length > 0) {
            this.patientViewCnaDataStore.toggleSelectedCna(
                this.patientViewCnaDataStore.selectedCna[0]
            );
        } else if (
            this.patientViewMutationDataStore.selectedMutations.length > 0
        ) {
            this.patientViewMutationDataStore.toggleSelectedMutation(
                this.patientViewMutationDataStore.selectedMutations[0]
            );
        }
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

    @action.bound
    openResource(resource: ResourceData) {
        // first we make the resource tab visible
        this.patientViewPageStore.setResourceTabOpen(resource.resourceId, true);
        // next, navigate to that tab
        this.urlWrapper.setActiveTab(
            getPatientViewResourceTabId(resource.resourceId)
        );
        // finally, within that tab, navigate to the specific target link, e.g. if there are multiple for the same resource
        this.urlWrapper.setResourceUrl(resource.url);
    }

    @action.bound
    closeResourceTab(tabId: string) {
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

    @action.bound
    onMutationalSignatureVersionChange(version: string) {
        this.patientViewPageStore.setMutationalSignaturesVersion(version);
    }

    @computed get columns(): ExtendedMutationTableColumnType[] {
        const namespaceColumnNames = extractColumnNames(
            this.patientViewMutationDataStore.namespaceColumnConfig
        );
        return _.concat(
            PatientViewMutationTable.defaultProps.columns,
            namespaceColumnNames
        );
    }

    @computed get customTabs() {
        // we want this to regenerate when
        // hash changes
        //const hash = this.urlWrapper.hash;

        return prepareCustomTabConfigurations(
            getServerConfig().custom_tabs,
            'PATIENT_PAGE'
        );
    }

    public render() {
        let sampleManager: SampleManager | null = null;
        if (this.patientViewPageStore.sampleManager.isComplete) {
            sampleManager = this.patientViewPageStore.sampleManager.result!;
        }
        let cohortNav: JSX.Element | null = null;
        let studyName: JSX.Element | null = null;

        (window as any).sampleManager = sampleManager;

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
                <StudyLink className={'nowrap'} studyId={study.studyId}>
                    {study.name}
                </StudyLink>
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

                    <LoadingIndicator
                        isLoading={
                            this.patientViewPageStore.patientViewData.isPending
                        }
                        center={true}
                        size={'big'}
                    />

                    {this.patientViewPageStore.patientViewData.isComplete &&
                        patientViewTabs(this, this.urlWrapper, sampleManager)}
                </div>
            </PageLayout>
        );
    }
}
