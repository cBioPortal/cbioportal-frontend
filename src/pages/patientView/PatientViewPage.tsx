import * as React from 'react';
import * as _ from 'lodash';
import {Tabs, Tab, default as ReactBootstrap} from 'react-bootstrap';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import MutationInformationContainer from './mutation/MutationInformationContainer';

import {RootState} from '../../redux/rootReducer';
import exposeComponentRenderer from '../../shared/lib/exposeComponentRenderer';
import GenomicOverview from './genomicOverview/GenomicOverview';
import mockData from './mock/sampleData.json';
import Connector, { ClinicalInformationData } from "./Connector";
import {
    ClinicalData, SampleIdentifier, GeneticProfile, DiscreteCopyNumberFilter,
    DiscreteCopyNumberData
} from "shared/api/CBioPortalAPI";
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
import {ICosmicData} from "../../shared/components/mutationTable/column/CosmicColumnFormatter";
import {IVariantCountData} from "./mutation/column/CohortColumnFormatter";

import {IHotspotData, IMyCancerGenomeData, IMyCancerGenome} from "./mutation/column/AnnotationColumnFormatter";
import {getSpans} from './clinicalInformation/lib/clinicalAttributesUtil.js';
import CopyNumberAlterationsTable from "./copyNumberAlterations/CopyNumberAlterationsTable";


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

    cnaSegmentData: any;
    mutationData: any;
    myCancerGenomeData?: IMyCancerGenomeData;
    hotspotsData?: IHotspotData;
    cosmicData?: ICosmicData;
    mrnaExprRankData?: MrnaRankData;
    mutSigData?: MutSigData;
    variantCountData?: IVariantCountData;
    activeTabKey: number;
    discreteCnaData?: DiscreteCopyNumberData[];
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

    private patientIdsInCohort:string[];

    constructor() {

        super();

        this.state = {
            mutationData: undefined,
            cnaSegmentData: undefined,
            hotspotsData: undefined,
            mrnaExprRankData: undefined,
            variantCountData: undefined,
            activeTabKey:1,
            discreteCnaData:undefined
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

        const qs_hash = queryString.parse((window as any).location.hash);
        this.patientIdsInCohort = (!!qs_hash['nav_case_ids'] ? (qs_hash['nav_case_ids'] as string).split(",") : []);
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

    fetchDiscreteCnaData(_sampleIds: string[]) {
        return this.tsClient.fetchDiscreteCopyNumbersInGeneticProfileUsingPOST({
            projection:'DETAILED',
            discreteCopyNumberFilter:{ sampleIds:  _sampleIds } as DiscreteCopyNumberFilter,
            geneticProfileId: this.studyId + '_gistic'
        });

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

    fetchMutSigData():Promise<MutSig[]> {
        return this.tsInternalClient.getSignificantlyMutatedGenesUsingGET({studyId: this.studyId});
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

                this.fetchDiscreteCnaData(sampleIds).then((_result)=>{
                    console.log(_result);
                    this.setState(({ discreteCnaData:_result } as IPatientViewState))
                });

                this.fetchMyCancerGenomeData().then((_result) => {
                    this.setState(({myCancerGenomeData: _result} as IPatientViewState));
                });

                this.fetchMutationData(sampleIds).then((_result) => {
                    this.fetchVariantCountData(_result).then((variantCountData:IVariantCountData) => {
                        this.setState(({ variantCountData } as IPatientViewState));
                    });
                    const hotspotDataPromise = this.fetchHotspotsData(_result).then((hotspotsData:IHotspotData) =>
                        this.setState(({ hotspotsData } as IPatientViewState)));
                    hotspotDataPromise.catch(()=>{});

                    const cosmicDataPromise = this.fetchCosmicData(_result).then((cosmicData:ICosmicData) =>
                        this.setState(({ cosmicData } as IPatientViewState)));
                    cosmicDataPromise.catch(()=>{});

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

        if (this.props.samples) {
            sampleManager = new SampleManager(this.props.samples);

            sampleHeader = _.map(sampleManager!.samples,(sample: ClinicalDataBySampleId) => {
                const clinicalDataLegacy: any = _.fromPairs(sample.clinicalData.map((x) => [x.clinicalAttributeId, x.value]));
                return (
                    <span style={{paddingRight: '10px'}}>
                        {  sampleManager!.getComponentForSample(sample.id, true) }
                        {'\u00A0' + sample.id}
                        <span className='clinical-spans' dangerouslySetInnerHTML={{__html:getSpans(clinicalDataLegacy, 'lgg_ucsf_2014')}}></span>
                    </span>

                )
            });
        }

        if (this.patientIdsInCohort && this.patientIdsInCohort.length > 0) {
            const indexInCohort = this.patientIdsInCohort.indexOf(this.patientId);
            cohortNav = (<TablePaginationControls
                            showItemsPerPageSelector={false}
                            showFirstPage={true}
                            showLastPage={true}
                            textBetweenButtons={`${indexInCohort+1} of ${this.patientIdsInCohort.length} patients`}
                            firstPageDisabled={indexInCohort === 0}
                            previousPageDisabled={indexInCohort === 0}
                            nextPageDisabled={indexInCohort === this.patientIdsInCohort.length-1}
                            lastPageDisabled={indexInCohort === this.patientIdsInCohort.length-1}
                            onFirstPageClick={() =>
                                window.location.href = this.buildURL(
                                    this.patientIdsInCohort[0],
                                    this.studyId,
                                    this.patientIdsInCohort)}
                            onPreviousPageClick={() =>
                                window.location.href = this.buildURL(
                                    this.patientIdsInCohort[indexInCohort-1],
                                    this.studyId,
                                    this.patientIdsInCohort)}
                            onNextPageClick={() =>
                                window.location.href = this.buildURL(
                                    this.patientIdsInCohort[indexInCohort+1],
                                    this.studyId,
                                    this.patientIdsInCohort)}
                            onLastPageClick={() =>
                                window.location.href = this.buildURL(
                                    this.patientIdsInCohort[this.patientIdsInCohort.length-1],
                                    this.studyId,
                                    this.patientIdsInCohort)}
                            />);
        }

        return (
            <div>

                <If condition={sampleHeader}>
                    <div style={{padding:20, borderRadius:5, background: '#eee', marginBottom: 20}}>
                        <PatientHeader patient={this.props.patient} />
                        {this.getSampleIndent()}{sampleHeader}
                    </div>
                </If>

                <If condition={cohortNav}>
                    <div style={{marginBottom:20}}>
                        {cohortNav}
                    </div>
                </If>

                <Tabs animation={false} activeKey={this.state.activeTabKey} onSelect={this.handleSelect as SelectCallback} className="mainTabs" unmountOnExit={true}>
                    <Tab eventKey={1} title="Summary">

                        <FeatureTitle title="Genomic Overview" isLoading={ !(this.state.mutationData && this.state.cnaSegmentData) } />

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
                                    myCancerGenomeData={this.state.myCancerGenomeData}
                                    hotspots={this.state.hotspotsData}
                                    cosmicData={this.state.cosmicData}
                                    mrnaExprRankData={this.state.mrnaExprRankData}
                                    mutSigData={this.state.mutSigData}
                                    variantCountData={this.state.variantCountData}
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
                    <Tab eventKey={2} title="Copy Number Alterations">
                        <FeatureTitle title="Copy Number Alterations" isLoading={ !this.state.discreteCnaData } />

                        {
                            (this.state.discreteCnaData) && (
                                <CopyNumberAlterationsTable rawData={this.state.discreteCnaData} />
                            )

                        }


                    </Tab>
                    <Tab eventKey={3} title="Clinical Data">

                        <ClinicalInformationContainer status={ this.props.clinicalDataStatus } patient={this.props.patient} samples={this.props.samples} />

                    </Tab>
                </Tabs>


            </div>
        );
    }
}
