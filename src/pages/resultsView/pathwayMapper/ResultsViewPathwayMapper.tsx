import * as React from "react";
import * as _ from "lodash";
import $ from "jquery";
import { QueryParameter } from "../../../shared/lib/ExtendedRouterStore";
import {ResultsViewPageStore, SamplesSpecificationElement, IQueriedMergedTrackCaseData, IQueriedCaseData} from "../ResultsViewPageStore";
import { ResultsViewTab } from "../ResultsViewPageHelpers";
import { generateGeneAlterationData } from "../download/DownloadUtils";
import PathwayMapper, {ICBioData} from "pathway-mapper";
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
import OqlStatusBanner from "shared/components/banners/OqlStatusBanner";
import {getAlterationData} from "shared/components/oncoprint/OncoprintUtils";
import 'react-toastify/dist/ReactToastify.css';
import {ToastContainer, toast} from 'react-toastify';

interface IResultsViewPathwayMapperProps {
    store: ResultsViewPageStore;
    initStore: (appStore: AppStore, genes: string) => ResultsViewPageStore;
    appStore: AppStore;
}

@observer
export default class ResultsViewPathwayMapper extends React.Component<IResultsViewPathwayMapperProps> {
    
    alterationFrequencyData: ICBioData[];

    @observable selectedPathway = "";

    @observable
    isLoading: boolean;

    @observable
    currentGenes: string[];

    @observable
    activeToasts: React.ReactText[];


    // This accumulates valid genes
    validGenesAccumulator: {[gene: string]: boolean};

    @observable
    validNonQueryGenes = remoteData<string[]>({
        invoke: async () => {
            const genes = await fetchGenes(this.currentGenes);
            
            return genes.map(gene => (gene.hugoGeneSymbol));
        }
    });

    addGenomicData: (alterationData: ICBioData[]) => void;

    pathwayHandler: Function;

    constructor(props: IResultsViewPathwayMapperProps){
        super(props);
        this.alterationFrequencyData = [];
        this.isLoading = false;
        this.activeToasts = [];
        this.validGenesAccumulator = {};
    }

    render() {

        // Alteration data of query genes are loaded.
        this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach( (alterationData, trackIndex) => {

            getAlterationData(this.props.store.samples.result,
                              this.props.store.patients.result,
                              this.props.store.coverageInformation.result,
                              this.props.store.sequencedSampleKeysByGene.result!,
                              this.props.store.sequencedPatientKeysByGene.result!,
                              this.props.store.selectedMolecularProfiles.result!,
                              alterationData,
                              true,
                              this.alterationFrequencyData,
                              this.props.store.genes.result!);
        });


        // Alteration data of non-query genes are loaded.
        const isNewStoreReady = this.storeForAllData &&
                                this.storeForAllData.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.isComplete &&
                                this.storeForAllData.samples.isComplete &&
                                this.storeForAllData.patients.isComplete &&
                                this.storeForAllData.coverageInformation.isComplete &&
                                this.storeForAllData.sequencedSampleKeysByGene.isComplete &&
                                this.storeForAllData.sequencedPatientKeysByGene.isComplete &&
                                this.storeForAllData.selectedMolecularProfiles.isComplete;

        if(isNewStoreReady){

            this.storeForAllData!.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach( (alterationData, trackIndex) => {
                getAlterationData(this.storeForAllData!.samples.result,
                                  this.storeForAllData!.patients.result,
                                  this.storeForAllData!.coverageInformation.result,
                                  this.storeForAllData!.sequencedSampleKeysByGene.result!,
                                  this.storeForAllData!.sequencedPatientKeysByGene.result!,
                                  this.storeForAllData!.selectedMolecularProfiles.result!,
                                  alterationData,
                                  false,
                                  this.alterationFrequencyData,
                                  this.props.store.genes.result!);
                
            });

            this.addGenomicData(this.alterationFrequencyData);
            // Toasts are removed with delay
            setTimeout(() => {this.activeToasts.forEach(tId => {toast.dismiss(tId);});}, 1000);
        }

        return(

            <div className="pathwayMapper">
            <div data-test="pathwayMapperTabDiv" className="cBioMode" style={{width: "99%"}}>
                <Row>

                    { !this.isLoading ? 

                        <React.Fragment>
                            <OqlStatusBanner className="coexp-oql-status-banner" store={this.props.store} tabReflectsOql={true}/>

                            <PathwayMapper
                                isCBioPortal={true}
                                isCollaborative={false}
                                genes={this.props.store.genes.result as any}
                                cBioAlterationData={this.alterationFrequencyData}
                                queryParameter={QueryParameter.GENE_LIST}
                                oncoPrintTab={ResultsViewTab.ONCOPRINT}
                                changePathwayHandler={this.changePathwayHandler}
                                addGenomicDataHandler={this.addGenomicDataHandler}
                                tableComponent={PathwayMapperTable}
                                validGenes={this.validGenes}
                                toast={toast}
                            />
                            <ToastContainer/>
                        </React.Fragment>
                    :   <LoadingIndicator isLoading={true} size={"big"} center={true}/>
                    }
                </Row>
            </div>
            </div>);
    }

    @computed get storeForAllData(){
        // Currently Pathways (PathwayMapper) tab must be active, otherwise; all toasts must be closed.
        if(this.props.store.tabId !== ResultsViewTab.PATHWAY_MAPPER){
            this.activeToasts.length = 0;
            toast.dismiss();
            return null;
        }
        if(this.validNonQueryGenes.isComplete && this.validNonQueryGenes.result.length > 0){
            const tId = toast("Alteration data of genes not listed in gene list might take a while to load!",
                              {autoClose: false, position: "bottom-left"});
            this.activeToasts.push(tId);
            return this.props.initStore(this.props.appStore, this.validNonQueryGenes.result.join(" "));
        }
    }

    @computed get validGenes(){
        if(this.validNonQueryGenes.isComplete){
            // Valid genes are accumulated.
            this.validNonQueryGenes.result.forEach(gene => {this.validGenesAccumulator[gene] = true;});
        }
        return this.validGenesAccumulator;
    }

    // addGenomicData function is implemented in PathwayMapper component and overlays
    // alteration data onto genes. Through this function callback, the function implemented
    // in PathwayMapper is copied here.
    @autobind
    addGenomicDataHandler(addGenomicData: (alterationData: ICBioData[]) => void){
        this.addGenomicData = addGenomicData;
    }

    // When pathway changes in PathwayMapper this callback gets called
    @autobind
    changePathwayHandler(pathwayGenes: string[]){
        // Pathway genes here are the genes that are in the pathway and valid whose alteration data is not calculated yet.
        // Hence it does not necessarily mean
        this.currentGenes = pathwayGenes;
    }
}