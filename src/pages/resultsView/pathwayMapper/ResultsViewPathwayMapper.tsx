import * as React from 'react';
import _ from 'lodash';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { ResultsViewTab } from '../ResultsViewPageHelpers';
import PathwayMapper, { ICBioData } from 'pathway-mapper';
import 'pathway-mapper/dist/base.css';
import PathwayMapperTable from './PathwayMapperTable';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { observable, computed } from 'mobx';
import { Row } from 'react-bootstrap';

import { AppStore } from 'AppStore';
import { remoteData } from 'cbioportal-frontend-commons';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { fetchGenes } from 'shared/lib/StoreUtils';
import OqlStatusBanner from 'shared/components/banners/OqlStatusBanner';
import { getAlterationData } from 'shared/components/oncoprint/OncoprintUtils';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import ResultsViewURLWrapper from '../ResultsViewURLWrapper';
import ExtendedRouterStore from '../../../shared/lib/ExtendedRouterStore';

import 'cytoscape-panzoom/cytoscape.js-panzoom.css';
import 'cytoscape-navigator/cytoscape.js-navigator.css';
import 'react-toastify/dist/ReactToastify.css';

interface IResultsViewPathwayMapperProps {
    store: ResultsViewPageStore;
    initStore: (
        appStore: AppStore,
        urlWrapper: ResultsViewURLWrapper
    ) => ResultsViewPageStore;
    appStore: AppStore;
    routerStore: ExtendedRouterStore;
}

@observer
export default class ResultsViewPathwayMapper extends React.Component<
    IResultsViewPathwayMapperProps
> {
    @observable selectedPathway = '';

    @observable
    isLoading: boolean;

    @observable
    currentGenes: string[];

    @observable
    activeToasts: React.ReactText[];

    // This accumulates valid genes
    validGenesAccumulator: { [gene: string]: boolean };

    @observable
    validNonQueryGenes = remoteData<string[]>({
        invoke: async () => {
            const genes = await fetchGenes(this.currentGenes);

            return genes.map(gene => gene.hugoGeneSymbol);
        },
    });

    @observable
    private addGenomicData: (alterationData: ICBioData[]) => void;

    pathwayHandler: Function;

    constructor(props: IResultsViewPathwayMapperProps) {
        super(props);
        this.isLoading = false;
        this.activeToasts = [];
        this.validGenesAccumulator = {};
    }

    @computed get alterationFrequencyData(): ICBioData[] {
        return this.alterationFrequencyDataForQueryGenes.concat(
            this.alterationFrequencyDataForNonQueryGenes
        );
    }

    @computed get alterationFrequencyDataForQueryGenes() {
        const alterationFrequencyData: ICBioData[] = [];

        this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
            alterationData => {
                const data = getAlterationData(
                    this.props.store.samples.result,
                    this.props.store.patients.result,
                    this.props.store.coverageInformation.result,
                    this.props.store.sequencedSampleKeysByGene.result!,
                    this.props.store.sequencedPatientKeysByGene.result!,
                    this.props.store.selectedMolecularProfiles.result!,
                    alterationData,
                    true,
                    this.props.store.genes.result!
                );

                if (data) {
                    alterationFrequencyData.push(data);
                }
            }
        );

        return alterationFrequencyData;
    }

    @computed get alterationFrequencyDataForNonQueryGenes() {
        const alterationFrequencyData: ICBioData[] = [];

        if (this.isNewStoreReady) {
            this.storeForAllData!.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
                alterationData => {
                    const data = getAlterationData(
                        this.storeForAllData!.samples.result,
                        this.storeForAllData!.patients.result,
                        this.storeForAllData!.coverageInformation.result,
                        this.storeForAllData!.sequencedSampleKeysByGene.result!,
                        this.storeForAllData!.sequencedPatientKeysByGene
                            .result!,
                        this.storeForAllData!.selectedMolecularProfiles.result!,
                        alterationData,
                        false,
                        this.props.store.genes.result!
                    );

                    if (data) {
                        alterationFrequencyData.push(data);
                    }
                }
            );
        }

        return alterationFrequencyData;
    }

    @computed get isNewStoreReady() {
        return (
            this.storeForAllData &&
            this.storeForAllData
                .oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.isComplete &&
            this.storeForAllData.samples.isComplete &&
            this.storeForAllData.patients.isComplete &&
            this.storeForAllData.coverageInformation.isComplete &&
            this.storeForAllData.sequencedSampleKeysByGene.isComplete &&
            this.storeForAllData.sequencedPatientKeysByGene.isComplete &&
            this.storeForAllData.selectedMolecularProfiles.isComplete
        );
    }

    render() {
        // Alteration data of non-query genes are loaded.
        if (this.isNewStoreReady) {
            this.addGenomicData(this.alterationFrequencyData);
            // Toasts are removed with delay
            setTimeout(() => {
                this.activeToasts.forEach(tId => {
                    toast.dismiss(tId);
                });
            }, 2000);
        }

        return (
            <div className="pathwayMapper">
                <div
                    data-test="pathwayMapperTabDiv"
                    className="cBioMode"
                    style={{ width: '99%' }}
                >
                    <Row>
                        {!this.isLoading ? (
                            <React.Fragment>
                                <OqlStatusBanner
                                    className="coexp-oql-status-banner"
                                    store={this.props.store}
                                    tabReflectsOql={true}
                                />

                                <PathwayMapper
                                    isCBioPortal={true}
                                    isCollaborative={false}
                                    genes={this.props.store.genes.result as any}
                                    cBioAlterationData={
                                        this.alterationFrequencyData
                                    }
                                    onAddGenes={this.handleAddGenes}
                                    changePathwayHandler={
                                        this.changePathwayHandler
                                    }
                                    addGenomicDataHandler={
                                        this.addGenomicDataHandler
                                    }
                                    tableComponent={PathwayMapperTable}
                                    validGenes={this.validGenes}
                                    toast={toast}
                                />
                                <ToastContainer />
                            </React.Fragment>
                        ) : (
                            <LoadingIndicator
                                isLoading={true}
                                size={'big'}
                                center={true}
                            />
                        )}
                    </Row>
                </div>
            </div>
        );
    }

    @computed get storeForAllData(): ResultsViewPageStore | undefined {
        // Currently Pathways (PathwayMapper) tab must be active, otherwise; all toasts must be closed.
        if (this.props.store.tabId !== ResultsViewTab.PATHWAY_MAPPER) {
            this.activeToasts.length = 0;
            toast.dismiss();
            return undefined;
        }

        if (this.urlWrapperForAllGenes) {
            const tId = toast(
                'Alteration data of genes not listed in gene list might take a while to load!',
                { autoClose: false, position: 'bottom-left' }
            );
            this.activeToasts.push(tId);

            return this.props.initStore(
                this.props.appStore,
                this.urlWrapperForAllGenes
            );
        }
    }

    @computed get urlWrapperForAllGenes(): ResultsViewURLWrapper | undefined {
        let urlWrapper: ResultsViewURLWrapper | undefined;

        if (
            this.validNonQueryGenes.isComplete &&
            this.validNonQueryGenes.result.length > 0
        ) {
            const routing = _.cloneDeep(this.props.routerStore);
            routing.location.query.gene_list = this.validNonQueryGenes.result.join(
                ' '
            );
            urlWrapper = new ResultsViewURLWrapper(routing);
        }

        return urlWrapper;
    }

    @computed get validGenes() {
        if (this.validNonQueryGenes.isComplete) {
            // Valid genes are accumulated.
            this.validNonQueryGenes.result.forEach(gene => {
                this.validGenesAccumulator[gene] = true;
            });
        }
        return this.validGenesAccumulator;
    }

    // addGenomicData function is implemented in PathwayMapper component and overlays
    // alteration data onto genes. Through this function callback, the function implemented
    // in PathwayMapper is copied here.
    @autobind
    addGenomicDataHandler(
        addGenomicData: (alterationData: ICBioData[]) => void
    ) {
        this.addGenomicData = addGenomicData;
    }

    // When pathway changes in PathwayMapper this callback gets called
    @autobind
    changePathwayHandler(pathwayGenes: string[]) {
        // Pathway genes here are the genes that are in the pathway and valid whose alteration data is not calculated yet.
        // Hence it does not necessarily mean
        this.currentGenes = pathwayGenes;
    }

    @autobind
    handleAddGenes(selectedGenes: string[]) {
        // add new genes and go to oncoprint tab
        const geneList = this.props.routerStore.location.query.gene_list;

        this.props.routerStore.updateRoute(
            {
                gene_list: `${geneList}\n${selectedGenes.join(' ')}`,
            },
            `results/${ResultsViewTab.ONCOPRINT}`
        );
    }
}
