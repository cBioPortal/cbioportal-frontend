import * as React from 'react';
import PathwayMapper, { ICBioData } from 'pathway-mapper';

import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { addGenesToQuery } from '../ResultsViewPageHelpers';
import PathwayMapperTable, {
    IPathwayMapperTable,
} from 'shared/lib/pathwayMapper/PathwayMapperTable';
import PathwayMapperMessageBox from 'shared/lib/pathwayMapper/PathwayMapperMessageBox';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import {
    observable,
    computed,
    action,
    makeObservable,
} from 'mobx';
import { Row } from 'react-bootstrap';

import { AppStore } from 'AppStore';
import OqlStatusBanner from 'shared/components/banners/OqlStatusBanner';
import ResultsViewURLWrapper from '../ResultsViewURLWrapper';
import {ResultsViewPathwayMapperStore} from "./ResultsViewPathwayMapperStore";


import 'pathway-mapper/dist/base.css';
import 'cytoscape-panzoom/cytoscape.js-panzoom.css';
import 'cytoscape-navigator/cytoscape.js-navigator.css';

interface IResultsViewPathwayMapperProps {
    store: ResultsViewPageStore;
    appStore: AppStore;
    urlWrapper: ResultsViewURLWrapper;
}

const LOADING_MESSAGE = 'Loading alteration data...';

@observer
export default class ResultsViewPathwayMapper extends React.Component<
    IResultsViewPathwayMapperProps
> {
    private store: ResultsViewPathwayMapperStore;

    @observable
    private warningMessage: string | null;

    @observable
    private addGenomicData: (alterationData: ICBioData[]) => void;

    constructor(props: IResultsViewPathwayMapperProps) {
        super(props);
        makeObservable(this);
        this.store = new ResultsViewPathwayMapperStore(this.props.store);

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

    @computed get message(): string {
        if (this.store.alterationCountsByNonQueryGenes.isComplete && this.warningMessage === LOADING_MESSAGE) {
            return '';
        }

        if (
            this.store.alterationCountsByNonQueryGenes.isPending &&
            this.store.validNonQueryGenes.isComplete &&
            this.store.validNonQueryGenes.result.length > 0
        ) {
            return LOADING_MESSAGE;
        }

        if (!this.warningMessage) {
            return '';
        }

        return this.warningMessage;
    }

    public render() {
        // Alteration data of non-query genes are loaded.
        if (this.store.alterationCountsByQueryGenes.isComplete && this.store.alterationCountsByNonQueryGenes.isComplete) {
            this.addGenomicData(this.store.alterationFrequencyData);
        }
        if (!this.PathwayMapperComponent) {
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
                        <>
                            <OqlStatusBanner
                                className="coexp-oql-status-banner"
                                store={this.props.store}
                                tabReflectsOql={true}
                            />
                            {/*
                              // @ts-ignore */}
                            <this.PathwayMapperComponent
                                isCBioPortal={true}
                                isCollaborative={false}
                                genes={this.props.store.genes.result as any}
                                cBioAlterationData={
                                    this.store.alterationFrequencyData
                                }
                                onAddGenes={this.handleAddGenes}
                                changePathwayHandler={this.handlePathwayChange}
                                addGenomicDataHandler={
                                    this.addGenomicDataHandler
                                }
                                messageBanner={this.renderBanner}
                                tableComponent={this.renderTable}
                                validGenes={this.store.validGenes}
                                showMessage={this.updateMessage}
                            />
                        </>
                    </Row>
                </div>
            </div>
        );
    }

    /**
     * addGenomicData function is implemented in PathwayMapper component and overlays
     * alteration data onto genes. Through this function callback, the function implemented
     * in PathwayMapper is copied here.
     */
    @action.bound
    private addGenomicDataHandler(
        addGenomicData: (alterationData: ICBioData[]) => void
    ) {
        this.addGenomicData = addGenomicData;
    }

    @action.bound
    private handlePathwayChange(pathwayGenes: string[]) {
        // Pathway genes here are the genes that are in the pathway and valid whose alteration data is not calculated yet.
        // Pathway genes does NOT always include all of the non-query genes
        // Some of the pathway genes may be invalid/unknown gene symbols
        this.store.newGenesFromPathway = pathwayGenes;
    }

    @action.bound
    private handleAddGenes(selectedGenes: string[]) {
        addGenesToQuery(this.props.urlWrapper, selectedGenes);
    }

    @action.bound
    private updateMessage(message: string) {
        this.warningMessage = message;
    }

    @action.bound
    private clearMessage() {
        this.warningMessage = null;
    }

    @autobind
    private renderBanner() {
        return (
            <PathwayMapperMessageBox
                message={this.message}
                loadingMessage={LOADING_MESSAGE}
                onClearMessage={this.clearMessage}
            />
        );
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
                onSelectedPathwayChange={this.clearMessage}
            />
        );
    }
}
