import * as React from 'react';
import * as _ from 'lodash';
import {Tabs, Tab, default as ReactBootstrap} from 'react-bootstrap';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import MutationInformationContainer from './mutation/MutationInformationContainer';
import {RootState} from '../../redux/rootReducer';
import Spinner from "react-spinkit";
import exposeComponentRenderer from '../../shared/lib/exposeComponentRenderer';
import GenomicOverview from './genomicOverview/GenomicOverview';
import mockData from './mock/sampleData.json';
import Connector, { ClinicalInformationData } from "./Connector";
import {ClinicalData, SampleIdentifier, GeneticProfile, Sample} from "shared/api/CBioPortalAPI";
import { ClinicalDataBySampleId } from "../../shared/api/api-types-extended";
import { RequestStatus } from "../../shared/api/api-types-extended";
import { default as CBioPortalAPI, Mutation }  from "../../shared/api/CBioPortalAPI";
import FeatureTitle from '../../shared/components/featureTitle/FeatureTitle';
import renderIf from 'render-if';
import { If, Then, Else } from 'react-if';
import queryString from "query-string";
import SampleManager from './sampleManager';
import SelectCallback = ReactBootstrap.SelectCallback;
import {
    default as CancerHotspotsAPI, HotspotMutation
} from "../../shared/api/CancerHotspotsAPI";
import {
    MutSig, MrnaPercentile, default as CBioPortalAPIInternal,
    VariantCountIdentifier, VariantCount, CosmicMutation
} from "../../shared/api/CBioPortalAPIInternal";
import PatientHeader from './patientHeader/PatientHeader';
import {TablePaginationControls} from "../../shared/components/tablePaginationControls/TablePaginationControls";
import { PatientViewPageStore } from './clinicalInformation/PatientViewPageStore';
import ClinicalInformationPatientTable from "./clinicalInformation/ClinicalInformationPatientTable";
import ClinicalInformationSamples from "./clinicalInformation/ClinicalInformationSamplesTable";
import {ICosmicData} from "../../shared/components/mutationTable/column/CosmicColumnFormatter";
import {IVariantCountData} from "./mutation/column/CohortColumnFormatter";
import {observer} from "mobx-react";
import {IHotspotData, IMyCancerGenomeData, IMyCancerGenome} from "./mutation/column/AnnotationColumnFormatter";
import {getSpans} from './clinicalInformation/lib/clinicalAttributesUtil.js';
import CopyNumberAlterationsTable from "./copyNumberAlterations/CopyNumberAlterationsTable";
import CopyNumberTableWrapper from "./copyNumberAlterations/CopyNumberTableWrapper";
import {reaction} from "mobx";

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

export type MrnaRankData = { [sampleId:string]: { [entrezGeneId:string]: {percentile:number, zScore:number}}};
export type MutSigData = { [entrezGeneId:string]:{ qValue:number } }

interface IPatientViewState {
    mutationData: any;
    myCancerGenomeData?: IMyCancerGenomeData;
    hotspotsData?: IHotspotData;
    cosmicData?: ICosmicData;
    mutSigData?: MutSigData;
    variantCountData?: IVariantCountData;
    activeTabKey: number;
}

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
            hotspotsData: undefined,
            variantCountData: undefined,
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

        patientViewPageStore.setPatientId(qs['case_id'] + '');

        const qs_hash = queryString.parse((window as any).location.hash);
        this.patientIdsInCohort = (!!qs_hash['nav_case_ids'] ? (qs_hash['nav_case_ids'] as string).split(",") : []);

        this.mutationGeneticProfileId = `${patientViewPageStore.studyId}_mutations`;

    }

    fetchMyCancerGenomeData():Promise<IMyCancerGenomeData> {
        // mapping by hugo gene symbol
        const generateMap = function(myCancerGenomes:IMyCancerGenome[]) {
            const map:IMyCancerGenomeData = {};

            _.each(myCancerGenomes, function (myCancerGenome) {
                if (!(myCancerGenome.hugoGeneSymbol in map)) {
                    map[myCancerGenome.hugoGeneSymbol] = [];
                }

                map[myCancerGenome.hugoGeneSymbol].push(myCancerGenome);
            });

            return map;
        };

        return new Promise((resolve, reject) => {
            const data:IMyCancerGenome[] = require('../../../resources/mycancergenome.json');
            resolve(generateMap(data));
        });
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

    fetchCosmicData(mutations:Mutation[]):Promise<ICosmicData> {
        const generateMap = function(cosmicMutations:CosmicMutation[]) {
            // key => geneSymbol_proteinPosition
            // protienPosition => start[_end]
            const map: ICosmicData = {};

            // create a map for a faster lookup
            _.each(cosmicMutations, function(cosmic:CosmicMutation) {
                if (!(cosmic.keyword in map)) {
                    map[cosmic.keyword] = [];
                }

                map[cosmic.keyword].push(cosmic);
            });

            return map;
        };

        const queryKeywords:string[] = _.uniq(_.map(mutations, (mutation:Mutation) => mutation.keyword));

        return new Promise((resolve, reject) => {
            const promise = this.tsInternalClient.fetchCosmicCountsUsingPOST({
                keywords: _.filter(queryKeywords, (query) => {return query != null;})
            });

            promise.then((data) => {
                resolve(generateMap(data));
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

    fetchVariantCountData(mutations:Mutation[]):Promise<IVariantCountData> {
        return new Promise((resolve, reject) => {
            const variantCountIdentifiers:VariantCountIdentifier[] = [];
            const toQuery:{ [entrezGeneId:string]:{ [keyword:string]:boolean}} = {};
            for (const mutation of mutations) {
                let entrezGeneId = mutation.entrezGeneId;
                let keyword = mutation.keyword;
                toQuery[entrezGeneId] = toQuery[entrezGeneId] || {};
                if (keyword) {
                    toQuery[entrezGeneId][keyword] = true;
                }
            }
            for (const entrezGeneId in toQuery) {
                if (toQuery.hasOwnProperty(entrezGeneId)) {
                    const entrezGeneIdInt = parseInt(entrezGeneId, 10);
                    let keywords = Object.keys(toQuery[entrezGeneId]);
                    if (keywords.length === 0) {
                        variantCountIdentifiers.push({
                            entrezGeneId: entrezGeneIdInt
                        } as VariantCountIdentifier);
                    } else {
                        for (const keyword of keywords) {
                            variantCountIdentifiers.push({
                                entrezGeneId: entrezGeneIdInt,
                                keyword: keyword
                            });
                        }
                    }
                }
            }
            const fetchPromise = this.tsInternalClient.fetchVariantCountsUsingPOST({
                geneticProfileId: this.mutationGeneticProfileId,
                variantCountIdentifiers
            });
            fetchPromise.then((variantCounts:VariantCount[]) => {
                const ret:IVariantCountData = {};
                if (variantCounts.length > 0) {
                    ret.numberOfSamples = variantCounts[0].numberOfSamples;
                    ret.geneData = {};
                    for (const variantCount of variantCounts) {
                        let entrezGeneId = variantCount.entrezGeneId;
                        ret.geneData[entrezGeneId] = { numberOfSamplesWithKeyword: {} };
                    }
                    for (const variantCount of variantCounts) {
                        let geneData = ret.geneData[variantCount.entrezGeneId];
                        geneData.numberOfSamplesWithMutationInGene = variantCount.numberOfSamplesWithMutationInGene;
                        if (typeof variantCount.keyword !== "undefined") {
                            (geneData.numberOfSamplesWithKeyword as {[keyword:string]:number})
                                [variantCount.keyword] = variantCount.numberOfSamplesWithKeyword;
                        }
                    }
                }
                resolve(ret);
            });
            fetchPromise.catch(() => reject());
        });
    }


    public componentDidMount() {

        const reaction1 = reaction(
            () => { return patientViewPageStore.mutationData.isComplete },
            (isComplete:Boolean) => {
                if (isComplete) {
                    let sampleIds: string[] = patientViewPageStore.samples.result.map((sample:Sample) => sample.sampleId);  //this.props.samples.map((item: ClinicalDataBySampleId)=>item.id);

                    this.fetchMyCancerGenomeData().then((_result) => {
                        this.setState(({myCancerGenomeData: _result} as IPatientViewState));
                    });

                    this.fetchHotspotsData(patientViewPageStore.mutationData.result).then((hotspotsData:IHotspotData) => {
                        this.setState(({ hotspotsData } as IPatientViewState));
                    });
                    this.fetchVariantCountData(patientViewPageStore.mutationData.result).then((variantCountData:IVariantCountData) => {
                        this.setState(({ variantCountData } as IPatientViewState));
                    });
                    const hotspotDataPromise = this.fetchHotspotsData(patientViewPageStore.mutationData.result).then((hotspotsData:IHotspotData) =>
                        this.setState(({ hotspotsData } as IPatientViewState)));
                    hotspotDataPromise.catch(()=>{});

                    const cosmicDataPromise = this.fetchCosmicData(patientViewPageStore.mutationData.result).then((cosmicData:ICosmicData) =>
                        this.setState(({ cosmicData } as IPatientViewState)));
                    cosmicDataPromise.catch(()=>{});

                    this.setState(({ mutationData : patientViewPageStore.mutationData.result } as IPatientViewState));

                    this.fetchMutSigData().then((_result) => {
                        const data = _result.reduce((map:MutSigData, next:MutSig) => {
                            map[next.entrezGeneId] = { qValue: next.qValue };
                            return map;
                        }, {});
                        this.setState(({ mutSigData: data } as IPatientViewState));
                    });
                } else {

                    this.setState({
                        mutationData: undefined,
                        hotspotsData: undefined,
                        variantCountData: undefined
                    } as IPatientViewState)

                }
            }
        );

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

    private handleSampleClick(id: string){
        patientViewPageStore.setSampleId(id);
    }


    private getSampleIndent() {
        return (<svg width='20' height='15' style={{marginRight: '5px'}}>
            <line x1='10' y1='0' x2='10' y2='10' stroke='gray' stroke-width='2'></line>
            <line x1='10' y1='10' x2='50' y2='10' stroke='gray' stroke-width='2'></line>
        </svg>);
    }

    public render() {

        let sampleManager: SampleManager | null = null;
        let sampleHeader: (JSX.Element | undefined)[] | null = null;
        let cohortNav: JSX.Element | null = null;

        if (patientViewPageStore.patientViewData.isComplete) {
            let patientData = patientViewPageStore.patientViewData.result!;
            sampleManager = new SampleManager(patientData.samples!);

            sampleHeader = _.map(sampleManager!.samples,(sample: ClinicalDataBySampleId) => {
                const clinicalDataLegacy: any = _.fromPairs(sample.clinicalData.map((x) => [x.clinicalAttributeId, x.value]));
                return (
                    <span style={{paddingRight: '10px'}}>
                        {  sampleManager!.getComponentForSample(sample.id, true) }
                        {'\u00A0'}
                        <a href="javascript:void(0)" onClick={()=>{ this.handleSampleClick(sample.id) }}>{sample.id}</a>
                        <span className='clinical-spans' dangerouslySetInnerHTML={{__html:getSpans(clinicalDataLegacy, 'lgg_ucsf_2014')}}></span>
                    </span>

                )
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
                    onFirstPageClick={() => patientViewPageStore.setPatientId(this.patientIdsInCohort[0]) }
                    onPreviousPageClick={() => patientViewPageStore.setPatientId(this.patientIdsInCohort[indexInCohort-1]) }
                    onNextPageClick={() => patientViewPageStore.setPatientId(this.patientIdsInCohort[indexInCohort+1]) }
                    onLastPageClick={() => patientViewPageStore.setPatientId(this.patientIdsInCohort[this.patientIdsInCohort.length-1]) }
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
                        <PatientHeader
                                       handlePatientClick={(id: string)=>patientViewPageStore.setPatientId(id)}
                                       patient={patientViewPageStore.patientViewData.result!.patient!}/>
                        {sampleHeader}
                    </div>
                    )
                }

                <Tabs animation={false} activeKey={this.state.activeTabKey} id="patientViewPageTabs" onSelect={this.handleSelect as SelectCallback} className="mainTabs" unmountOnExit={true}>
                    <Tab eventKey={1} id="summaryTab" title="Summary">

                        <FeatureTitle title="Genomic Data" isLoading={ (patientViewPageStore.mutationData.isPending || patientViewPageStore.cnaSegments.isPending) } />

                        {
                            (patientViewPageStore.mutationData.isComplete && patientViewPageStore.cnaSegments.isComplete && sampleManager) && (
                                <GenomicOverview
                                    mutations={patientViewPageStore.mutationData.result}
                                    cnaSegments={patientViewPageStore.cnaSegments.result}
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
                                    myCancerGenomeData={this.state.myCancerGenomeData}
                                    hotspots={this.state.hotspotsData}
                                    cosmicData={this.state.cosmicData}
                                    mrnaExprRankData={ patientViewPageStore.mrnaExprRankCache.cache }
                                    mutSigData={this.state.mutSigData}
                                    variantCountData={this.state.variantCountData}
                                    sampleOrder={sampleManager.sampleOrder}
                                    sampleLabels={sampleManager.sampleLabels}
                                    sampleColors={sampleManager.sampleColors}
                                    sampleTumorType={mockData.tumorType}
                                    sampleCancerType={mockData.cancerType}
                                    sampleManager={ sampleManager }
                                    onVisibleRowsChange={ patientViewPageStore.setVisibleRows }
                                />
                            )
                        }
                    </Tab>
                    <Tab eventKey={2} id="discreteCNAData" title="Copy Number Alterations">

                        <CopyNumberTableWrapper store={patientViewPageStore} />

                    </Tab>
                    {(patientViewPageStore.pageMode === 'patient') && (
                        <Tab eventKey={2} id="clinicalDataTab" title="Clinical Data">

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
                    )}
                </Tabs>


            </div>
        );
    }
}
