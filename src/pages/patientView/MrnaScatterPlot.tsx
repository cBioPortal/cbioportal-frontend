import * as React from 'react';
import { observer } from 'mobx-react';
import {
    VictoryBoxPlot,
    VictoryScatter,
    VictoryChart,
    VictoryAxis,
} from 'victory';
import {
    CBIOPORTAL_VICTORY_THEME,
    MobxPromise,
} from 'cbioportal-frontend-commons';
import { NumericGeneMolecularData, Gene } from 'cbioportal-ts-api-client';

interface MrnaScatterPlotProps {
    mrnaData: MobxPromise<NumericGeneMolecularData[]>;
    currentSampleId?: string;
    currentPatientId?: string;
    currentGene?: Gene;
}

@observer
export default class MrnaScatterPlot extends React.Component<
    MrnaScatterPlotProps
> {
    render() {
        const { mrnaData, currentSampleId, currentPatientId } = this.props;

        if (mrnaData.isPending) {
            return <div>Loading mRNA data...</div>;
        }

        if (mrnaData.isError) {
            return (
                <div>Error loading mRNA data: {mrnaData.error?.message}</div>
            );
        }

        if (!mrnaData.result || mrnaData.result.length === 0) {
            return <div>No mRNA data available</div>;
        }

        // Prepare data for box plot - single box showing distribution of all expression values
        const expressionValues = mrnaData.result.map(data => data.value);
        const boxPlotData = [
            {
                x: 1,
                y: expressionValues,
            },
        ];

        // Function to determine if a data point should be highlighted
        const isHighlighted = (data: NumericGeneMolecularData) => {
            if (currentSampleId) {
                // If currentSampleId is defined, highlight only that specific sample
                return data.sampleId === currentSampleId;
            } else if (currentPatientId) {
                // If only currentPatientId is defined, highlight all samples belonging to that patient
                return data.patientId === currentPatientId;
            }
            return false;
        };

        // Prepare scatter plot data with jitter for better visibility
        const scatterData = mrnaData.result.map((data, index) => ({
            x: 1 + (Math.random() - 0.5) * 0.3, // Add jitter around x=1
            y: data.value,
            sample: data.sampleId,
            patient: data.patientId,
            gene: data.entrezGeneId,
            highlighted: isHighlighted(data),
        }));

        // Separate highlighted and non-highlighted points for layering
        const nonHighlightedData = scatterData.filter(d => !d.highlighted);
        const highlightedData = scatterData.filter(d => d.highlighted);

        return (
            <div style={{ padding: '20px', width: 800 }}>
                <h3>
                    {this.props.currentGene?.hugoGeneSymbol} mRNA Expression
                    Data Distribution
                </h3>

                <VictoryChart
                    theme={CBIOPORTAL_VICTORY_THEME}
                    width={500}
                    height={300}
                    padding={{ left: 60, top: 20, right: 40, bottom: 50 }}
                    domain={{ x: [0.5, 1.5] }}
                >
                    <VictoryAxis
                        dependentAxis
                        label="Expression Value"
                        style={{
                            axisLabel: { fontSize: '12px', padding: 30 },
                            tickLabels: { fontSize: 9 },
                        }}
                    />
                    {/*<VictoryAxis */}
                    {/*    label="Expression Data"*/}
                    {/*    style={{ */}
                    {/*        axisLabel: { fontSize: '12px', padding: 25 },*/}
                    {/*        tickLabels: { fontSize: 9 },*/}
                    {/*        ticks: { stroke: "transparent", size: 0 }*/}
                    {/*    }}*/}
                    {/*    tickFormat={() => ""}*/}
                    {/*/>*/}
                    <VictoryBoxPlot
                        data={boxPlotData}
                        boxWidth={20}
                        style={{
                            min: { stroke: '#2c5db0', strokeWidth: 2 },
                            max: { stroke: '#2c5db0', strokeWidth: 2 },
                            q1: {
                                fill: '#4a90e2',
                                fillOpacity: 0.7,
                                stroke: '#2c5db0',
                                strokeWidth: 2,
                            },
                            q3: {
                                fill: '#4a90e2',
                                fillOpacity: 0.7,
                                stroke: '#2c5db0',
                                strokeWidth: 2,
                            },
                            median: { stroke: '#2c5db0', strokeWidth: 3 },
                        }}
                    />
                    {/* Render non-highlighted points first (background layer) */}
                    <VictoryScatter
                        data={nonHighlightedData}
                        size={2}
                        style={{
                            data: {
                                fill: '#4a90e2',
                                fillOpacity: 0.7,
                                stroke: '#2c5db0',
                                strokeWidth: 1,
                            },
                        }}
                    />
                    {/* Render highlighted points on top (foreground layer) */}
                    <VictoryScatter
                        data={highlightedData}
                        size={5}
                        style={{
                            data: {
                                fill: '#ff6b35',
                                fillOpacity: 1,
                                stroke: '#e55100',
                                strokeWidth: 2,
                            },
                        }}
                    />
                </VictoryChart>
                <div
                    style={{
                        marginTop: '20px',
                        fontSize: '12px',
                        color: '#666',
                    }}
                >
                    Total data points: {expressionValues.length}
                </div>
            </div>
        );
    }
}
