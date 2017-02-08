import * as React from 'react';
import * as _ from 'lodash';
import {Tabs, Tab, default as ReactBootstrap} from 'react-bootstrap';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import MutationInformationContainer from './mutation/MutationInformationContainer';
//import PatientHeader from './patientHeader/PatientHeader';
//import {IPatientHeaderProps} from './patientHeader/PatientHeader';
import {RootState} from '../../redux/rootReducer';
import Spinner from "react-spinkit";
import exposeComponentRenderer from '../../shared/lib/exposeComponentRenderer';
import GenomicOverview from './genomicOverview/GenomicOverview';
import mockData from './mock/sampleData.json';
import Connector, { ClinicalInformationData } from "./Connector";
import {ClinicalData, SampleIdentifier, GeneticProfile} from "shared/api/CBioPortalAPI";
import { ClinicalDataBySampleId } from "../../shared/api/api-types-extended";
import { RequestStatus } from "../../shared/api/api-types-extended";
import { default as CBioPortalAPI, Mutation }  from "../../shared/api/CBioPortalAPI";
import FeatureTitle from '../../shared/components/featureTitle/FeatureTitle';
import renderIf from 'render-if';
import { If, Then, Else } from 'react-if';
import queryString from "query-string";
import SampleManager from './sampleManager';
import SelectCallback = ReactBootstrap.SelectCallback;
import CancerHotspotsAPI from "../../shared/api/CancerHotspotsAPI";
import {HotspotMutation} from "../../shared/api/CancerHotspotsAPI";
import {MutSig, MrnaPercentile, default as CBioPortalAPIInternal} from "../../shared/api/CBioPortalAPIInternal";
import PatientHeader from './patientHeader/PatientHeader';
import {TablePaginationControls} from "../../shared/components/tablePaginationControls/TablePaginationControls";
import {IHotspotData} from "./mutation/column/AnnotationColumnFormatter";
import {MrnaRankData} from "./mutation/column/MrnaExprColumnFormatter";
import { PatientViewPageStore } from './clinicalInformation/PatientViewPageStore';
import ClinicalInformationPatientTable from "./clinicalInformation/ClinicalInformationPatientTable";
import ClinicalInformationSamples from "./clinicalInformation/ClinicalInformationSamplesTable";
import {observer} from "../../../node_modules/mobx-react/index";

const patientViewPageStore = new PatientViewPageStore();

export interface IPatientViewPageProps {
    store?: RootState;
    samples?: ClinicalDataBySampleId[];
    loadClinicalInformationTableData?: () => Promise<any>;
    patient?: {
        id: string,
        clinicalData: ClinicalData[]
    };
    clinicalDataStatus?: RequestStatus;
}

export type MutSigData = { [entrezGeneId:string]:{ qValue:number } }

interface IPatientViewState {

    cnaSegmentData: any;
    mutationData: any;
    hotspotsData?: IHotspotData;
    mrnaExprRankData?: MrnaRankData;
    mutSigData?: MutSigData;
    activeTabKey: number;
}

@Connector.decorator
@observer
export default class PatientViewPage extends React.Component<IPatientViewPageProps, IPatientViewState> {

    private studyId:string;

    private patientId:string;

    private mutationGeneticProfileId:string;

    private tsClient:CBioPortalAPI;

    private hotspotsClient:CancerHotspotsAPI;
    private hotspots3dClient:CancerHotspotsAPI;

    private tsInternalClient:CBioPortalAPIInternal;

    private patientIdsInCohort:string[];

    constructor() {

        super();

        this.state = {
            mutationData: undefined,
            cnaSegmentData: undefined,
            hotspotsData: undefined,
            mrnaExprRankData: undefined,
            activeTabKey:1
        };

        this.handleSelect = this.handleSelect.bind(this);

        this.tsClient = new CBioPortalAPI(`//${(window as any)['__API_ROOT__']}`);
        this.tsInternalClient = new CBioPortalAPIInternal(`//${(window as any)['__API_ROOT__']}`);
        this.hotspotsClient = new CancerHotspotsAPI(`//${(window as any)['__HOTSPOTS_API_ROOT__']}`);
        this.hotspots3dClient = new CancerHotspotsAPI(`//${(window as any)['__3D_HOTSPOTS_API_ROOT__']}`);

        //TODO: this should be done by a module so that it can be reused on other pages
        const qs = queryString.parse((window as any).location.search);
        patientViewPageStore.studyId = qs['cancer_study_id'] + '';

        patientViewPageStore.patientId = qs['case_id'] + '';

        const qs_hash = queryString.parse((window as any).location.hash);
        this.patientIdsInCohort = (!!qs_hash['nav_case_ids'] ? (qs_hash['nav_case_ids'] as string).split(",") : []);

        this.mutationGeneticProfileId = `${patientViewPageStore.studyId}_mutations`;

    }

    fetchHotspotsData(mutations:Mutation[]):Promise<IHotspotData> {
        const generateMap = function(hotspots:HotspotMutation[]) {
            // key => geneSymbol_proteinPosition
            // protienPosition => start[_end]
            const map: {[key:string]: boolean} = {};

            // create a map for a faster lookup
            _.each(hotspots, function(hotspot:HotspotMutation) {
                const positions = hotspot.residue.match(/[0-9]+/g) || []; // start (and optionally end) positions
                const key = [hotspot.hugoSymbol.toUpperCase()].concat(positions).join("_");
                map[key] = true;
            });

            return map;
        };

        // do not retreive all available hotspots from the service,
        // only retrieve hotspots for the current genes on the page
        const queryGenes:string[] = _.uniq(_.map(mutations, function(mutation:Mutation) {
            if (mutation && mutation.gene) {
                return mutation.gene.hugoGeneSymbol;
            }
            else {
                return "";
            }
        }));

        const promiseSingle = new Promise((resolve, reject) => {
            const promise = this.hotspotsClient.fetchSingleResidueHotspotMutationsByGenePOST({
                hugoSymbols: queryGenes
            });

            promise.then((data) => {
                resolve(generateMap(data));
            });
        });

        const promiseClustered = new Promise((resolve, reject) => {
            const promise = this.hotspots3dClient.fetch3dHotspotMutationsByGenePOST({
                hugoSymbols: queryGenes
            });

            promise.then((data) => {
                resolve(generateMap(data));
            });
        });

        return new Promise((resolve, reject) => {
            Promise.all([promiseSingle, promiseClustered]).then((values) => {
                resolve({
                    single: values[0],
                    clustered: values[1]
                });
            });
        });
    }

    fetchCnaSegmentData(_sampleIds: string[]) {

        const ids: SampleIdentifier[] = _sampleIds.map((id: string) => { return { sampleId:id, studyId: patientViewPageStore.studyId }; });

        return this.tsClient.fetchCopyNumberSegmentsUsingPOST({sampleIdentifiers:ids, projection: 'DETAILED'});

    }

    fetchMutationData(_sampleIds: string[]) {

        let mutationDataPromise = this.tsClient.fetchMutationsInGeneticProfileUsingPOST({geneticProfileId: this.mutationGeneticProfileId, sampleIds: _sampleIds, projection: "DETAILED"});
        return mutationDataPromise;

    }

    fetchMutSigData():Promise<MutSig[]> {
        return this.tsInternalClient.getSignificantlyMutatedGenesUsingGET({studyId: patientViewPageStore.studyId});
    }

    public componentDidMount() {

        // const PatientHeader = connect(PatientViewPage.mapStateToProps)(PatientHeaderUnconnected);
        //
        // // Don't try to render clinical_div_prototype in parent cbioportal
        // // project context
        // // let clinicalDiv: Element | null = document.getElementById('clinical_div_prototype');
        // // if (clinicalDiv) {
        // //     ReactDOM.render(
        // //         <PatientHeader {...{store: this.props.store}} />,
        // //         clinicalDiv
        // //     );
        // // } //

        if (this.props.loadClinicalInformationTableData) this.props.loadClinicalInformationTableData().then(() => {

            if (this.props.samples) {

                let sampleIds: string[] = this.props.samples.map((item: ClinicalDataBySampleId)=>item.id);

                this.fetchCnaSegmentData(sampleIds).then((_result) => {
                    this.setState(({ cnaSegmentData:  _result } as IPatientViewState));
                });

                this.fetchMutationData(sampleIds).then((_result) => {
                    this.fetchHotspotsData(_result).then((hotspotsData:IHotspotData) => {
                        this.setState(({ hotspotsData } as IPatientViewState));
                    });
                    this.setState(({ mutationData : _result } as IPatientViewState));
                });

                this.fetchMutSigData().then((_result) => {
                    const data = _result.reduce((map:MutSigData, next:MutSig) => {
                        map[next.entrezGeneId] = { qValue: next.qValue };
                        return map;
                    }, {});
                    this.setState(({ mutSigData: data } as IPatientViewState));
                });
            }

        });

        this.exposeComponentRenderersToParentScript();

    }

    // this gives the parent (legacy) cbioportal code control to mount
    // these components whenever and wherever it wants
    exposeComponentRenderersToParentScript() {

        exposeComponentRenderer('renderClinicalInformationContainer', ClinicalInformationContainer,
            { store:this.props.store }
        );

        exposeComponentRenderer('renderGenomicOverview', GenomicOverview);

    }

    private buildURL(caseId:string='', studyId:string='', cohort:string[]=[]) {
        let url = window.location.origin + window.location.pathname;
        let searchElements = [];
        if (caseId.length > 0) {
            searchElements.push(`case_id=${caseId}`);
        }
        if (studyId.length > 0) {
            searchElements.push(`cancer_study_id=${studyId}`);
        }
        if (searchElements.length > 0) {
            url += '?'+searchElements.join('&');
        }

        let hashElements = [];
        if (cohort.length > 0) {
            hashElements.push(`nav_case_ids=${cohort.join(',')}`);
        }
        if (hashElements.length > 0) {
            url += '#'+hashElements.join('&');
        }
        return url;
    }

    private handleSelect(key: number, e:React.SyntheticEvent<any>): void {
        this.setState(({ activeTabKey : key } as IPatientViewState));
    }

    public render() {

        let sampleManager: SampleManager | null = null;
        let sampleHeader: (JSX.Element | undefined)[] | null = null;
        let cohortNav: JSX.Element | null = null;

        if (patientViewPageStore.patientViewData.isComplete) {
            let patientData = patientViewPageStore.patientViewData.result!;
            sampleManager = new SampleManager(patientData.samples!);

            sampleHeader = _.map(sampleManager!.samples,(sample: ClinicalDataBySampleId) => {
                return sampleManager!.getComponentForSample(sample.id, true);
            });
        }

        if (this.patientIdsInCohort && this.patientIdsInCohort.length > 0) {
            const indexInCohort = this.patientIdsInCohort.indexOf(patientViewPageStore.patientId);
            cohortNav = (
                <TablePaginationControls
                    showItemsPerPageSelector={false}
                    showFirstPage={true}
                    showLastPage={true}
                    textBetweenButtons={`${indexInCohort+1} of ${this.patientIdsInCohort.length} patients`}
                    firstPageDisabled={indexInCohort === 0}
                    previousPageDisabled={indexInCohort === 0}
                    nextPageDisabled={indexInCohort === this.patientIdsInCohort.length-1}
                    lastPageDisabled={indexInCohort === this.patientIdsInCohort.length-1}
                    onFirstPageClick={() => patientViewPageStore.changePatientId(this.patientIdsInCohort[0]) }
                    onPreviousPageClick={() => patientViewPageStore.changePatientId(this.patientIdsInCohort[indexInCohort-1]) }
                    onNextPageClick={() => patientViewPageStore.changePatientId(this.patientIdsInCohort[indexInCohort+1]) }
                    onLastPageClick={() => patientViewPageStore.changePatientId(this.patientIdsInCohort[this.patientIdsInCohort.length-1]) }
                />
            );
        }

        return (
            <div>

                <If condition={(cohortNav != null)}>
                    <div className="clearfix">
                        <div className="pull-right" style={{marginBottom:20}}>
                            {cohortNav}
                        </div>
                    </div>
                </If>

                {  (patientViewPageStore.patientViewData.isComplete) && (
                    <div className="clearfix" style={{padding:20, borderRadius:5, background: '#eee', marginBottom: 20}}>
                        <PatientHeader patient={patientViewPageStore.patientViewData.result!.patient!}/>
                        {sampleHeader}
                    </div>
                    )
                }

                <Tabs animation={false} activeKey={this.state.activeTabKey} id="patientViewPageTabs" onSelect={this.handleSelect as SelectCallback} className="mainTabs" unmountOnExit={true}>
                    <Tab eventKey={2} id="summaryTab" title="Summary">

                        <FeatureTitle title="Genomic Data" isLoading={ !(this.state.mutationData && this.state.cnaSegmentData) } />

                        {
                            (this.state.mutationData && this.state.cnaSegmentData && sampleManager) && (
                                <GenomicOverview
                                    mutations={this.state.mutationData}
                                    cnaSegments={this.state.cnaSegmentData}
                                    sampleOrder={sampleManager.sampleIndex}
                                    sampleLabels={sampleManager.sampleLabels}
                                    sampleColors={sampleManager.sampleColors}
                                    sampleManager={sampleManager}
                                />
                            )
                        }

                        <hr />

                        <FeatureTitle title="Mutations" isLoading={ !this.state.mutationData } />
                        {
                            (this.state.mutationData && !!sampleManager) && (
                                <MutationInformationContainer
                                    mutations={this.state.mutationData}
                                    hotspots={this.state.hotspotsData}
                                    mrnaExprRankData={patientViewPageStore.mrnaExprRankData.isComplete ? patientViewPageStore.mrnaExprRankData.result : undefined }
                                    mutSigData={this.state.mutSigData}
                                    sampleOrder={sampleManager.sampleOrder}
                                    sampleLabels={sampleManager.sampleLabels}
                                    sampleColors={sampleManager.sampleColors}
                                    sampleTumorType={mockData.tumorType}
                                    sampleCancerType={mockData.cancerType}
                                    sampleManager={ sampleManager }
                                />
                            )
                        }
                    </Tab>
                    <Tab eventKey={1} id="clinicalDataTab" title="Clinical Data">

                            <div className="clearfix">
                            <FeatureTitle title="Patient" isLoading={ patientViewPageStore.clinicalDataPatient.isPending } className="pull-left" />
                            { (patientViewPageStore.clinicalDataPatient.isComplete) && (
                                <ClinicalInformationPatientTable showTitleBar={true}
                                                                 data={patientViewPageStore.clinicalDataPatient.result} />

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


                    </Tab>
                </Tabs>


            </div>
        );
    }
}
