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
import {toggleColumnVisibility} from "shared/components/lazyMobXTable/ColumnVisibilityResolver";
import {PatientViewPageStore} from "./clinicalInformation/PatientViewPageStore";
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
    getSampleViewUrl
} from "../../shared/api/urls";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import Helmet from "react-helmet";
import {ServerConfigHelpers} from "../../config/config";
import autobind from "autobind-decorator";
import {showCustomTab} from "../../shared/lib/customTabs";
import {StudyLink} from "../../shared/components/StudyLink/StudyLink";
import WindowStore from "shared/components/window/WindowStore";
import {QueryParams} from "url";

const patientViewPageStore = new PatientViewPageStore();

const win:any = (window as any);

win.patientViewPageStore = patientViewPageStore;

export interface IPatientViewPageProps {
    params: any; // react route
    routing: any;
    samples?: ClinicalDataBySampleId[];
    loadClinicalInformationTableData?: () => Promise<any>;
    patient?: {
        id: string,
        clinicalData: ClinicalData[]
    };
    clinicalDataStatus?: RequestStatus;
}

export interface PatientViewUrlParams extends QueryParams{
    studyId:string;
    caseId?:string;
    sampleId?:string;
}

@inject('routing')
@observer
export default class PatientViewPage extends React.Component<IPatientViewPageProps, {}> {

    @observable private mutationTableColumnVisibility: {[columnId: string]: boolean}|undefined;
    @observable private cnaTableColumnVisibility: {[columnId: string]: boolean}|undefined;

    constructor(props: IPatientViewPageProps) {

        super();

        //TODO: this should be done by a module so that it can be reused on other pages
        const reaction1 = reaction(
            () => [props.routing.location.query, props.routing.location.hash, props.routing.location.pathname],
            ([query,hash,pathname]) => {

                // we don't want to update patient if we aren't on a patient page route
                if (!pathname.includes("/patient")) {
                    return;
                }

                const validationResult = validateParametersPatientView(query);

                if (validationResult.isValid) {

                    patientViewPageStore.urlValidationError = null;

                    if ('studyId' in query) {
                        patientViewPageStore.studyId = query.studyId;
                    }
                    if ('caseId' in query) {
                        patientViewPageStore.setPatientId(query.caseId as string);
                    } else if ('sampleId' in query)
                    {
                        patientViewPageStore.setSampleId(query.sampleId as string);
                    }

                    // if there is a navCaseId list in url
                    const navCaseIdMatch = hash.match(/navCaseIds=([^&]*)/);
                    if (navCaseIdMatch && navCaseIdMatch.length > 1) {
                        const navCaseIds = navCaseIdMatch[1].split(',');
                        patientViewPageStore.patientIdsInCohort = navCaseIds.map((entityId:string)=>{
                            return entityId.includes(':') ? entityId : patientViewPageStore.studyId + ':' + entityId;
                        });
                    }

                } else {
                    patientViewPageStore.urlValidationError = validationResult.message;
                }

            },
            { fireImmediately:true }
        );

        this.onMutationTableColumnVisibilityToggled = this.onMutationTableColumnVisibilityToggled.bind(this);
        this.onCnaTableColumnVisibilityToggled = this.onCnaTableColumnVisibilityToggled.bind(this);
    }

    public handleSampleClick(id: string, e: React.MouseEvent<HTMLAnchorElement>) {
        if (!e.shiftKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            this.props.routing.updateRoute({ caseId:undefined, sampleId:id });
        }
        // otherwise do nothing, we want default behavior of link
        // namely that href will open in a new window/tab
    }

    private handleTabChange(id: string) {

        this.props.routing.updateRoute({}, `patient/${id}`);

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
        if (patientViewPageStore.molecularProfileIdDiscrete.isComplete) {
            if (patientViewPageStore.molecularProfileIdDiscrete.result === undefined) {
                return "unavailable";
            } else if (patientViewPageStore.discreteCNAData.isComplete) {
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
        return patientViewPageStore.pathologyReport.isComplete && patientViewPageStore.pathologyReport.result.length > 0;
    }

    hideTissueImageTab(){
        return patientViewPageStore.hasTissueImageIFrameUrl.isPending || patientViewPageStore.hasTissueImageIFrameUrl.isError
            || (patientViewPageStore.hasTissueImageIFrameUrl.isComplete && !patientViewPageStore.hasTissueImageIFrameUrl.result);
    }


    @autobind
    private customTabMountCallback(div:HTMLDivElement,tab:any){
        showCustomTab(div, tab, this.props.routing.location, patientViewPageStore);
    }

    public render() {

        let sampleManager: SampleManager | null = null;
        let sampleHeader: (JSX.Element | undefined)[] | null = null;
        let cohortNav: JSX.Element | null = null;
        let studyName: JSX.Element | null = null;

        if (patientViewPageStore.urlValidationError) {
            return <ValidationAlert urlValidationError={patientViewPageStore.urlValidationError} />;
        }

        if (patientViewPageStore.studyMetaData.isComplete) {
            let study:CancerStudy = patientViewPageStore.studyMetaData.result;
            studyName = <StudyLink studyId={study.studyId}>{study.name}</StudyLink>;
        }

        if (patientViewPageStore.patientViewData.isComplete && patientViewPageStore.studyMetaData.isComplete) {
            let patientData = patientViewPageStore.patientViewData.result;
            if (patientViewPageStore.clinicalEvents.isComplete && patientViewPageStore.clinicalEvents.result.length > 0) {
                sampleManager = new SampleManager(patientData.samples!, patientViewPageStore.clinicalEvents.result);
            } else {
                sampleManager = new SampleManager(patientData.samples!);
            }

            sampleHeader = _.map(sampleManager!.samples, (sample: ClinicalDataBySampleId) => {
                const isPDX:boolean = (sampleManager &&
                    sampleManager.clinicalDataLegacyCleanAndDerived &&
                    sampleManager.clinicalDataLegacyCleanAndDerived[sample.id] &&
                    sampleManager.clinicalDataLegacyCleanAndDerived[sample.id].DERIVED_NORMALIZED_CASE_TYPE === 'Xenograft'
                );

                return (
                    <div className="patientSample">
                        <span className='clinical-spans'>
                            {
                                sampleManager!.getComponentForSample(sample.id, 1, '',
                                    <span style={{display:'inline-flex'}}>
                                        {'\u00A0'}
                                        {isPDX && getMouseIcon()}
                                        {isPDX && '\u00A0'}
                                        <a
                                            href={getSampleViewUrl(patientViewPageStore.studyMetaData.result!.studyId, sample.id)}
                                            target="_blank"
                                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => this.handleSampleClick(sample.id, e)}
                                        >
                                            {sample.id}
                                        </a>
                                        {sampleManager &&
                                        sampleManager.clinicalDataLegacyCleanAndDerived[sample.id] &&
                                        getSpanElementsFromCleanData(sampleManager.clinicalDataLegacyCleanAndDerived[sample.id], patientViewPageStore.studyId)}
                                    </span>
                                )
                            }
                        </span>
                        {patientViewPageStore.hasMutationalSignatureData.result === true &&
                        <LoadingIndicator isLoading={patientViewPageStore.mutationalSignatureData.isPending && patientViewPageStore.mutationalSignatureMetaData.isPending}/>}

                        {patientViewPageStore.hasMutationalSignatureData.result === true &&
                        patientViewPageStore.clinicalDataGroupedBySample.isComplete && patientViewPageStore.mutationalSignatureData.isComplete &&
                        patientViewPageStore.mutationalSignatureMetaData.isComplete &&
                        (<SignificantMutationalSignatures data={patientViewPageStore.mutationalSignatureData.result}
                                                          metadata={patientViewPageStore.mutationalSignatureMetaData.result} uniqueSampleKey={sample.id}/>)}

                    </div>
                );
            });

            if (sampleHeader && sampleHeader.length > 0 && patientViewPageStore.pageMode === 'sample' && patientViewPageStore.patientId && patientViewPageStore.samples.result.length > 1) {
                sampleHeader.push(
                    <button className="btn btn-default btn-xs" onClick={()=>this.handlePatientClick(patientViewPageStore.patientId)}>Show all samples</button>
                );
            }
        }

        if (patientViewPageStore.patientIdsInCohort && patientViewPageStore.patientIdsInCohort.length > 0) {
            const indexInCohort = patientViewPageStore.patientIdsInCohort.indexOf(patientViewPageStore.studyId + ':' + patientViewPageStore.patientId);
            cohortNav = (
                <PaginationControls
                    currentPage={indexInCohort + 1}
                    showMoreButton={false}
                    showItemsPerPageSelector={false}
                    showFirstPage={true}
                    showLastPage={true}
                    textBetweenButtons={` of ${patientViewPageStore.patientIdsInCohort.length} patients`}
                    firstPageDisabled={indexInCohort === 0}
                    previousPageDisabled={indexInCohort === 0}
                    nextPageDisabled={indexInCohort === patientViewPageStore.patientIdsInCohort.length-1}
                    lastPageDisabled={indexInCohort === patientViewPageStore.patientIdsInCohort.length-1}
                    onFirstPageClick={() => this.handlePatientClick(patientViewPageStore.patientIdsInCohort[0]) }
                    onPreviousPageClick={() => this.handlePatientClick(patientViewPageStore.patientIdsInCohort[indexInCohort-1]) }
                    onNextPageClick={() => this.handlePatientClick(patientViewPageStore.patientIdsInCohort[indexInCohort+1]) }
                    onLastPageClick={() => this.handlePatientClick(patientViewPageStore.patientIdsInCohort[patientViewPageStore.patientIdsInCohort.length-1]) }
                    onChangeCurrentPage={(newPage) => {
                        if (newPage > 0 && newPage <= patientViewPageStore.patientIdsInCohort.length) {
                            this.handlePatientClick(patientViewPageStore.patientIdsInCohort[newPage - 1]);
                        }
                    }}
                    pageNumberEditable={true}
                    className="cohortNav"
                />
            );
        }

        return (
            <PageLayout noMargin={true}>
                {
                    (patientViewPageStore.patientViewData.isComplete) && (
                        <Helmet>
                            <title>{patientViewPageStore.pageTitle}</title>
                            <meta name="description" content={patientViewPageStore.metaDescription} />
                        </Helmet>
                    )
                }
                <div className="patientViewPage">

                    {/*<AjaxErrorModal*/}
                    {/*show={(patientViewPageStore.ajaxErrors.length > 0)}*/}
                    {/*onHide={()=>{ patientViewPageStore.clearErrors() }}*/}
                    {/*title={`Can't find ${patientViewPageStore.pageMode} ${patientViewPageStore.caseId} in study ${patientViewPageStore.studyId}.`}*/}
                    {/*troubleshooting={["Check that your URL parameters are valid.", "Try refreshing the page.", "Make sure you are connected to the internet."]}*/}
                    {/*/>*/}

                    <div className="topBanner">

                        {  (patientViewPageStore.patientViewData.isComplete) && (
                            <div className="patientPageHeader">
                                <i className="fa fa-user-circle-o patientIcon" aria-hidden="true"></i>
                                <div className="patientDataTable">
                                    <table>
                                        <tr>
                                            <td>Patient:</td>
                                            <td><PatientHeader
                                                handlePatientClick={(id: string)=>this.handlePatientClick(id)}
                                                patient={patientViewPageStore.patientViewData.result.patient}
                                                studyId={patientViewPageStore.studyId}
                                                darwinUrl={patientViewPageStore.darwinUrl.result}
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
                    <If condition={patientViewPageStore.patientViewData.isComplete}>
                        <Then>
                            <MSKTabs id="patientViewPageTabs" activeTabId={this.props.params.tab || "summaryTab"}  onTabClick={(id:string)=>this.handleTabChange(id)} className="mainTabs">

                        <MSKTab key={0} id="summary" linkText="Summary">

                                    <LoadingIndicator isLoading={patientViewPageStore.clinicalEvents.isPending} />

                                    {
                                        (!!sampleManager && patientViewPageStore.clinicalEvents.isComplete && patientViewPageStore.clinicalEvents.result.length > 0) && (

                                            <div>
                                                <Timeline store={patientViewPageStore} width={WindowStore.size.width-60} sampleManager={ sampleManager } />
                                                <hr />
                                            </div>
                                        )

                                    }

                                    <LoadingIndicator
                                        isLoading={patientViewPageStore.mutationData.isPending || patientViewPageStore.cnaSegments.isPending}
                                    />

                                    {
                                        (patientViewPageStore.mutationData.isComplete && patientViewPageStore.cnaSegments.isComplete
                                            && patientViewPageStore.sequencedSampleIdsInStudy.isComplete && sampleManager)
                                        && ( patientViewPageStore.mutationData.result.length > 0 || patientViewPageStore.cnaSegments.result.length > 0)
                                        && (
                                            <div>
                                                <GenomicOverview
                                                    mergedMutations={patientViewPageStore.mergedMutationData}
                                                    samples={patientViewPageStore.samples.result}
                                                    cnaSegments={patientViewPageStore.cnaSegments.result}
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

                                    <LoadingIndicator isLoading={patientViewPageStore.mutationData.isPending || patientViewPageStore.uncalledMutationData.isPending || patientViewPageStore.oncoKbAnnotatedGenes.isPending} />

                                    {
                                        (patientViewPageStore.oncoKbAnnotatedGenes.isComplete && patientViewPageStore.mutationData.isComplete && patientViewPageStore.uncalledMutationData.isComplete && !!sampleManager) && (
                                            <PatientViewMutationTable
                                                sampleManager={sampleManager}
                                                sampleIds={sampleManager ? sampleManager.getSampleIdsInOrder() : []}
                                                uniqueSampleKeyToTumorType={patientViewPageStore.uniqueSampleKeyToTumorType}
                                                molecularProfileIdToMolecularProfile={patientViewPageStore.molecularProfileIdToMolecularProfile.result}
                                                variantCountCache={patientViewPageStore.variantCountCache}
                                                indexedVariantAnnotations={patientViewPageStore.indexedVariantAnnotations}
                                                discreteCNACache={patientViewPageStore.discreteCNACache}
                                                mrnaExprRankCache={patientViewPageStore.mrnaExprRankCache}
                                                oncoKbEvidenceCache={patientViewPageStore.oncoKbEvidenceCache}
                                                pubMedCache={patientViewPageStore.pubMedCache}
                                                genomeNexusCache={patientViewPageStore.genomeNexusCache}
                                                mrnaExprRankMolecularProfileId={patientViewPageStore.mrnaRankMolecularProfileId.result || undefined}
                                                discreteCNAMolecularProfileId={patientViewPageStore.molecularProfileIdDiscrete.result}
                                                data={patientViewPageStore.mergedMutationDataIncludingUncalled}
                                                downloadDataFetcher={patientViewPageStore.downloadDataFetcher}
                                                mutSigData={patientViewPageStore.mutSigData.result}
                                                myCancerGenomeData={patientViewPageStore.myCancerGenomeData}
                                                hotspotData={patientViewPageStore.indexedHotspotData}
                                                cosmicData={patientViewPageStore.cosmicData.result}
                                                oncoKbData={patientViewPageStore.oncoKbData}
                                                oncoKbAnnotatedGenes={patientViewPageStore.oncoKbAnnotatedGenes.result}
                                                civicGenes={patientViewPageStore.civicGenes}
                                                civicVariants={patientViewPageStore.civicVariants}
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

                                    <LoadingIndicator isLoading={(this.cnaTableStatus === 'loading')} />

                                    <CopyNumberTableWrapper
                                        sampleIds={sampleManager ? sampleManager.getSampleIdsInOrder() : []}
                                        sampleManager={sampleManager}
                                        cnaOncoKbData={patientViewPageStore.cnaOncoKbData}
                                        cnaCivicGenes={patientViewPageStore.cnaCivicGenes}
                                        cnaCivicVariants={patientViewPageStore.cnaCivicVariants}
                                        oncoKbEvidenceCache={patientViewPageStore.oncoKbEvidenceCache}
                                        oncoKbAnnotatedGenes={patientViewPageStore.oncoKbAnnotatedGenes.result}
                                        enableOncoKb={AppConfig.serverConfig.show_oncokb}
                                        enableCivic={AppConfig.serverConfig.show_civic}
                                        userEmailAddress={AppConfig.serverConfig.user_email_address}
                                        pubMedCache={patientViewPageStore.pubMedCache}
                                        data={patientViewPageStore.mergedDiscreteCNAData}
                                        copyNumberCountCache={patientViewPageStore.copyNumberCountCache}
                                        mrnaExprRankCache={patientViewPageStore.mrnaExprRankCache}
                                        gisticData={patientViewPageStore.gisticData.result}
                                        mrnaExprRankMolecularProfileId={patientViewPageStore.mrnaRankMolecularProfileId.result || undefined}
                                        status={this.cnaTableStatus}
                                        columnVisibility={this.cnaTableColumnVisibility}
                                        columnVisibilityProps={{
                                            onColumnToggled: this.onCnaTableColumnVisibilityToggled
                                        }}
                                    />
                                </MSKTab>

                        {(patientViewPageStore.pageMode === 'patient') && (
                        <MSKTab key={2} id="clinicalData" linkText="Clinical Data">

                                        <div className="clearfix">
                                            <FeatureTitle title="Patient"
                                                          isLoading={patientViewPageStore.clinicalDataPatient.isPending}
                                                          className="pull-left"/>
                                            {(patientViewPageStore.clinicalDataPatient.isComplete) && (
                                                <ClinicalInformationPatientTable showTitleBar={true}
                                                                                 data={patientViewPageStore.clinicalDataPatient.result}/>
                                            )
                                            }
                                        </div>

                                        <br />

                                        <div className="clearfix">
                                            <FeatureTitle title="Samples" isLoading={ patientViewPageStore.clinicalDataGroupedBySample.isPending } className="pull-left" />
                                            {  (patientViewPageStore.clinicalDataGroupedBySample.isComplete) && (
                                                <ClinicalInformationSamples
                                                    samples={patientViewPageStore.clinicalDataGroupedBySample.result!}/>
                                            )
                                            }
                                        </div>


                                    </MSKTab>
                                )}


                    <MSKTab key={3} id="pathologyReport" linkText="Pathology Report"
                            hide={!this.shouldShowPathologyReport(patientViewPageStore)}
                    >
                        <div>
                            <PathologyReport iframeStyle={{position:"absolute", top:0}} pdfs={patientViewPageStore.pathologyReport.result} />
                        </div>
                    </MSKTab>

                    <MSKTab key={5} id="tissueImage" linkText="Tissue Image"
                            hide={this.hideTissueImageTab()}
                    >
                        <div style={{position: "relative"}}>
                            <IFrameLoader height={700} url={  getDigitalSlideArchiveIFrameUrl(patientViewPageStore.patientId) } />
                        </div>
                    </MSKTab>

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
