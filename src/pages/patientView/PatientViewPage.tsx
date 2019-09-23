import * as React from "react";
import * as _ from "lodash";
import $ from "jquery";
import GenomicOverview from "./genomicOverview/GenomicOverview";
import {CancerStudy, ClinicalData} from "shared/api/generated/CBioPortalAPI";
import {ClinicalDataBySampleId, RequestStatus} from "../../shared/api/api-types-extended";
import FeatureTitle from "../../shared/components/featureTitle/FeatureTitle";
import {Else, If, Then} from "react-if";
import SampleManager from "./sampleManager";
import PatientHeader from "./patientHeader/PatientHeader";
import SignificantMutationalSignatures from "./patientHeader/SignificantMutationalSignatures";
import {PaginationControls} from "../../shared/components/paginationControls/PaginationControls";
import {IColumnVisibilityDef} from "shared/components/columnVisibilityControls/ColumnVisibilityControls";
import {toggleColumnVisibility} from "public-lib/lib/ColumnVisibilityResolver";
import {parseCohortIds, PatientViewPageStore} from "./clinicalInformation/PatientViewPageStore";
import ClinicalInformationPatientTable from "./clinicalInformation/ClinicalInformationPatientTable";
import ClinicalInformationSamples from "./clinicalInformation/ClinicalInformationSamplesTable";
import {inject, observer} from "mobx-react";
import {getSpanElementsFromCleanData} from "./clinicalInformation/lib/clinicalAttributesUtil.js";
import CopyNumberTableWrapper from "./copyNumberAlterations/CopyNumberTableWrapper";
import {action, computed, observable, reaction} from "mobx";
import Timeline from "./timeline/Timeline";
import {default as PatientViewMutationTable} from "./mutation/PatientViewMutationTable";
import PathologyReport from "./pathologyReport/PathologyReport";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {validateParametersPatientView} from "../../shared/lib/validateParameters";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import ValidationAlert from "shared/components/ValidationAlert";
import AppConfig from "appConfig";
import {getMouseIcon} from "./SVGIcons";

import "./patient.scss";
import IFrameLoader from "../../shared/components/iframeLoader/IFrameLoader";
import {
    getDigitalSlideArchiveIFrameUrl,
    getSampleViewUrl,
    getWholeSlideViewerUrl
} from "../../shared/api/urls";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import Helmet from "react-helmet";
import {ServerConfigHelpers} from "../../config/config";
import autobind from "autobind-decorator";
import {showCustomTab} from "../../shared/lib/customTabs";
import {StudyLink} from "../../shared/components/StudyLink/StudyLink";
import WindowStore from "shared/components/window/WindowStore";
import {QueryParams} from "url";
import {AppStore} from "../../AppStore";
import request from 'superagent';
import {remoteData} from "../../public-lib/api/remoteData";
import TrialMatchTable from "./trialMatch/TrialMatchTable";

import 'cbioportal-frontend-commons/styles.css';
import 'react-mutation-mapper/dist/styles.css';
import 'react-table/react-table.css';
import getBrowserWindow from "../../public-lib/lib/getBrowserWindow";
import SampleInlineList from "./patientHeader/SampleInlineList";

const win:any = (window as any);

export interface IPatientViewPageProps {
    params: any; // react route
    routing: any;
    appStore: AppStore;
    samples?: ClinicalDataBySampleId[];
    loadClinicalInformationTableData?: () => Promise<any>;
    patient?: {
        id: string,
        clinicalData: ClinicalData[]
    };
    clinicalDataStatus?: RequestStatus;
}

@inject('routing', 'appStore')
@observer
export default class PatientViewPage extends React.Component<IPatientViewPageProps, {}> {

    @observable private mutationTableColumnVisibility: {[columnId: string]: boolean}|undefined;
    @observable private cnaTableColumnVisibility: {[columnId: string]: boolean}|undefined;
    private patientViewPageStore = new PatientViewPageStore(getBrowserWindow().globalStores.routing);

    constructor(props: IPatientViewPageProps) {

        super(props);

        win.patientViewPageStore = this.patientViewPageStore;

        this.onMutationTableColumnVisibilityToggled = this.onMutationTableColumnVisibilityToggled.bind(this);
        this.onCnaTableColumnVisibilityToggled = this.onCnaTableColumnVisibilityToggled.bind(this);
    }

    componentWillUnmount() {
        this.patientViewPageStore.destroy();
    }

    @autobind
    public handleSampleClick(id: string, e: React.MouseEvent<HTMLAnchorElement>) {
        if (!e.shiftKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            this.props.routing.updateRoute({ caseId:undefined, sampleId:id });
        }
        // otherwise do nothing, we want default behavior of link
        // namely that href will open in a new window/tab
    }

    private handleTabChange(id: string) {
        this.patientViewPageStore.urlWrapper.setTabId(id);
    }

    private handlePatientClick(id: string) {

        let values = id.split(":");
        if(values.length == 2){
            this.props.routing.updateRoute({ studyId: values[0], caseId: values[1], sampleId: undefined });
        } else {
            this.props.routing.updateRoute({ caseId: id, sampleId: undefined });
        }

    }

    @computed get cnaTableStatus() {
        if (this.patientViewPageStore.molecularProfileIdDiscrete.isComplete) {
            if (this.patientViewPageStore.molecularProfileIdDiscrete.result === undefined) {
                return "unavailable";
            } else if (this.patientViewPageStore.discreteCNAData.isComplete) {
                return "available";
            } else {
                return "loading";
            }
        } else {
            return "loading";
        }
    }

    @action private onCnaTableColumnVisibilityToggled(columnId: string, columnVisibility?: IColumnVisibilityDef[])
    {
        this.cnaTableColumnVisibility = toggleColumnVisibility(
            this.cnaTableColumnVisibility, columnId, columnVisibility);
    }

    @action private onMutationTableColumnVisibilityToggled(columnId: string, columnVisibility?: IColumnVisibilityDef[])
    {
        this.mutationTableColumnVisibility = toggleColumnVisibility(
            this.mutationTableColumnVisibility, columnId, columnVisibility);
    }

    private shouldShowPathologyReport(patientViewPageStore: PatientViewPageStore): boolean {
        return this.patientViewPageStore.pathologyReport.isComplete && this.patientViewPageStore.pathologyReport.result.length > 0;
    }

    hideTissueImageTab(){
        return this.patientViewPageStore.hasTissueImageIFrameUrl.isPending || this.patientViewPageStore.hasTissueImageIFrameUrl.isError
            || (this.patientViewPageStore.hasTissueImageIFrameUrl.isComplete && !this.patientViewPageStore.hasTissueImageIFrameUrl.result);
    }

    private shouldShowTrialMatch(patientViewPageStore: PatientViewPageStore): boolean {
        return getBrowserWindow().localStorage.trialmatch === 'true' &&
            this.patientViewPageStore.detailedTrialMatches.isComplete && this.patientViewPageStore.detailedTrialMatches.result.length > 0;
    }


    @autobind
    private customTabMountCallback(div:HTMLDivElement,tab:any){
        showCustomTab(div, tab, this.props.routing.location, this.patientViewPageStore);
    }

    private wholeSlideViewerUrl = remoteData<string | undefined>({
        await: () => [this.patientViewPageStore.getWholeSlideViewerIds],
        invoke: async() => {
            if (!_.isEmpty(this.patientViewPageStore.getWholeSlideViewerIds.result)) {
                const url = getWholeSlideViewerUrl(this.patientViewPageStore.getWholeSlideViewerIds.result!, this.props.appStore.userName!);
                //if request succeeds then we return the url because we know request works.
                try {
                    await request.get(url);
                    return url;
                }
                //but if request fails, we will return undefined.
                catch (er){
                    return undefined;
                }
            }
            return undefined;
        }
    });

    @autobind
    private onSampleSortEnd(params:any) {
        const sampleManager = this.patientViewPageStore.sampleManager!;
        if (params.oldIndex !== params.newIndex) {
            const sampleOrder = sampleManager.sampleIdsInOrder.slice();
            const poppedId = sampleOrder.splice(params.oldIndex, 1)[0];
            sampleOrder.splice(params.newIndex, 0, poppedId);

            this.patientViewPageStore.urlWrapper.updateQuery({ sampleIdOrder: JSON.stringify(sampleOrder) });
        }
    }

    public render() {
        let sampleManager: SampleManager | null = this.patientViewPageStore.sampleManager;
        let sampleHeader: (JSX.Element | undefined)[] | null = null;
        let cohortNav: JSX.Element | null = null;
        let studyName: JSX.Element | null = null;

        if (!this.patientViewPageStore.urlValidationResult.isValid) {
            return <ValidationAlert urlValidationError={this.patientViewPageStore.urlValidationResult.message!} />;
        }

        if (this.patientViewPageStore.studyMetaData.isComplete) {
            let study:CancerStudy = this.patientViewPageStore.studyMetaData.result;
            studyName = <StudyLink studyId={study.studyId}>{study.name}</StudyLink>;
        }

        if (this.patientViewPageStore.patientViewData.isComplete && this.patientViewPageStore.studyMetaData.isComplete) {
            sampleHeader = [
                <SampleInlineList
                    axis="xy"
                    distance={6}
                    samples={sampleManager!.samples}
                    sampleManager={sampleManager!}
                    store={this.patientViewPageStore}
                    handleSampleClick={this.handleSampleClick}
                    onSortEnd={this.onSampleSortEnd}
                />
            ];

            if (sampleHeader && sampleHeader.length > 0 && this.patientViewPageStore.pageMode === 'sample' &&
                this.patientViewPageStore.patientId && this.patientViewPageStore.allSamplesForPatient && this.patientViewPageStore.allSamplesForPatient.result.length > 1) {
                sampleHeader.push(
                    <button className="btn btn-default btn-xs" onClick={()=>this.handlePatientClick(this.patientViewPageStore.patientId)}>Show all {this.patientViewPageStore.allSamplesForPatient.result.length} samples</button>
                );
            }
        }

        if (this.patientViewPageStore.patientIdsInCohort && this.patientViewPageStore.patientIdsInCohort.length > 0) {
            const indexInCohort = this.patientViewPageStore.patientIdsInCohort.indexOf(this.patientViewPageStore.studyId + ':' + this.patientViewPageStore.patientId);
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
                    nextPageDisabled={indexInCohort === this.patientViewPageStore.patientIdsInCohort.length-1}
                    lastPageDisabled={indexInCohort === this.patientViewPageStore.patientIdsInCohort.length-1}
                    onFirstPageClick={() => this.handlePatientClick(this.patientViewPageStore.patientIdsInCohort[0]) }
                    onPreviousPageClick={() => this.handlePatientClick(this.patientViewPageStore.patientIdsInCohort[indexInCohort-1]) }
                    onNextPageClick={() => this.handlePatientClick(this.patientViewPageStore.patientIdsInCohort[indexInCohort+1]) }
                    onLastPageClick={() => this.handlePatientClick(this.patientViewPageStore.patientIdsInCohort[this.patientViewPageStore.patientIdsInCohort.length-1]) }
                    onChangeCurrentPage={(newPage) => {
                        if (newPage > 0 && newPage <= this.patientViewPageStore.patientIdsInCohort.length) {
                            this.handlePatientClick(this.patientViewPageStore.patientIdsInCohort[newPage - 1]);
                        }
                    }}
                    pageNumberEditable={true}
                    className="cohortNav"
                />
            );
        }

        return (
            <PageLayout noMargin={true} hideFooter={true}>
                {
                    (this.patientViewPageStore.patientViewData.isComplete) && (
                        <Helmet>
                            <title>{this.patientViewPageStore.pageTitle}</title>
                            <meta name="description" content={this.patientViewPageStore.metaDescription} />
                        </Helmet>
                    )
                }
                <div className="patientViewPage">

                    <div className="headBlock">

                        {  (this.patientViewPageStore.patientViewData.isComplete) && (
                            <div className="patientPageHeader">
                                <i className="fa fa-user-circle-o patientIcon" aria-hidden="true"></i>
                                <div className="patientDataTable">
                                    <table>
                                        <tr>
                                            <td>Patient:</td>
                                            <td><PatientHeader
                                                handlePatientClick={(id: string)=>this.handlePatientClick(id)}
                                                patient={this.patientViewPageStore.patientViewData.result.patient}
                                                studyId={this.patientViewPageStore.studyId}
                                                darwinUrl={this.patientViewPageStore.darwinUrl.result}
                                                sampleManager={sampleManager}/></td>
                                        </tr>
                                        <tr>
                                            <td>Samples:</td>
                                            <td>
                                                <div className="patientSamples">{sampleHeader}</div>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                <div className="studyMetaBar">{ studyName } <If condition={(cohortNav != null)}>{cohortNav}</If></div>
                            </div>
                        )
                        }
                    </div>
                    <If condition={this.patientViewPageStore.patientViewData.isComplete}>
                        <Then>
                            <MSKTabs id="patientViewPageTabs" activeTabId={this.patientViewPageStore.urlWrapper.tabId}  onTabClick={(id:string)=>this.handleTabChange(id)} className="mainTabs">

                        <MSKTab key={0} id="summary" linkText="Summary">

                                    <LoadingIndicator isLoading={this.patientViewPageStore.clinicalEvents.isPending} />

                                    {
                                        (!!sampleManager && this.patientViewPageStore.clinicalEvents.isComplete && this.patientViewPageStore.clinicalEvents.result.length > 0) && (

                                            <div>
                                                <Timeline
                                                    store={this.patientViewPageStore}
                                                    width={WindowStore.size.width-60}
                                                    sampleManager={ sampleManager }
                                                />
                                                <hr />
                                            </div>
                                        )

                                    }

                                    <LoadingIndicator
                                        isLoading={this.patientViewPageStore.mutationData.isPending || this.patientViewPageStore.cnaSegments.isPending}
                                    />

                                    {
                                        (this.patientViewPageStore.mutationData.isComplete && this.patientViewPageStore.cnaSegments.isComplete
                                            && this.patientViewPageStore.sequencedSampleIdsInStudy.isComplete && sampleManager)
                                        && ( this.patientViewPageStore.mutationData.result.length > 0 || this.patientViewPageStore.cnaSegments.result.length > 0)
                                        && (
                                            <div>
                                                <GenomicOverview
                                                    mergedMutations={this.patientViewPageStore.mergedMutationData}
                                                    samples={this.patientViewPageStore.samples.result}
                                                    cnaSegments={this.patientViewPageStore.cnaSegments.result}
                                                    sampleOrder={sampleManager.sampleIndex}
                                                    sampleLabels={sampleManager.sampleLabels}
                                                    sampleColors={sampleManager.sampleColors}
                                                    sampleManager={sampleManager}
                                                    containerWidth={WindowStore.size.width-20}
                                                />
                                                <hr />
                                            </div>
                                        )
                                    }

                                    <LoadingIndicator isLoading={this.patientViewPageStore.mutationData.isPending || this.patientViewPageStore.uncalledMutationData.isPending || this.patientViewPageStore.oncoKbAnnotatedGenes.isPending || this.patientViewPageStore.studyIdToStudy.isPending} />

                                    {
                                        (this.patientViewPageStore.oncoKbAnnotatedGenes.isComplete && this.patientViewPageStore.mutationData.isComplete && this.patientViewPageStore.uncalledMutationData.isComplete && !!sampleManager && this.patientViewPageStore.studyIdToStudy.isComplete) && (
                                            <PatientViewMutationTable
                                                studyIdToStudy={this.patientViewPageStore.studyIdToStudy.result}
                                                sampleManager={sampleManager}
                                                sampleIds={sampleManager ? sampleManager.sampleIdsInOrder : []}
                                                uniqueSampleKeyToTumorType={this.patientViewPageStore.uniqueSampleKeyToTumorType}
                                                molecularProfileIdToMolecularProfile={this.patientViewPageStore.molecularProfileIdToMolecularProfile.result}
                                                variantCountCache={this.patientViewPageStore.variantCountCache}
                                                indexedVariantAnnotations={this.patientViewPageStore.indexedVariantAnnotations}
                                                discreteCNACache={this.patientViewPageStore.discreteCNACache}
                                                mrnaExprRankCache={this.patientViewPageStore.mrnaExprRankCache}
                                                oncoKbEvidenceCache={this.patientViewPageStore.oncoKbEvidenceCache}
                                                pubMedCache={this.patientViewPageStore.pubMedCache}
                                                genomeNexusCache={this.patientViewPageStore.genomeNexusCache}
                                                genomeNexusMyVariantInfoCache={this.patientViewPageStore.genomeNexusMyVariantInfoCache}
                                                mrnaExprRankMolecularProfileId={this.patientViewPageStore.mrnaRankMolecularProfileId.result || undefined}
                                                discreteCNAMolecularProfileId={this.patientViewPageStore.molecularProfileIdDiscrete.result}
                                                data={this.patientViewPageStore.mergedMutationDataIncludingUncalled}
                                                downloadDataFetcher={this.patientViewPageStore.downloadDataFetcher}
                                                mutSigData={this.patientViewPageStore.mutSigData.result}
                                                myCancerGenomeData={this.patientViewPageStore.myCancerGenomeData}
                                                hotspotData={this.patientViewPageStore.indexedHotspotData}
                                                cosmicData={this.patientViewPageStore.cosmicData.result}
                                                oncoKbData={this.patientViewPageStore.oncoKbData}
                                                oncoKbCancerGenes={this.patientViewPageStore.oncoKbCancerGenes}
                                                civicGenes={this.patientViewPageStore.civicGenes}
                                                civicVariants={this.patientViewPageStore.civicVariants}
                                                userEmailAddress={ServerConfigHelpers.getUserEmailAddress()}
                                                enableOncoKb={AppConfig.serverConfig.show_oncokb}
                                                enableFunctionalImpact={AppConfig.serverConfig.show_genomenexus}
                                                enableHotspot={AppConfig.serverConfig.show_hotspot}
                                                enableMyCancerGenome={AppConfig.serverConfig.mycancergenome_show}
                                                enableCivic={AppConfig.serverConfig.show_civic}
                                                columnVisibility={this.mutationTableColumnVisibility}
                                                columnVisibilityProps={{
                                                    onColumnToggled: this.onMutationTableColumnVisibilityToggled
                                                }}
                                            />
                                        )
                                    }

                                    <hr />

                                    <LoadingIndicator isLoading={(this.cnaTableStatus === 'loading' || this.patientViewPageStore.studyIdToStudy.isPending)} />

                                    {
                                        (this.patientViewPageStore.studyIdToStudy.isComplete &&
                                            this.patientViewPageStore.referenceGenes.isComplete) && (
                                            <CopyNumberTableWrapper
                                            studyIdToStudy={this.patientViewPageStore.studyIdToStudy.result}
                                            sampleIds={sampleManager ? sampleManager.sampleIdsInOrder : []}
                                            sampleManager={sampleManager}
                                            cnaOncoKbData={this.patientViewPageStore.cnaOncoKbData}
                                            cnaCivicGenes={this.patientViewPageStore.cnaCivicGenes}
                                            cnaCivicVariants={this.patientViewPageStore.cnaCivicVariants}
                                            oncoKbEvidenceCache={this.patientViewPageStore.oncoKbEvidenceCache}
                                            oncoKbCancerGenes={this.patientViewPageStore.oncoKbCancerGenes}
                                            enableOncoKb={AppConfig.serverConfig.show_oncokb}
                                            enableCivic={AppConfig.serverConfig.show_civic}
                                            userEmailAddress={AppConfig.serverConfig.user_email_address}
                                            pubMedCache={this.patientViewPageStore.pubMedCache}
                                            referenceGenes={this.patientViewPageStore.referenceGenes.result}
                                            data={this.patientViewPageStore.mergedDiscreteCNAData}
                                            copyNumberCountCache={this.patientViewPageStore.copyNumberCountCache}
                                            mrnaExprRankCache={this.patientViewPageStore.mrnaExprRankCache}
                                            gisticData={this.patientViewPageStore.gisticData.result}
                                            mrnaExprRankMolecularProfileId={this.patientViewPageStore.mrnaRankMolecularProfileId.result || undefined}
                                            status={this.cnaTableStatus}
                                            columnVisibility={this.cnaTableColumnVisibility}
                                            columnVisibilityProps={{
                                                onColumnToggled: this.onCnaTableColumnVisibilityToggled
                                            }}
                                        />
                                        )
                                    }
                                </MSKTab>

                    <MSKTab key={2} id="clinicalData" linkText="Clinical Data">

                        <div className="clearfix">
                            <FeatureTitle title="Patient"
                                            isLoading={this.patientViewPageStore.clinicalDataPatient.isPending}
                                            className="pull-left"/>
                            {(this.patientViewPageStore.clinicalDataPatient.isComplete) && (
                                <ClinicalInformationPatientTable showTitleBar={true}
                                                                    data={this.patientViewPageStore.clinicalDataPatient.result}/>
                            )
                            }
                        </div>

                        <br />

                        <div className="clearfix">
                            <FeatureTitle title="Samples" isLoading={ this.patientViewPageStore.clinicalDataGroupedBySample.isPending } className="pull-left" />
                            {  (this.patientViewPageStore.clinicalDataGroupedBySample.isComplete) && (
                                <ClinicalInformationSamples
                                    samples={this.patientViewPageStore.clinicalDataGroupedBySample.result!}/>
                            )
                            }
                        </div>

                    </MSKTab>


                    <MSKTab key={3} id="pathologyReport" linkText="Pathology Report"
                            hide={!this.shouldShowPathologyReport(this.patientViewPageStore)}
                    >
                        <div>
                            <PathologyReport iframeHeight={WindowStore.size.height - 220} pdfs={this.patientViewPageStore.pathologyReport.result} />
                        </div>
                    </MSKTab>

                    <MSKTab key={5} id="tissueImage" linkText="Tissue Image"
                            hide={this.hideTissueImageTab()}
                    >
                        <div>
                            <IFrameLoader height={WindowStore.size.height - 220} url={  getDigitalSlideArchiveIFrameUrl(this.patientViewPageStore.patientId) } />
                        </div>
                    </MSKTab>

                    {(this.patientViewPageStore.studyId === "mskimpact" && this.wholeSlideViewerUrl.result) && (
                    <MSKTab key={6} id="MSKTissueImage" linkText="Tissue Image"
                            unmountOnHide = {false}
                    >
                        <div>
                            <IFrameLoader height={WindowStore.size.height - 220} url={ this.wholeSlideViewerUrl.result! } />
                        </div>
                    </MSKTab>
                    )}

                    {
                        this.shouldShowTrialMatch(this.patientViewPageStore) && (
                            <MSKTab key={7} id="trialMatchTab" linkText="Matched Trials">
                                <TrialMatchTable
                                    sampleManager={sampleManager}
                                    detailedTrialMatches={this.patientViewPageStore.detailedTrialMatches.result}
                                    containerWidth={WindowStore.size.width-20}
                                />
                            </MSKTab>
                        )
                    }

                    {/*<MSKTab key={5} id="mutationalSignatures" linkText="Mutational Signature Data" hide={true}>*/}
                        {/*<div className="clearfix">*/}
                            {/*<FeatureTitle title="Mutational Signatures" isLoading={ patientViewPageStore.clinicalDataGroupedBySample.isPending } className="pull-left" />*/}
                            {/*<LoadingIndicator isLoading={patientViewPageStore.mutationalSignatureData.isPending}/>*/}
                            {/*{*/}
                                {/*(patientViewPageStore.clinicalDataGroupedBySample.isComplete && patientViewPageStore.mutationalSignatureData.isComplete) && (*/}
                                    {/*<ClinicalInformationMutationalSignatureTable data={patientViewPageStore.mutationalSignatureData.result} showTitleBar={true}/>*/}
                                {/*)*/}
                            {/*}*/}
                        {/*</div>*/}

                    {/*</MSKTab>*/}

                                {
                                    (AppConfig.serverConfig.custom_tabs) && AppConfig.serverConfig.custom_tabs.filter((tab:any)=>tab.location==="PATIENT_PAGE").map((tab:any, i:number)=>{
                                        return (<MSKTab key={100+i} id={'customTab'+1} unmountOnHide={(tab.unmountOnHide===true)}
                                                        onTabDidMount={(div)=>{ this.customTabMountCallback(div, tab) }} linkText={tab.title}>
                                        </MSKTab>)
                                    })
                                }

                            </MSKTabs>

                        </Then>
                        <Else>
                            <LoadingIndicator isLoading={true} center={true} size={"big"}/>
                        </Else>

                    </If>

                </div>
            </PageLayout>
        );
    }
}
