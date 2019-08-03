import * as React from "react";
import * as _ from "lodash";
import $ from "jquery";
import { QueryParameter } from "../../../shared/lib/ExtendedRouterStore";
import {ResultsViewPageStore, SamplesSpecificationElement, IQueriedMergedTrackCaseData, IQueriedCaseData} from "../ResultsViewPageStore";
import { ResultsViewTab } from "../ResultsViewPageHelpers";
import { generateGeneAlterationData } from "../download/DownloadUtils";
import PathwayMapper, {ICBioData} from "react-pathway-mapper";
import "react-pathway-mapper/dist/base.css";
import PathwayMapperTable, { IPathwayMapperTable } from "./PathwayMapperTable";
import { observer } from "mobx-react";
import autobind from "autobind-decorator";
import { observable, ObservableMap, computed } from "mobx";
import { alterationInfoForOncoprintTrackData } from "shared/components/oncoprint/OncoprintUtils";
import { isMergedTrackFilter } from "shared/lib/oql/oqlfilter";
import { Sample, Patient, MolecularProfile, Gene } from "shared/api/generated/CBioPortalAPI";
import { makeGeneticTrackData } from "shared/components/oncoprint/DataUtils";
import { CoverageInformation } from "../ResultsViewPageStoreUtils";
import { Grid, Col, Row } from "react-bootstrap";

import { AppStore } from "AppStore";
import { remoteData } from "cbioportal-frontend-commons";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import { fetchGenes } from "shared/lib/StoreUtils";
import { ErrorMessages } from "shared/enums/ErrorEnums";
import OqlStatusBanner from "shared/components/oqlStatusBanner/OqlStatusBanner";

import 'react-toastify/dist/ReactToastify.css';
import {ToastContainer, toast} from 'react-toastify';

interface IResultsViewPathwayMapperProps{
    store: ResultsViewPageStore;
    initStore: Function;
    appStore: AppStore;
}

@observer
export default class ResultsViewPathwayMapper extends React.Component<IResultsViewPathwayMapperProps, {}>{
    

    @observable
    tableData: IPathwayMapperTable[];

    cBioData: ICBioData[];

    @observable storeForAllData: ResultsViewPageStore;

    @observable selectedPathway: string = "";

    pathwayHandler: Function;

    @observable
    isLoading: boolean;

    @observable
    currentGenes: string[];

    @observable
    validGenes: {[gene: string] : boolean};

    @observable
    activeToasts: React.ReactText[];

    @observable
    remoteGenes = remoteData<string[]>({
        invoke: async () => {
            const genes = await fetchGenes(this.currentGenes);
            
            return genes.map(gene => (gene.hugoGeneSymbol));
        },
        onResult:(genes:string[])=>{
            this.geneChangeHandler(genes);
            genes.forEach(gene => {this.validGenes[gene] = true;});
        }
    });
    addGenomicData: (alterationData: ICBioData[]) => void;


    constructor(props: IResultsViewPathwayMapperProps){
        super(props);
        this.cBioData = [];
        this.tableData = [];
        this.isLoading = false;
        this.validGenes = {};
        this.activeToasts = [];
    }

    render(){

        // Alteration data of query genes are loaded.
        this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach( (alterationData, trackIndex) => {

            this.getOncoData(this.props.store.samples.result,
                             this.props.store.patients.result,
                             this.props.store.coverageInformation.result,
                             this.props.store.sequencedSampleKeysByGene.result!,
                             this.props.store.sequencedPatientKeysByGene.result!,
                             this.props.store.selectedMolecularProfiles.result!,
                             alterationData);
        });


        // Alteration data of non-query genes are loaded.
        const isNewStoreReady = this.storeForAllData && this.storeForAllData.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.isComplete &&
        this.storeForAllData.samples.isComplete &&
        this.storeForAllData.patients.isComplete &&
        this.storeForAllData.coverageInformation.isComplete &&
        this.storeForAllData.sequencedSampleKeysByGene.isComplete &&
        this.storeForAllData.sequencedPatientKeysByGene.isComplete &&
        this.storeForAllData.selectedMolecularProfiles.isComplete;

        if(isNewStoreReady){

            this.storeForAllData.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach( (alterationData, trackIndex) => {
                this.getOncoData(this.storeForAllData.samples.result,
                                 this.storeForAllData.patients.result,
                                 this.storeForAllData.coverageInformation.result,
                                 this.storeForAllData.sequencedSampleKeysByGene.result!,
                                 this.storeForAllData.sequencedPatientKeysByGene.result!,
                                 this.storeForAllData.selectedMolecularProfiles.result!,
                                 alterationData);
                
            });

            this.addGenomicData(this.cBioData);
            // Toasts are removed with delay
            setTimeout(() => {this.activeToasts.forEach(tId => {toast.dismiss(tId);});}, 1000);
        }

        // Call to this.remoteGenes.result helps remoteData to work.
        console.log("this.remoteGenes");
        console.log(this.remoteGenes.result);
        return(

            <div data-test="pathwayMapperTabDiv" className="cBioMode" style={{width: "99%"}}>
                <Row>

                    { !this.isLoading ? 
                    [<OqlStatusBanner className="coexp-oql-status-banner" store={this.props.store} tabReflectsOql={true}/>,
                        
                     (<PathwayMapper isCBioPortal={true} isCollaborative={false} 
                                genes={this.props.store.genes.result as any}
                                cBioAlterationData={this.cBioData}
                                queryParameter={QueryParameter.GENE_LIST}
                                oncoPrintTab={ResultsViewTab.ONCOPRINT}
                                changePathwayHandler={this.changePathwayHandler}
                                addGenomicDataHandler={this.addGenomicDataHandler}
                                tableComponent={PathwayMapperTable}
                                isValidGene={this.isValidGene}
                                toast={toast}/>),
                        (<ToastContainer/>)
                     ]
                    : (<LoadingIndicator isLoading={true} size={"big"} center={true}>
                                </LoadingIndicator>)
                    }
                </Row>
            </div>);
    }


    @autobind
    isValidGene(gene: string){
        return this.validGenes.hasOwnProperty(gene);
    }
    
    @autobind
    addGenomicDataHandler(addGenomicData: (alterationData: ICBioData[]) => void){
        this.addGenomicData = addGenomicData;
    }

    geneChangeHandler(genes: string[]){
        // If there is no new genes then no need to initiate a new store.
        if(genes.length > 0){
            this.storeForAllData = this.props.initStore(this.props.appStore, genes.join(" "));
            const tId = toast("Alteration data of genes not listed in gene list might take a while to load!", {autoClose: false, position: "bottom-left"});
            this.activeToasts.push(tId);
        }
    }


    // When pathway changes in PathwayMapper this callback gets called
    @autobind
    changePathwayHandler(pathwayGenes: string[]){
        this.currentGenes = pathwayGenes;
    }
    

    // Below is the same as alteration calculation of oncodata.
    getOncoData(
        samples: Pick<Sample, 'sampleId'|'studyId'|'uniqueSampleKey'>[],
        patients: Pick<Patient, 'patientId'|'studyId'|'uniquePatientKey'>[],
        coverageInformation: CoverageInformation,
        sequencedSampleKeysByGene: any,
        sequencedPatientKeysByGene: any,
        selectedMolecularProfiles: MolecularProfile[],
        caseData:IQueriedMergedTrackCaseData | (IQueriedCaseData<any> & { mergedTrackOqlList?:never })){
        
        const sampleMode = false;
        const oql = caseData.oql;
        const geneSymbolArray = (isMergedTrackFilter(oql)
            ? oql.list.map(({gene}) => gene)
            : [oql.gene]
        );
        const dataByCase = caseData.cases;
        const data = makeGeneticTrackData(dataByCase.patients, geneSymbolArray, patients as Patient[], coverageInformation, selectedMolecularProfiles);

        const alterationInfo = alterationInfoForOncoprintTrackData(
            sampleMode,
            {trackData: data, oql: geneSymbolArray},
            sequencedSampleKeysByGene,
            sequencedPatientKeysByGene
        );

        // console.log(alterationInfo);
        // console.log(oql);
        this.cBioData.push({gene: (oql as any).gene, altered: alterationInfo.altered, sequenced: alterationInfo.sequenced, percentAltered: alterationInfo.percent});
    }
}