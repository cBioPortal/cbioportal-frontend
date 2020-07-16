import * as React from 'react';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import SampleManager from '../SampleManager';
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

interface IPatientViewPathwayMapperProps {
    store: PatientViewPageStore;
    sampleManager?: SampleManager | null;
}

const DEFAULT_RULESET_PARAMS = getGeneticTrackRuleSetParams(true, true, true);

@observer
export default class PatientViewPathwayMapper extends React.Component<
    IPatientViewPathwayMapperProps
> {
    constructor(props: IPatientViewPathwayMapperProps) {
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

    @computed get queryGenes() {
        return getUniqueGenes(this.alterationFrequencyData);
    }

    @computed get alterationFrequencyData(): ICBioData[] {
        return this.alterationFrequencyDataForQueryGenes;
    }

    @computed get alterationFrequencyDataForQueryGenes() {
        const alterationFrequencyData: ICBioData[] = [];

        this.props.store.mergedMutationDataIncludingUncalledFilteredByGene.forEach(
            altData => {
                const mutationType = {
                    gene: altData[0].gene.hugoGeneSymbol,
                    altered: 1,
                    sequenced: 1,
                    percentAltered: altData[0].mutationType,
                    geneticTrackRuleSetParams: DEFAULT_RULESET_PARAMS,
                    geneticTrackData: getGeneticTrackDataSortedBySampleIndex(
                        this.props.store.geneticTrackData.result,
                        altData[0].gene.hugoGeneSymbol,
                        this.props.sampleManager?.sampleIndex
                    ),
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
                    percentAltered: getCnaTypes(altData[0].alteration),
                    geneticTrackRuleSetParams: DEFAULT_RULESET_PARAMS,
                    geneticTrackData: getGeneticTrackDataSortedBySampleIndex(
                        this.props.store.geneticTrackData.result,
                        altData[0].gene.hugoGeneSymbol,
                        this.props.sampleManager?.sampleIndex
                    ),
                };
                if (cna) {
                    alterationFrequencyData.push(cna);
                }
            }
        );

        return alterationFrequencyData;
    }

    @computed get sampleIconData() {
        return this.props.sampleManager
            ? {
                  sampleIndex: this.props.sampleManager.sampleIndex,
                  sampleColors: this.props.sampleManager.sampleColors,
              }
            : {
                  sampleIndex: {},
                  sampleColors: {},
              };
    }

    public render() {
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
                        {/*
                              // @ts-ignore */}
                        <this.PathwayMapperComponent
                            isCBioPortal={true}
                            isCollaborative={false}
                            genes={this.queryGenes}
                            cBioAlterationData={this.alterationFrequencyData}
                            sampleIconData={this.sampleIconData}
                            tableComponent={this.renderTable}
                            patientView={true}
                            // TODO PathwayMapper crashes if message banner is not provided, need to be fixed on PM side
                            messageBanner={() => null}
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
                columnsOverride={{
                    [IPathwayMapperTableColumnType.SCORE]: {
                        name: 'Pathway altered',
                        tooltip: (
                            <span>
                                Whether Genes in the Pathway Were Altered
                            </span>
                        ),
                        render: (d: IPathwayMapperTable) => (
                            <span>
                                <b>{d.score > 0 ? 'Yes' : 'No'}</b>
                            </span>
                        ),
                    },
                }}
            />
        );
    }
}
