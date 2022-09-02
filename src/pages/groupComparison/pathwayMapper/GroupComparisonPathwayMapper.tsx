import * as React from 'react';
import PathwayMapperTable, {
    IPathwayMapperTable,
    IPathwayMapperTableColumnType,
} from '../../../shared/lib/pathwayMapper/PathwayMapperTable';
import {
    getCnaTypes,
    getGeneticTrackDataSortedBySampleIndex,
    getUniqueGenes,
} from 'shared/lib/pathwayMapper/PathwayMapperHelpers';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { observable, computed, makeObservable } from 'mobx';
import { Row } from 'react-bootstrap';

import { getGeneticTrackRuleSetParams } from 'shared/components/oncoprint/OncoprintUtils';
import PathwayMapper, { ICBioData } from 'pathway-mapper';

import 'pathway-mapper/dist/base.css';
import 'cytoscape-panzoom/cytoscape.js-panzoom.css';
import 'cytoscape-navigator/cytoscape.js-navigator.css';
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import { ComparisonGroup } from '../GroupComparisonUtils';
import { GenesSelection } from 'pages/resultsView/enrichments/GeneBarPlot';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { toUpper } from 'lodash';
import GroupComparisonStore from '../GroupComparisonStore';

interface IGroupComparisonPathwayMapperProps {
    genesOfInterest: AlterationEnrichmentRow[];
    activeGroups: ComparisonGroup[] | undefined;
    genomicData: AlterationEnrichmentRow[];
    store: GroupComparisonStore;
}

/*function getMaxFrequencedGenes(
    alterationRowData: AlterationEnrichmentRow[],
    activeGroups: ComparisonGroup[] | undefined
) {
    var MaxFrequencedGenes: AlterationEnrichmentRow[] = [];
    var usedGenes: number[] = [];
    for (let j: number = 0; j < 10; j++) {
        let idOfGene: number = -1;
        let frequencyOfGene: number = 0;
        for (let i: number = 0; i < alterationRowData.length; i++) {
            let k: number = 0;
            for (k = 0; k < j; k++) if (i === usedGenes[k]) break;
            if (k < j) continue;
            let maxFrequencyinGroups: number = 0;
            let groupCount: number | undefined = activeGroups?.length;
            if (groupCount !== undefined)
                for (let k: number = 0; k < groupCount; k++)
                    if (
                        alterationRowData[i].groupsSet[k].alteredPercentage >
                        maxFrequencyinGroups
                    ) {
                        maxFrequencyinGroups =
                            alterationRowData[i].groupsSet[k].alteredPercentage;
                    }
            if (maxFrequencyinGroups > frequencyOfGene) {
                frequencyOfGene = maxFrequencyinGroups;
                idOfGene = i;
            }
        }
        MaxFrequencedGenes.push(alterationRowData[idOfGene]);
        usedGenes.push(idOfGene);
    }
}*/

const DEFAULT_RULESET_PARAMS = getGeneticTrackRuleSetParams(true, true, true);

@observer
export default class GroupComparisonPathwayMapper extends React.Component<
    IGroupComparisonPathwayMapperProps
> {
    clearMessage: (() => void) | undefined;
    constructor(props: IGroupComparisonPathwayMapperProps) {
        super(props);
        makeObservable(this);

        // @ts-ignore
        import(/* webpackChunkName: "pathway-mapper" */ 'pathway-mapper').then(
            (module: any) => {
                this.PathwayMapperComponent = (module as any)
                    .default as PathwayMapper;
            }
        );
        if (this.props.store.isHighestFrequencedGenesCalculated === false) {
            this.updateGenesOfInterestValue();
            this.props.store.isHighestFrequencedGenesCalculated = true;
        }
    }
    @observable.ref PathwayMapperComponent:
        | PathwayMapper
        | undefined = undefined;

    @observable
    isGeneSelectionPopupVisible: boolean = false;

    @observable.ref
    genes: AlterationEnrichmentRow[] = this.props.genesOfInterest;
    @observable.ref
    newlyAddedGenes: AlterationEnrichmentRow[] = this.props.genesOfInterest;
    updateGenesOfInterestValue() {
        let value: string = '';
        let i: number = 0;
        for (i = 0; i < this.props.store.maxFrequencedGenes.length; i++) {
            value =
                value +
                this.props.store.maxFrequencedGenes[i].hugoGeneSymbol +
                ' ';
        }
        this.props.store.alterationAndPathwaysFlag = value;
    }
    public render() {
        if (!this.PathwayMapperComponent) {
            return null;
        }
        //getMaxFrequencedGenes(this.props.alterationRowData, this.props.activeGroups);
        /*getMaxFrequencedGenes();*/
        /* var MaxFrequencedGenes : AlterationEnrichmentRow[] = [];
        var usedGenes : number[] = [];
        for( let j : number = 0; j < 10; j++){
             let idOfGene:number = -1;
             let frequencyOfGene:number = 0;
        for( let i :number = 0; i < this.props.alterationRowData.length; i++ ){
             let k :number = 0;
             for( k  = 0; k < j; k++)
                  if( i === usedGenes[k])
                      break;
             if( k  < j)
                 continue;   
             let maxFrequencyinGroups :number = 0;
             let groupCount :number | undefined= this.props.activeGroups?.length;
             if( groupCount !== undefined)
             for( let k :number = 0; k < groupCount; k++)
                  if( this.props.alterationRowData[i].groupsSet[k].alteredPercentage > maxFrequencyinGroups){
                      maxFrequencyinGroups = this.props.alterationRowData[i].groupsSet[k].alteredPercentage ;
                  }
             if( maxFrequencyinGroups > frequencyOfGene ){
                 frequencyOfGene = maxFrequencyinGroups;
                 idOfGene = i;
             }
        }
        MaxFrequencedGenes.push(this.props.alterationRowData[idOfGene]);
        usedGenes.push(idOfGene);
        }
        */
        console.log('Pathway Mapper Rendered');
        console.log(this.genes);

        return (
            <div>
                <div className="alert alert-info">
                    Ranking is based on top 10 genes having highest frequency by
                    default. Genes of interest can be changed.
                    <DefaultTooltip
                        trigger={['click']}
                        destroyTooltipOnHide={true}
                        visible={this.isGeneSelectionPopupVisible}
                        onVisibleChange={visible => {
                            console.log(this.isGeneSelectionPopupVisible);
                            this.isGeneSelectionPopupVisible = !this
                                .isGeneSelectionPopupVisible;
                        }}
                        overlay={
                            <GenesSelection
                                options={[]}
                                /*selectedOption={this.selectedOption}*/
                                onSelectedGenesChange={(
                                    value,
                                    genes,
                                    label
                                ) => {
                                    console.log(genes);
                                    console.log(this.genes);
                                    //setTimeout(this.render,100);
                                    console.log('genes' + ' ' + genes);
                                    //this.changeGenesOfInterest( value );
                                    console.log('value ' + value);
                                    console.log('label ' + label);
                                    this.newlyAddedGenes = [];
                                    this.props.store.alterationAndPathwaysFlag = value;
                                    console.log(
                                        this.props.store
                                            .genesOfInterestForPathwayMapper
                                    );
                                    this.isGeneSelectionPopupVisible = false;

                                    console.log(this.genes);
                                    //  this.genes = this.newlyAddedGenes;
                                }}
                                defaultNumberOfGenes={10}
                                comparisonStore={this.props.store}
                            />
                        }
                        placement="bottomLeft"
                    >
                        <button
                            data-test="selectGenes"
                            className="btn btn-default btn-xs"
                            style={{ marginLeft: 5 }}
                        >
                            Select genes
                        </button>
                    </DefaultTooltip>
                </div>
                <div className="pathwayMapper">
                    <div
                        data-test="pathwayMapperTabDiv"
                        className="cBioMode"
                        style={{ width: '99%' }}
                    >
                        <Row>
                            {/*
                              // @ts-ignore */}
                            <this.PathwayMapperComponent
                                isCBioPortal={true}
                                isCollaborative={false}
                                genes={
                                    this.props.store
                                        .genesOfInterestForPathwayMapper as any
                                }
                                // newGenes = { this.newlyAddedGenes as any}
                                cBioAlterationData={[]}
                                genomicData={this.props.genomicData as any}
                                tableComponent={this.renderTable}
                                patientView={false}
                                groupComparisonView={true}
                                activeGroups={this.props.activeGroups as any}
                                //  genesSelectionComponent = {this.renderGenesSelection}
                            />
                        </Row>
                    </div>
                </div>
            </div>
        );
    }

    changeGenesOfInterest(genes: string) {
        let i: number = 0;
        let newGeneOfInterest: AlterationEnrichmentRow[] = [];
        let newGene: string = '';
        let newGenes: string[] = [];
        for (i = 0; i < genes.length; i++) {
            if (
                genes[i].charCodeAt(0) !== 10 &&
                genes[i].charCodeAt(0) !== 32
            ) {
                newGene = newGene + genes[i].toUpperCase();
                console.log(newGene);
            } else {
                console.log(newGene);
                if (newGene !== '') newGenes.push(newGene);
                newGene = '';
            }
        }
        if (newGene !== '') newGenes.push(newGene);
        console.log(newGenes);
        newGeneOfInterest = this.props.genomicData.filter(gene => {
            return this.doesInclude(gene.hugoGeneSymbol, newGenes);
        });
        console.log(newGeneOfInterest);
        //this.genes = newGeneOfInterest;
    }

    doesInclude(gene: string, newGenes: string[]) {
        let i: number = 0;
        for (i = 0; i < newGenes.length; i++) {
            if (newGenes[i] === gene) return true;
        }
        return false;
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
            /*<DefaultTooltip
                            trigger={['click']}
                            destroyTooltipOnHide={true}
                            visible={this.isGeneSelectionPopupVisible}
                            onVisibleChange={visible => {
                                console.log(this.isGeneSelectionPopupVisible);
                                this.isGeneSelectionPopupVisible = !this.isGeneSelectionPopupVisible;
                            }}
                           
                            overlay={
                                <GenesSelection
                                options={[]}
                                selectedOption={this.selectedOption}
                                                    onSelectedGenesChange={(
                                                        value,
                                                        genes,
                                                        label
                                                    ) => {
                                                        this._geneQuery = value;
                                                        this.selectedGenes = genes;
                                                        this._label = label;
                                                        this.isGeneSelectionPopupVisible = false;
                                                    }}
                                                    defaultNumberOfGenes={10}
                                                />
                            }
                            placement="bottomLeft"
                        >
                            <div>
                                <button
                                    data-test="selectGenes"
                                    className="btn btn-default btn-xs"
                                >
                                    Select genes
                                </button>
                            </div>
                        </DefaultTooltip>*/
            /*<GenesSelection
            options={[]}
            selectedOption={this.selectedOption}
                                onSelectedGenesChange={(
                                    value,
                                    genes,
                                    label
                                ) => {
                                    this._geneQuery = value;
                                    this.selectedGenes = genes;
                                    this._label = label;
                                    this.isGeneSelectionPopupVisible = false;
                                }}
                                defaultNumberOfGenes={10}
                            />*/
        );
    }

    @autobind
    private renderGenesSelection() {
        return (
            <DefaultTooltip
                trigger={['click']}
                destroyTooltipOnHide={true}
                visible={this.isGeneSelectionPopupVisible}
                onVisibleChange={visible => {
                    console.log(this.isGeneSelectionPopupVisible);
                    this.isGeneSelectionPopupVisible = !this
                        .isGeneSelectionPopupVisible;
                }}
                overlay={
                    <GenesSelection
                        options={[]}
                        /*selectedOption={this.selectedOption}*/
                        onSelectedGenesChange={(value, genes, label) => {
                            console.log(genes);
                            console.log(this.genes);
                            //setTimeout(this.render,100);
                            console.log('genes' + ' ' + genes);
                            //this.changeGenesOfInterest( value );
                            console.log('value ' + value);
                            console.log('label ' + label);
                            this.newlyAddedGenes = [];
                            this.props.store.alterationAndPathwaysFlag = value;
                            console.log(
                                this.props.store.genesOfInterestForPathwayMapper
                            );
                            console.log(this.genes);
                            //  this.genes = this.newlyAddedGenes;
                        }}
                        defaultNumberOfGenes={10}
                        comparisonStore={this.props.store}
                    />
                }
            >
                <div>
                    <button
                        data-test="selectGenes"
                        className="btn btn-default btn-xs"
                    >
                        Select genes
                    </button>
                </div>
            </DefaultTooltip>
        );
    }
}
