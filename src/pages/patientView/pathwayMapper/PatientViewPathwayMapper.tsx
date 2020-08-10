import * as React from 'react';
import _ from 'lodash';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { PatientViewPageTabs } from '../PatientViewPageTabs';
import 'pathway-mapper/dist/base.css';
import PathwayMapperTable, { IPathwayMapperTable } from './PathwayMapperTable';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import {
    observable,
    computed,
    action,
    reaction,
    IReactionDisposer,
} from 'mobx';
import { Row } from 'react-bootstrap';
import {
    CancerStudy,
    MolecularProfile,
    Mutation,
} from 'cbioportal-ts-api-client';
import { AppStore } from 'AppStore';
import { remoteData } from 'cbioportal-frontend-commons';
import { fetchGenes } from 'shared/lib/StoreUtils';
import OqlStatusBanner from 'shared/components/banners/OqlStatusBanner';
import { getAlterationData } from 'shared/components/oncoprint/OncoprintUtils';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
//import { initStore } from '../PatientViewPage';
import PatientViewUrlWrapper from '../PatientViewUrlWrapper';

import 'cytoscape-panzoom/cytoscape.js-panzoom.css';
import 'cytoscape-navigator/cytoscape.js-navigator.css';
import 'react-toastify/dist/ReactToastify.css';
import styles from './pathwayMapper.module.scss';
import PathwayMapper, { ICBioData } from 'pathway-mapper';
import AlterationFilterWarning from 'shared/components/banners/AlterationFilterWarning';
import { makeGeneticTrackData } from 'shared/components/oncoprint/DataUtils';
import VariantCountCache from 'shared/cache/VariantCountCache';
import { empty } from 'shared/components/GeneSelectionBox/styles.module.scss';
interface IPatientViewPathwayMapperProps {
    store: PatientViewPageStore;
    appStore: AppStore;
    urlWrapper: PatientViewUrlWrapper;
}
@observer
export default class PatientViewPathwayMapper extends React.Component<
    IPatientViewPathwayMapperProps
> {
    private accumulatedAlterationFrequencyDataForNonQueryGenes: ICBioData[];
    private readonly accumulatedValidGenes: { [gene: string]: boolean };

    @observable
    private selectedPathway = '';

    @observable
    private newGenesFromPathway: string[];

    @observable
    private activeToasts: React.ReactText[];

    private toastReaction: IReactionDisposer;

    private readonly validNonQueryGenes = remoteData<string[]>({
        invoke: async () => {
            const genes = await fetchGenes(this.newGenesFromPathway);

            return genes.map(gene => gene.hugoGeneSymbol);
        },
        onResult: (genes: string[]) => {
            // show loading text only if there are actually new genes to load
            if (genes.length > 0) {
                const tId = toast('Loading alteration data...', {
                    autoClose: false,
                    draggable: false,
                    position: 'bottom-left',
                    className: styles.toast,
                });

                this.activeToasts.push(tId);
            }
        },
    });
    @observable
    private addGenomicData: (alterationData: ICBioData[]) => void;

    constructor(props: IPatientViewPathwayMapperProps) {
        super(props);
        this.activeToasts = [];
        this.accumulatedValidGenes = {};
        this.accumulatedAlterationFrequencyDataForNonQueryGenes = [];

        this.toastReaction = reaction(
            () => [props.store.activeTabId],
            ([tabId]) => {
                // Close all toasts when the Pathway Mapper tab is not visible.
                if (tabId !== PatientViewPageTabs.PATHWAY_MAPPER) {
                    this.activeToasts.length = 0;
                    toast.dismiss();
                }
            },
            { fireImmediately: true }
        );
        // @ts-ignore
        import(/* webpackChunkName: "pathway-mapper" */ 'pathway-mapper').then(
            (module: any) => {
                this.PathwayMapperComponent = (module as any)
                    .default as PathwayMapper;
            }
        );
    }

    @observable.ref PathwayMapperComponent:
        | PathwayMapper
        | undefined = undefined;

    @computed get alterationFrequencyData(): ICBioData[] {
        return this.alterationFrequencyDataForQueryGenes;
    }
    @computed get alterationFrequencyDataForQueryGenes() {
        const alterationFrequencyData: ICBioData[] = [];
        const covInfo: String[] = [];

        console.log('My INFO');

        const mutData = this.props.store.mutationData.result;
        const mutatedGenes = this.props.store.mutatedGenes.result;
        console.log(mutatedGenes);
        console.log(this.props.store);

        let data = getAlterationData(
            this.props.store.samples.result,
            [],
            this.props.store.coverageInformation.result,
            [],
            [],
            [],
            [],
            true,
            []
        );
        // const alterationData => {
        if (data) {
            alterationFrequencyData.push(data);
        }

        //get the alteration data
        console.log('in alteration data');
        //const alterationFrequencyData = this.props.store.variantCountCache as VariantCountCache;
        /*this.props.store.mutatedGenes.result?.forEach(
             x => { const cov =   this.props.store.mutationMolecularProfileId.result
               
            covInfo.push(x)});
           
            console.log(covInfo)
             */
        // console.log(this.props.store.mutationMolecularProfileId.result)
        /*  const data ={ gene: '', 
             altered: 0,
             sequenced: 0,
             percentAltered: ''};   */

        // alterationFrequencyData.push(data);

        return alterationFrequencyData;
        //return data;
    }

    public render() {
        //this.addGenomicData(this.alterationFrequencyData);
        this.dismissActiveToasts();
        console.log('IN RENDER');

        if (!this.PathwayMapperComponent) {
            console.log('PATHWAY COMPONENT CANNOT BE CREATED');
            return null;
        }
        console.log('Component created');
        return (
            <div className="pathwayMapper">
                <div className={'tabMessageContainer'}>
                    {/*  <OqlStatusBanner
                    className="plots-oql-status-banner"
                    store={this.props.store}
                    tabReflectsOql={true}
                />
                <AlterationFilterWarning store={this.props.store} />
            </div>
            data={
                                                    this.patientViewPageStore
                                                        .clinicalDataPatient
                                                        .result
                                                }
            <div
                data-test="pathwayMapperTabDiv"
                className="cBioMode"
                style={{ width: '99%' }}
              >*/}
                    <Row>
                        <React.Fragment>
                            {/*
                        <OqlStatusBanner
                            className="coexp-oql-status-banner"
                            store={this.props.store}
                            tabReflectsOql={true}
                        /> */}
                            {/*
                              // @ts-ignore */}
                            <this.PathwayMapperComponent
                                isCBioPortal={true}
                                isCollaborative={false}
                                genes={
                                    this.props.store.clinicalDataPatient
                                        .result as any
                                }
                                cBioAlterationData={[]}
                                onAddGenes={this.handleAddGenes}
                                changePathwayHandler={this.handlePathwayChange}
                                addGenomicDataHandler={
                                    this.addGenomicDataHandler
                                }
                                tableComponent={this.renderTable}
                                validGenes={this.validGenes}
                                toast={toast}
                            />
                            <ToastContainer
                                closeButton={<i className="fa fa-times" />}
                            />
                        </React.Fragment>
                    </Row>
                </div>
            </div>
        );
    }

    componentWillUnmount(): void {
        this.toastReaction();
    }

    /**
     * We need to initialize a separate ResultsViewStore to be able to fetch alteration data for non-query genes.
     */
    @computed get storeForAllData(): PatientViewPageStore | undefined {
        if (
            this.urlWrapperForAllGenes &&
            (!this.urlWrapperForAllGenes.hasSessionId ||
                !this.urlWrapperForAllGenes.remoteSessionData.isPending)
        ) {
            return undefined;
            //initStore(this.props.appStore, this.urlWrapperForAllGenes);
        } else {
            return undefined;
        }
    }

    /**
     * Here we clone the "query" field of the main store's URL Wrapper and enhance the cloned query
     * with additional non-query genes. This new query object is used to fake a new URL Wrapper instance
     * which is required to initialize a separate ResultsViewStore for the non-query genes.
     */
    @computed get urlWrapperForAllGenes(): PatientViewUrlWrapper | undefined {
        let urlWrapper: PatientViewUrlWrapper | undefined;

        if (
            this.validNonQueryGenes.isComplete &&
            this.validNonQueryGenes.result.length > 0
        ) {
            // fake the URL wrapper, we only need the query parameters with additional genes
            const query: { [key: string]: any } = _.cloneDeep(
                this.props.urlWrapper.query
            );
            query.gene_list = this.validNonQueryGenes.result.join(' ');

            // we don't need a proper URL Wrapper here, just assign an object with a valid query field
            urlWrapper = { query } as PatientViewUrlWrapper;
        }

        return urlWrapper;
    }

    /**
     * Valid non-query genes accumulated from currently selected pathway
     * and previously selected pathways in a single query session.
     */
    @computed get validGenes() {
        if (this.validNonQueryGenes.isComplete) {
            // Valid genes are accumulated.
            this.validNonQueryGenes.result.forEach(gene => {
                this.accumulatedValidGenes[gene] = true;
            });
        }
        return this.accumulatedValidGenes;
    }

    /**
     * addGenomicData function is implemented in PathwayMapper component and overlays
     * alteration data onto genes. Through this function callback, the function implemented
     * in PathwayMapper is copied here.
     */
    @autobind
    @action
    private addGenomicDataHandler(
        addGenomicData: (alterationData: ICBioData[]) => void
    ) {
        this.addGenomicData = addGenomicData;
    }

    @autobind
    @action
    private handlePathwayChange(pathwayGenes: string[]) {
        // Pathway genes here are the genes that are in the pathway and valid whose alteration data is not calculated yet.
        // Pathway genes does NOT always include all of the non-query genes
        // Some of the pathway genes may be invalid/unknown gene symbols
        this.newGenesFromPathway = pathwayGenes;
    }

    @autobind
    @action
    private handleAddGenes(selectedGenes: string[]) {
        //addGenesToQuery(this.props.urlWrapper, selectedGenes);
    }

    @autobind
    private dismissActiveToasts() {
        // Toasts are removed with delay
        setTimeout(() => {
            this.activeToasts.forEach(tId => {
                toast.dismiss(tId);
            });
        }, 2000);
    }

    @autobind
    private renderTable(
        data: IPathwayMapperTable[],
        selectedPathway: string,
        onPathwaySelect: (pathway: string) => void
    ) {
        return (
            <PathwayMapperTable
                data={data}
                selectedPathway={selectedPathway}
                changePathway={onPathwaySelect}
            />
        );
    }
}
