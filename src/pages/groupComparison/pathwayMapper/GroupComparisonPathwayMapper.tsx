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

interface IGroupComparisonPathwayMapperProps {
    alterationRowData: AlterationEnrichmentRow[];
    activeGroups: ComparisonGroup[] | undefined;
}

function getMaxFrequencedGenes(
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
}

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
    }
    @observable.ref PathwayMapperComponent:
        | PathwayMapper
        | undefined = undefined;

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
        return (
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
                            genes={this.props.alterationRowData as any}
                            cBioAlterationData={[]}
                            tableComponent={this.renderTable}
                            patientView={false}
                            groupComparisonView={true}
                            activeGroups={this.props.activeGroups as any}
                        />
                    </Row>
                </div>
            </div>
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
