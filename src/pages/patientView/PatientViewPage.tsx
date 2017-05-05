import * as React from 'react';
import * as _ from 'lodash';
import $ from 'jquery';
import { default as ReactBootstrap} from 'react-bootstrap';
import GenomicOverview from './genomicOverview/GenomicOverview';
import { ClinicalData } from "shared/api/generated/CBioPortalAPI";
import { ClinicalDataBySampleId } from "../../shared/api/api-types-extended";
import { RequestStatus } from "../../shared/api/api-types-extended";
import FeatureTitle from '../../shared/components/featureTitle/FeatureTitle';
import {If, Then, Else} from 'react-if';
import SampleManager from './sampleManager';
import SelectCallback = ReactBootstrap.SelectCallback;
import {ThreeBounce} from 'better-react-spinkit';
import PatientHeader from './patientHeader/PatientHeader';
import {PaginationControls} from "../../shared/components/paginationControls/PaginationControls";
import { PatientViewPageStore } from './clinicalInformation/PatientViewPageStore';
import ClinicalInformationPatientTable from "./clinicalInformation/ClinicalInformationPatientTable";
import ClinicalInformationSamples from "./clinicalInformation/ClinicalInformationSamplesTable";
import {observer, inject } from "mobx-react";
import {getSpanElements} from './clinicalInformation/lib/clinicalAttributesUtil.js';
import CopyNumberTableWrapper from "./copyNumberAlterations/CopyNumberTableWrapper";
import {reaction, computed} from "mobx";
import Timeline from "./timeline/Timeline";
import {default as PatientViewMutationTable} from "./mutation/PatientViewMutationTable";
import PathologyReport from "./pathologyReport/PathologyReport";
import { MSKTabs, MSKTab } from "../../shared/components/MSKTabs/MSKTabs";
import validateParameters from '../../shared/lib/validateParameters';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import ValidationAlert from "shared/components/ValidationAlert";
import AjaxErrorModal from "shared/components/AjaxErrorModal";

import './patient.scss';

const patientViewPageStore = new PatientViewPageStore();

(window as any).patientViewPageStore = patientViewPageStore;

export interface IPatientViewPageProps {
    routing: any;
    samples?: ClinicalDataBySampleId[];
    loadClinicalInformationTableData?: () => Promise<any>;
    patient?: {
        id: string,
        clinicalData: ClinicalData[]
    };
    clinicalDataStatus?: RequestStatus;
}

@inject('routing')
@observer
export default class PatientViewPage extends React.Component<IPatientViewPageProps, {}> {

    constructor(props: IPatientViewPageProps) {

        super();

        //TODO: this should be done by a module so that it can be reused on other pages
        const reaction1 = reaction(
            () => props.routing.location.query,
            query => {

                const validationResult = validateParameters(query, [ 'studyId', ['sampleId', 'caseId']]);

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
                    patientViewPageStore.patientIdsInCohort = ('navCaseIds' in query ? (query.navCaseIds as string).split(",") : []);

                } else {
                    patientViewPageStore.urlValidationError = validationResult.message;
                }

            },
            { fireImmediately:true }
        );
    }

    public componentDidMount() {

        this.exposeComponentRenderersToParentScript();

    }

    // this gives the parent (legacy) cbioportal code control to mount
    // these components whenever and wherever it wants
    exposeComponentRenderersToParentScript() {

        // exposeComponentRenderer('renderClinicalInformationContainer', ClinicalInformationContainer,
        //     { store:this.props.store }
        // );
        //
        // exposeComponentRenderer('renderGenomicOverview', GenomicOverview);

    }

    private handleSampleClick(id: string) {

        this.props.routing.updateRoute({ caseId:undefined, sampleId:id });

    }

    private handleTabChange(id: string) {

        this.props.routing.updateRoute({ tab: id });

    }

    private handlePatientClick(id: string) {

        this.props.routing.updateRoute({ caseId: id, sampleId: undefined });

    }

    @computed get cnaTableStatus() {
        if (patientViewPageStore.geneticProfileIdDiscrete.isComplete) {
            if (patientViewPageStore.geneticProfileIdDiscrete.result === undefined) {
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

    public render() {

        let sampleManager: SampleManager | null = null;
        let sampleHeader: (JSX.Element | undefined)[] | null = null;
        let cohortNav: JSX.Element | null = null;
        let studyName: JSX.Element | null = null;

        if (patientViewPageStore.urlValidationError) {
            return <ValidationAlert urlValidationError={patientViewPageStore.urlValidationError} />;
        }

        if (patientViewPageStore.studyMetaData.isComplete) {
            let study = patientViewPageStore.studyMetaData.result;
            studyName = <a href={`study.do?cancer_study_id=${study.studyId}`} className="studyMetaBar_studyName">{study.name}</a>;
        }

        if (patientViewPageStore.patientViewData.isComplete) {
            let patientData = patientViewPageStore.patientViewData.result!;
            if (patientViewPageStore.clinicalEvents.isComplete && patientViewPageStore.clinicalEvents.result.length > 0) {
                sampleManager = new SampleManager(patientData.samples!, patientViewPageStore.clinicalEvents.result);
            } else {
                sampleManager = new SampleManager(patientData.samples!);
            }

            sampleHeader = _.map(sampleManager!.samples, (sample: ClinicalDataBySampleId) => {
                const clinicalDataLegacy: any = _.fromPairs(sample.clinicalData.map((x) => [x.clinicalAttributeId, x.value]));
                return (
                    <div className="patientSample">
                        <span className='clinical-spans'>
                            {  sampleManager!.getComponentForSample(sample.id) }
                            {'\u00A0'}
                            <a href="javascript:void(0)" onClick={()=>{ this.handleSampleClick(sample.id) }}>{sample.id}</a>
                            {getSpanElements(clinicalDataLegacy, 'lgg_ucsf_2014')}
                        </span>
                    </div>

                )
            });


        }

        if (patientViewPageStore.patientIdsInCohort && patientViewPageStore.patientIdsInCohort.length > 0) {
            const indexInCohort = patientViewPageStore.patientIdsInCohort.indexOf(patientViewPageStore.patientId);
            cohortNav = (
                <PaginationControls
                    currentPage={indexInCohort + 1}
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
            <div className="patientViewPage">

                <AjaxErrorModal
                    show={(patientViewPageStore.ajaxErrors.length > 0)}
                    onHide={()=>{ patientViewPageStore.clearErrors() }}
                />

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
                                    darwinUrl={patientViewPageStore.darwinUrl.result}/></td>
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
                <MSKTabs id="patientViewPageTabs" activeTabId={this.props.routing.location.query.tab}  onTabClick={(id:string)=>this.handleTabChange(id)} className="mainTabs">

                        <MSKTab key={0} id="summaryTab" linkText="Summary">

                            <LoadingIndicator isLoading={patientViewPageStore.clinicalEvents.isPending} />

                            {
                                (!!sampleManager && patientViewPageStore.clinicalEvents.isComplete && patientViewPageStore.clinicalEvents.result.length > 0) && (

                                    <div>
                                        <Timeline store={patientViewPageStore} getWidth={ ()=>$(window).width()-40 } sampleManager={ sampleManager } />
                                        <hr />
                                    </div>
                                )

                            }

                            <LoadingIndicator
                                    isLoading={patientViewPageStore.mutationData.isPending || patientViewPageStore.cnaSegments.isPending}
                            />

                            {
                                (patientViewPageStore.mutationData.isComplete && patientViewPageStore.cnaSegments.isComplete && sampleManager)
                                && ( patientViewPageStore.mutationData.result.length > 0 || patientViewPageStore.cnaSegments.result.length > 0)
                                && (
                                    <div>
                                        <GenomicOverview
                                            mergedMutations={patientViewPageStore.mergedMutationData}
                                            cnaSegments={patientViewPageStore.cnaSegments.result}
                                            sampleOrder={sampleManager.sampleIndex}
                                            sampleLabels={sampleManager.sampleLabels}
                                            sampleColors={sampleManager.sampleColors}
                                            sampleManager={sampleManager}
                                            getContainerWidth={()=>$(window).width()}
                                        />
                                        <hr />
                                    </div>
                                )
                            }

                            <LoadingIndicator isLoading={patientViewPageStore.mutationData.isPending && patientViewPageStore.uncalledMutationData.isPending} />

                            {
                                (patientViewPageStore.mutationData.isComplete && patientViewPageStore.uncalledMutationData.isComplete && !!sampleManager) && (
                                    <PatientViewMutationTable
                                        sampleManager={sampleManager}
                                        sampleIds={sampleManager ? sampleManager.getSampleIdsInOrder() : []}
                                        variantCountCache={patientViewPageStore.variantCountCache}
                                        discreteCNACache={patientViewPageStore.discreteCNACache}
                                        mrnaExprRankCache={patientViewPageStore.mrnaExprRankCache}
                                        oncoKbEvidenceCache={patientViewPageStore.oncoKbEvidenceCache}
                                        pmidCache={patientViewPageStore.pmidCache}
                                        mrnaExprRankGeneticProfileId={patientViewPageStore.mrnaRankGeneticProfileId.result || undefined}
                                        discreteCNAGeneticProfileId={patientViewPageStore.geneticProfileIdDiscrete.result}
                                        data={patientViewPageStore.mergedMutationDataIncludingUncalled}
                                        mutSigData={patientViewPageStore.mutSigData.result}
                                        myCancerGenomeData={patientViewPageStore.myCancerGenomeData}
                                        hotspots={patientViewPageStore.indexedHotspotData}
                                        cosmicData={patientViewPageStore.cosmicData.result}
                                        oncoKbData={patientViewPageStore.oncoKbData.result}
                                    />
                                )
                            }

                            <hr />

                            <LoadingIndicator isLoading={(this.cnaTableStatus === 'loading')} />

                            <CopyNumberTableWrapper
                                sampleIds={sampleManager ? sampleManager.getSampleIdsInOrder() : []}
                                sampleManager={sampleManager}
                                cnaOncoKbData={patientViewPageStore.cnaOncoKbData.result}
                                oncoKbEvidenceCache={patientViewPageStore.oncoKbEvidenceCache}
                                pmidCache={patientViewPageStore.pmidCache}
                                data={patientViewPageStore.mergedDiscreteCNAData}
                                copyNumberCountCache={patientViewPageStore.copyNumberCountCache}
                                mrnaExprRankCache={patientViewPageStore.mrnaExprRankCache}
                                gisticData={patientViewPageStore.gisticData.result}
                                mrnaExprRankGeneticProfileId={patientViewPageStore.mrnaRankGeneticProfileId.result || undefined}
                                status={this.cnaTableStatus}
                            />
                        </MSKTab>

                        {(patientViewPageStore.pageMode === 'patient') && (
                        <MSKTab key={2} id="clinicalDataTab" linkText="Clinical Data">

                                    <div className="clearfix">
                                        <FeatureTitle title="Patient"
                                                      isLoading={ patientViewPageStore.clinicalDataPatient.isPending }
                                                      className="pull-left"/>
                                        { (patientViewPageStore.clinicalDataPatient.isComplete) && (
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


                    <MSKTab key={3} id="pathologyReportTab" linkText="Pathology Report"
                            hide={(patientViewPageStore.pathologyReport.isComplete && patientViewPageStore.pathologyReport.result.length === 0)}
                            loading={patientViewPageStore.pathologyReport.isPending}
                    >
                        <div style={{position:"relative"}}>
                            <ThreeBounce className="center-block text-center" /> {/*Put it underneath so it gets covered by loaded element*/}
                            <PathologyReport iframeStyle={{position:"absolute", top:0}} pdfs={patientViewPageStore.pathologyReport.result} />
                        </div>
                    </MSKTab>


                    <MSKTab key={4} id="heatMapReportTab" linkText="Heatmap"
                             hide={(patientViewPageStore.MDAndersonHeatMapAvailable.isComplete && !patientViewPageStore.MDAndersonHeatMapAvailable.result)}
                            loading={patientViewPageStore.MDAndersonHeatMapAvailable.isPending}
                    >
                        <div style={{position:"relative"}}>
                            <ThreeBounce className="center-block text-center" /> {/*Put it underneath so it gets covered by loaded element*/}
                            <iframe style={{position:"absolute", top:0, width:'100%', height:700, border:'none'}}
                                    src={ `//bioinformatics.mdanderson.org/TCGA/NGCHMPortal/?participant=${patientViewPageStore.patientId}` }></iframe>
                        </div>
                    </MSKTab>

                    <MSKTab key={5} id="tissueImageTab" linkText="Tissue Image"
                            hide={/https/.test(window.location.protocol) // can't show this iframe if we're on https:
                                    || (patientViewPageStore.hasTissueImageIFrameUrl.isComplete && !patientViewPageStore.hasTissueImageIFrameUrl.result)}
                            loading={patientViewPageStore.hasTissueImageIFrameUrl.isPending}
                    >
                        <div style={{position: "relative"}}>
                            <ThreeBounce className="center-block text-center" /> {/*Put it underneath so it gets covered by loaded element*/}
                            <iframe style={{position:"absolute", top:0, width:'100%', height:700, border:'none'}}
                                    src={ `http://cancer.digitalslidearchive.net/index_mskcc.php?slide_name=${patientViewPageStore.patientId}` }></iframe>
                        </div>
                    </MSKTab>

                    </MSKTabs>

                    </Then>
                    <Else>
                        <ThreeBounce size={20} className="center-block text-center" />
                    </Else>

                </If>

            </div>
        );
    }
}
