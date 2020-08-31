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

import { AppStore } from 'AppStore';
import { remoteData } from 'cbioportal-frontend-commons';
import { fetchGenes, mergeDiscreteCNAData } from 'shared/lib/StoreUtils';
import OqlStatusBanner from 'shared/components/banners/OqlStatusBanner';
import {
    getAlterationData,
    percentAltered,
} from 'shared/components/oncoprint/OncoprintUtils';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import PatientViewUrlWrapper from '../PatientViewUrlWrapper';

import 'cytoscape-panzoom/cytoscape.js-panzoom.css';
import 'cytoscape-navigator/cytoscape.js-navigator.css';
import 'react-toastify/dist/ReactToastify.css';
import styles from './pathwayMapper.module.scss';
import PathwayMapper, { ICBioData } from 'pathway-mapper';
import {
    MUT_COLOR_FUSION,
    MUT_COLOR_INFRAME,
    MUT_COLOR_MISSENSE,
    MUT_COLOR_OTHER,
    MUT_COLOR_TRUNC,
    CNA_COLOR_AMP,
    CNA_COLOR_GAIN,
    CNA_COLOR_HETLOSS,
    CNA_COLOR_HOMDEL,
} from 'shared/lib/Colors';
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

            console.log('valid Non Query Genes', genes);

            return genes.map(gene => gene.hugoGeneSymbol);
        },
        onResult: (genes: string[]) => {
            // show loading text only if there are actually new genes to load
            if (genes.length < 0) {
                console.log('valo', genes);
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
            () => [props.urlWrapper.activeTabId],
            ([tabId]) => {
                // Close all toasts when the Pathway Mapper tab is not visible.
                if (tabId !== PatientViewPageTabs.PATHWAY_MAPPER) {
                    this.activeToasts.length = 0;
                    toast.dismiss();
                }
            },
            {
                fireImmediately: true,
            }
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

    //here for nonquery genes
    @computed get alterationFrequencyData(): ICBioData[] {
        return this.alterationFrequencyDataForQueryGenes;
    }
    @computed get alterationFrequencyDataForQueryGenes() {
        const alterationFrequencyData: ICBioData[] = [];

        console.log('Inside alteration data for query genes');

        const mutationData = this.props.store.mergedMutationDataIncludingUncalledFilteredByGene
            // .filter(data => data[0].mutationType !== "Fusion")
            .map(data => ({
                gene: data[0].gene.hugoGeneSymbol,
                altered: 1,
                percentAltered: data[0].mutationType,
                sequenced: 1,
            }));

        this.props.store.mergedMutationDataIncludingUncalledFilteredByGene.forEach(
            altData => {
                const maybeT = {
                    gene: altData[0].gene.hugoGeneSymbol,
                    altered: 1,
                    sequenced: 1,
                    percentAltered: altData[0].mutationType,
                };
                if (maybeT) {
                    alterationFrequencyData.push(maybeT);
                }
            }
        );

        this.props.store.mergedDiscreteCNADataFilteredByGene.forEach(
            altData => {
                const maybeT = {
                    gene: altData[0].gene.hugoGeneSymbol,
                    altered: 1,
                    sequenced: 1,
                    percentAltered: this.getCNAtypes(altData[0].alteration),
                };
                if (maybeT) {
                    alterationFrequencyData.push(maybeT);
                }
            }
        );
        console.log('in alteration data');
        console.log(alterationFrequencyData);

        return alterationFrequencyData;
    }
    private getCNAtypes(CNAtype: number) {
        if (CNAtype == 1) return 'GAIN';
        else if (CNAtype == 0) return 'DIPLOID';
        else if (CNAtype == -1) return 'SHALLOWDEL';
        else if (CNAtype == 2) return 'DeepDel';
        else return 'AMP';
    }

    private getQueryGenes(data: ICBioData[]) {
        const allTypes = data.map(x => x.gene);

        const allGenes = allTypes.filter((x, i, a) => a.indexOf(x) == i);
        //This parameter needs the hugoGeneSymbol in PathwayMapper
        console.log('all genes');

        const keyed_genes = allGenes.map(gene => {
            return { hugoGeneSymbol: gene };
        });
        return keyed_genes;
    }
    @computed get isNewStoreReady() {
        return (
            this.storeForAllData &&
            this.storeForAllData.samples.isComplete &&
            this.storeForAllData.mergedMutationData &&
            this.storeForAllData.coverageInformation.isComplete &&
            this.storeForAllData.mergedDiscreteCNADataFilteredByGene
        );
    }
    public render() {
        //control the data
        if (this.isNewStoreReady) {
            this.addGenomicData(this.alterationFrequencyData);
            console.log(
                'this.alterationFrequencyData',
                this.alterationFrequencyData
            );

            this.addPatientViewData(this.alterationFrequencyData);
            this.getQueryGenes(this.alterationFrequencyData);
            this.dismissActiveToasts();
        }
        if (!this.PathwayMapperComponent) {
            console.log('PATHWAY COMPONENT CANNOT BE CREATED');
            return null;
        }
        return (
            <div className="pathwayMapper">
                <div
                    data-test="pathwayMapperTabDiv"
                    className="cBioMode"
                    style={{ width: '99%' }}
                >
                    <Row>
                        <React.Fragment>
                            {/*
                                  // @ts-ignore */}
                            <this.PathwayMapperComponent
                                isCBioPortal={true}
                                isCollaborative={false}
                                genes={this.getQueryGenes(
                                    this.alterationFrequencyData
                                )}
                                cBioAlterationData={
                                    this.alterationFrequencyData
                                }
                                onAddGenes={this.handleAddGenes}
                                changePathwayHandler={this.handlePathwayChange}
                                addGenomicDataHandler={
                                    this.addGenomicDataHandler
                                }
                                tableComponent={this.renderTable}
                                // validGenes={this.validGenes}
                                toast={toast}
                                view={'patient'}
                                //alterationColor = {this.getOncoprintColors()}
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

    @computed get storeForAllData(): PatientViewPageStore | undefined {
        console.log('store for all data');
        if (
            this.urlWrapperForAllGenes &&
            (!this.urlWrapperForAllGenes.hasSessionId ||
                !this.urlWrapperForAllGenes.remoteSessionData.isPending)
        ) {
            return undefined;
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
        console.log('urlwrapper for all genes');
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
     * addGenomicData function is implemented in PathwayMapper component and overlays
     * alteration data onto genes. Through this function callback, the function implemented
     * in PathwayMapper is copied here.
     */
    @autobind
    @action
    private addGenomicDataHandler(
        addGenomicData: (alterationData: ICBioData[]) => void
    ) {
        console.log('addGenomicDataHandler');
        this.addGenomicData = addGenomicData;
    }

    @autobind
    @action
    private handlePathwayChange(pathwayGenes: string[]) {
        // Pathway genes here are the genes that are in the pathway and valid whose alteration data is not calculated yet.
        // Pathway genes does NOT always include all of the non-query genes
        // Some of the pathway genes may be invalid/unknown gene symbols
        console.log('handlePathwayChange');
        console.log('pathwayGenes', pathwayGenes);
        this.newGenesFromPathway = pathwayGenes;
    }

    @autobind
    @action
    private handleAddGenes(selectedGenes: string[]) {
        console.log('handleAddGenes');
        //addGenesToQuery(this.props.urlWrapper, selectedGenes);
    }
    @autobind
    @action
    private addPatientViewData(cBioAlterationData: ICBioData[]) {
        console.log('addpatientViewData');

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
