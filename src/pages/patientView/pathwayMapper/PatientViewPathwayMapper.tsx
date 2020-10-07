import * as React from 'react';
import _ from 'lodash';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { PatientViewPageTabs } from '../PatientViewPageTabs';
import 'pathway-mapper/dist/base.css';
import PathwayMapperTable, {
    IPathwayMapperTable,
    IPathwayMapperTableColumnType,
} from '../../../shared/lib/pathwayMapper/PathwayMapperTable';
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
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import PatientViewUrlWrapper from '../PatientViewUrlWrapper';

import 'cytoscape-panzoom/cytoscape.js-panzoom.css';
import 'cytoscape-navigator/cytoscape.js-navigator.css';
import 'react-toastify/dist/ReactToastify.css';
import styles from './pathwayMapper.module.scss';
import PathwayMapper, { ICBioData } from 'pathway-mapper';

const alterationFrequencyData: ICBioData[] = [];

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

    private readonly validNonQueryGenes = remoteData<string[]>({
        invoke: async () => {
            const genes = await fetchGenes(this.newGenesFromPathway);
            return genes.map(gene => gene.hugoGeneSymbol);
        },
        onResult: (genes: string[]) => {},
    });

    @observable
    private addGenomicData: (alterationData: ICBioData[]) => void;

    constructor(props: IPatientViewPathwayMapperProps) {
        super(props);
        this.accumulatedValidGenes = {};
        this.accumulatedAlterationFrequencyDataForNonQueryGenes = [];

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
        this.props.store.mergedMutationDataIncludingUncalledFilteredByGene.forEach(
            altData => {
                const mutationType = {
                    gene: altData[0].gene.hugoGeneSymbol,
                    altered: 1,
                    sequenced: 1,
                    percentAltered: altData[0].mutationType,
                };
                if (mutationType) {
                    alterationFrequencyData.push(mutationType);
                }
            }
        );

        this.props.store.mergedDiscreteCNADataFilteredByGene.forEach(
            altData => {
                const cna = {
                    gene: altData[0].gene.hugoGeneSymbol,
                    altered: 1,
                    sequenced: 1,
                    percentAltered: this.getCNAtypes(altData[0].alteration),
                };
                if (cna) {
                    alterationFrequencyData.push(cna);
                }
            }
        );

        return alterationFrequencyData;
    }
    private getCNAtypes(CNAtype: number) {
        if (CNAtype === 1) return 'GAIN';
        else if (CNAtype === 0) return 'DIPLOID';
        else if (CNAtype === -1) return 'SHALLOWDEL';
        else if (CNAtype === -2) return 'DeepDel';
        else return 'AMP';
    }

    private getQueryGenes(data: ICBioData[]) {
        const allTypes = data.map(x => x.gene);

        const allGenes = allTypes.filter((x, i, a) => a.indexOf(x) == i);
        //This parameter needs the hugoGeneSymbol in PathwayMapper
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
            this.storeForAllData.mergedDiscreteCNADataFilteredByGene &&
            this.storeForAllData
                .mergedMutationDataIncludingUncalledFilteredByGene
        );
    }
    public render() {
        //control the data
        if (this.isNewStoreReady) {
            this.addGenomicData(this.alterationFrequencyData);
            this.getQueryGenes(this.alterationFrequencyData);
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
                                changePathwayHandler={this.handlePathwayChange}
                                addGenomicDataHandler={
                                    this.addGenomicDataHandler
                                }
                                tableComponent={this.renderTable}
                                validGenes={this.validGenes}
                                patientView={true}
                                //message banner patch will be removed
                                messageBanner={this.renderBanner}
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

    @computed get storeForAllData(): PatientViewPageStore | undefined {
        let patientStore: PatientViewPageStore | undefined;
        if (this.urlWrapperForAllGenes) {
            return patientStore;
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
    //will be removed when Banner is added
    @autobind
    private renderBanner() {
        return null;
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
                columnsOverride={{
                    [IPathwayMapperTableColumnType.SCORE]: {
                        name: '# Genes matched',
                        tooltip: <span>Number of Genes Matched</span>,
                    },
                }}
            />
        );
    }
}
