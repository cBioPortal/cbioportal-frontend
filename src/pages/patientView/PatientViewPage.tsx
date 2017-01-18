import * as React from 'react';
import * as _ from 'lodash';
import { Tabs, Tab } from 'react-bootstrap';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import MutationInformationContainer from './mutation/MutationInformationContainer';
//import PatientHeader from './patientHeader/PatientHeader';
//import {IPatientHeaderProps} from './patientHeader/PatientHeader';
import {RootState} from '../../redux/rootReducer';
import exposeComponentRenderer from '../../shared/lib/exposeComponentRenderer';
import GenomicOverview from './genomicOverview/GenomicOverview';
import mockData from './mock/sampleData.json';
import Connector, { ClinicalInformationData } from "./Connector";
import { ClinicalData } from "shared/api/CBioPortalAPI";
import { ClinicalDataBySampleId } from "../../shared/api/api-types-extended";
import { RequestStatus } from "../../shared/api/api-types-extended";
import { default as CBioPortalAPI, Mutation }  from "../../shared/api/CBioPortalAPI";
import FeatureTitle from '../../shared/components/featureTitle/FeatureTitle';
import renderIf from 'render-if';
import { If, Then, Else } from 'react-if';
import queryString from "query-string";
import SelectCallback = ReactBootstrap.SelectCallback;
import Spinner from "react-spinkit";
import SampleManager from './sampleManager';
import SyntheticEvent = __React.SyntheticEvent;

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

interface IPatientViewState {

    cnaSegmentData: any;
    mutationData: any;
    activeTabKey: Number;

}

@Connector.decorator
export default class PatientViewPage extends React.Component<IPatientViewPageProps, IPatientViewState> {


    // private static mapStateToProps(state: RootState): IPatientHeaderProps {
    //
    //     let ci = state.clinicalInformation;
    //     return {
    //         patient: ci.patient,
    //         samples: ci.samples,
    //         status: ci.status,
    //     };
    // }

    private studyId:string;

    private patientId:string;

    private mutationGeneticProfileId:string;

    private tsClient:CBioPortalAPI;

    constructor() {

        super();

        this.state = {
            mutationData: undefined,
            cnaSegmentData: undefined,
            activeTabKey:1
        };

        //this.handleSelect = this.handleSelect.bind(this);

        this.tsClient = new CBioPortalAPI(`//${(window as any)['__API_ROOT__']}`);

        //TODO: this should be done by a module so that it can be reused on other pages
        const qs = queryString.parse((window as any).location.search);
        this.studyId = qs.cancer_study_id;
        this.patientId = qs.case_id;
        this.mutationGeneticProfileId = `${this.studyId}_mutations`;
    }


    fetchCnaSegmentData(_sampleIds: string[]) {

        let cnaSegmentPromise = Promise.resolve(
            $.get("//www.cbioportal.org/api-legacy/copynumbersegments?cancerStudyId=" + this.studyId + "&sampleIds=" + _sampleIds.join(","))
        );
        return cnaSegmentPromise;

    }

    fetchMutationData(_sampleIds: string[]) {

        let mutationDataPromise = this.tsClient.fetchMutationsInGeneticProfileUsingPOST({geneticProfileId: this.mutationGeneticProfileId, sampleIds: _sampleIds, projection: "DETAILED"});
        return mutationDataPromise;

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
                    this.setState(({ mutationData : _result } as IPatientViewState));
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

    private handleSelect(key: Number, e:SyntheticEvent): void {
        this.setState(({ activeTabKey : key } as IPatientViewState));
    }

    public render() {

        let sampleManager: SampleManager | null = null;
        let sampleHeader: JSX.Element[] | null = null;

        if (this.props.samples) {
            sampleManager = new SampleManager(this.props.samples);

            sampleHeader = _.map(sampleManager!.samples,(sample: ClinicalDataBySampleId) => {
                return <span style={{ marginRight:10 }}>{sampleManager!.getComponentForSample(sample.id)} {sample.id}</span>;
            });

        }

        return (
            <div>

                <If condition={sampleHeader}>
                    <div style={{marginBottom:20}}>
                        {sampleHeader}
                    </div>
                </If>

                <Tabs animation={false} activeKey={this.state.activeTabKey} onSelect={ this.handleSelect as SelectCallback} className="mainTabs" unmountOnExit={true}>
                    <Tab eventKey={1} title="Summary">

                        <FeatureTitle title="Genomic Data" isLoading={ !(this.state.mutationData && this.state.cnaSegmentData) } />

                        {
                            renderIf(this.state.mutationData && this.state.cnaSegmentData)(
                                <GenomicOverview
                                    mutations={this.state.mutationData}
                                    cnaSegments={this.state.cnaSegmentData}
                                    sampleOrder={mockData.order}
                                    sampleLabels={mockData.labels}
                                    sampleColors={mockData.colors}
                                />
                            )
                        }

                        <FeatureTitle title="Mutations" isLoading={ !this.state.mutationData } />
                        {
                            (this.state.mutationData && !!sampleManager) && (
                                <MutationInformationContainer
                                    mutations={this.state.mutationData}
                                    sampleOrder={mockData.order}
                                    sampleLabels={mockData.labels}
                                    sampleColors={mockData.colors}
                                    sampleTumorType={mockData.tumorType}
                                    sampleCancerType={mockData.cancerType}
                                    sampleManager={ sampleManager }
                                />
                            )
                        }
                    </Tab>
                    <Tab eventKey={2} title="Clinical Data">

                        <ClinicalInformationContainer status={ this.props.clinicalDataStatus } patient={this.props.patient} samples={this.props.samples} />

                    </Tab>
                </Tabs>


            </div>
        );
    }
}
