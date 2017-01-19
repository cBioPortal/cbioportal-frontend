import * as React from 'react';
import * as _ from 'lodash';
import {Tabs, Tab, default as ReactBootstrap} from 'react-bootstrap';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import MutationInformationContainer from './mutation/MutationInformationContainer';
//import PatientHeader from './patientHeader/PatientHeader';
//import {IPatientHeaderProps} from './patientHeader/PatientHeader';
import {RootState} from '../../redux/rootReducer';
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
import {MrnaPercentile, default as CBioPortalAPIInternal} from "../../shared/api/CBioPortalAPIInternal";
import PatientHeader from './patientHeader/PatientHeader';


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

export type MrnaRankData = { [sampleId:string]: { [entrezGeneId:string]: {percentile:number, zScore:number}}};

interface IPatientViewState {

    cnaSegmentData: any;
    mutationData: any;
    mrnaExprRankData?: MrnaRankData;
    activeTabKey: number;
    hotspotsData: any;

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

    private hotspotsClient:CancerHotspotsAPI;
    private hotspots3dClient:CancerHotspotsAPI;

    private tsInternalClient:CBioPortalAPIInternal;

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
        this.studyId = qs['cancer_study_id'] + '';
        this.patientId = qs['case_id'] + '';
        this.mutationGeneticProfileId = `${this.studyId}_mutations`;
    }

    fetchHotspotsData(mutations:Mutation[]) {
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

        const promiseSingle = new Promise((resolve, reject) => {
            const promise = this.hotspotsClient.getAllHotspotMutations({});

            promise.then((data) => {
                resolve(generateMap(data));
            });
        });

        const promiseClustered = new Promise((resolve, reject) => {
            const promise = this.hotspots3dClient.getAll3dHotspotMutations({});

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

    fetchMrnaZscoreProfile():Promise<string> {
        return new Promise((resolve, reject) => {
            let geneticProfilesPromise = this.tsClient.getAllGeneticProfilesInStudyUsingGET({studyId: this.studyId});
            const regex1 = /^.+rna_seq.*_zscores$/;
            const regex2 = /^.*_zscores$/;
            geneticProfilesPromise.then((d) => {
                const chosenProfile:GeneticProfile = d.reduce((curr: GeneticProfile, next: GeneticProfile) => {
                    const nextId = next.geneticProfileId.toLowerCase();
                    if (curr && curr.geneticProfileId.toLowerCase().match(regex1) !== null) {
                        return curr;
                    } else if (nextId.match(regex1) !== null ||
                        nextId.match(regex2) !== null) {
                        return next;
                    }
                    return curr;
                }, undefined);
                if (chosenProfile) {
                    resolve(chosenProfile.geneticProfileId);
                } else {
                    reject();
                }
            });
        });
    }

    fetchCnaSegmentData(_sampleIds: string[]) {

        const ids: SampleIdentifier[] = _sampleIds.map((id: string) => { return { sampleId:id, studyId: this.studyId }; });

        return this.tsClient.fetchCopyNumberSegmentsUsingPOST({sampleIdentifiers:ids, projection: 'DETAILED'});

    }

    fetchMutationData(_sampleIds: string[]) {

        let mutationDataPromise = this.tsClient.fetchMutationsInGeneticProfileUsingPOST({geneticProfileId: this.mutationGeneticProfileId, sampleIds: _sampleIds, projection: "DETAILED"});
        return mutationDataPromise;

    }

    fetchMrnaExprRank(_sampleToEntrezGeneIds:{ [s:string]:Set<number> }):Promise<MrnaRankData> {
        return new Promise((resolve, reject) => {
            const _sampleIds = Object.keys(_sampleToEntrezGeneIds);
            const fetchProfilePromise = this.fetchMrnaZscoreProfile();
            fetchProfilePromise.then((profile) => {
                const mrnaPercentiles: MrnaPercentile[] = [];
                const fetchAllMrnaPercentilesPromise = Promise.all(_sampleIds.map(sampleId => (new Promise((resolve, reject) => {
                    const entrezGeneIds = _sampleToEntrezGeneIds[sampleId];
                    if (typeof entrezGeneIds === "undefined" || entrezGeneIds.size === 0) {
                        resolve();
                    } else {
                        const fetchMrnaPercentilesPromise = this.tsInternalClient.fetchMrnaPercentileUsingPOST({geneticProfileId:profile, sampleId:sampleId, entrezGeneIds: Array.from(entrezGeneIds)});
                        fetchMrnaPercentilesPromise.then((d) => {
                            mrnaPercentiles.push(...d);
                            resolve();
                        });
                        fetchMrnaPercentilesPromise.catch(() => reject());
                    }
                }))));
                fetchAllMrnaPercentilesPromise.then(() => {
                    let mrnaRankData:MrnaRankData = mrnaPercentiles.reduce((map: any, next: any) => {
                        map[next.sampleId] = map[next.sampleId] || {};
                        map[next.sampleId][next.entrezGeneId] = {
                            percentile: next.percentile,
                            zScore: next.zScore
                        };
                        return map;
                    }, {});
                    resolve(mrnaRankData);
                });
                fetchAllMrnaPercentilesPromise.catch(() => reject());
            });
            fetchProfilePromise.catch(() => reject());
        });
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
                    this.fetchHotspotsData(_result).then((hotspotsData) => {
                        this.setState(({ hotspotsData } as IPatientViewState));
                    });
                    this.setState(({ mutationData : _result } as IPatientViewState));

                    const sampleToEntrezGeneIds = _result.reduce((map:{ [s:string]:Set<number> }, next:Mutation) => {
                        const sampleId = next.sampleId;
                        map[sampleId] = map[sampleId] || new Set();
                        map[sampleId].add(next.entrezGeneId);
                        return map;
                    }, {});
                    const fetchMrnaExprRankPromise = this.fetchMrnaExprRank(sampleToEntrezGeneIds);
                    fetchMrnaExprRankPromise.then((_mrna_result:any) => {
                        this.setState(({ mrnaExprRankData : _mrna_result }) as IPatientViewState);
                    });
                    fetchMrnaExprRankPromise.catch(()=>{});
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

    private handleSelect(key: number, e:React.SyntheticEvent<any>): void {
        this.setState(({ activeTabKey : key } as IPatientViewState));
    }

    public render() {

        let sampleManager: SampleManager | null = null;
        let sampleHeader: (JSX.Element | undefined)[] | null = null;

        if (this.props.samples) {
            sampleManager = new SampleManager(this.props.samples);

            sampleHeader = _.map(sampleManager!.samples,(sample: ClinicalDataBySampleId) => {
                return sampleManager!.getComponentForSample(sample.id, true);
            });
        }

        return (
            <div>

                <If condition={sampleHeader}>
                    <div style={{padding:20, borderRadius:5, background: '#eee', marginBottom: 20}}>
                        <PatientHeader patient={this.props.patient} />
                        {sampleHeader}
                    </div>
                </If>

                <Tabs animation={false} activeKey={this.state.activeTabKey} onSelect={this.handleSelect as SelectCallback} className="mainTabs" unmountOnExit={true}>
                    <Tab eventKey={1} title="Summary">

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
                                    mrnaExprRankData={this.state.mrnaExprRankData}
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
                    <Tab eventKey={2} title="Clinical Data">

                        <ClinicalInformationContainer status={ this.props.clinicalDataStatus } patient={this.props.patient} samples={this.props.samples} />

                    </Tab>
                </Tabs>


            </div>
        );
    }
}
