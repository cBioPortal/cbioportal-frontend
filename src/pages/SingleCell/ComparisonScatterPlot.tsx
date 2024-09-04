import React from 'react';
import {
    VictoryChart,
    VictoryScatter,
    VictoryLegend,
    VictoryAxis,
    VictoryTooltip,
} from 'victory';

interface GeneData {
    value: number | string;
    tissuename: string;
    parentId: string;
    color: string;
    bwColor: string;
    bwStrokeColor: string;
    strokeColor: string;
    tissueColor: string;
    tissueStrokeColor: string;
    x: number; // This will be used as the x-axis value for Gene X
}

interface ComparisonScatterPlotProps {
    gene1Data: GeneData[];
    gene2Data: GeneData[];
    selectedGene1: string;
    selectedGene2: string;
    geneCellSelect: string;
}

const ComparisonScatterPlot: React.FC<ComparisonScatterPlotProps> = ({
    gene1Data,
    gene2Data,
    selectedGene1,
    selectedGene2,
    geneCellSelect,
}) => {
    // Filter out NaN values from gene1Data and gene2Data
    const filteredGene1Data = gene1Data.filter(
        d => typeof d.value === 'number' && !isNaN(d.value)
    );
    const filteredGene2Data = gene2Data.filter(
        d => typeof d.value === 'number' && !isNaN(d.value)
    );

    // Combine data by matching parentId
    const combinedData = filteredGene1Data
        .map(d1 => {
            const matchingGene2 = filteredGene2Data.find(
                d2 => d2.parentId === d1.parentId
            );
            return matchingGene2
                ? {
                      x: d1.value, // Gene X value for x-axis
                      y: matchingGene2.value, // Gene Y value for y-axis
                      tissuename: d1.tissuename,
                      parentId: d1.parentId,
                      color: d1.color,
                      label: `${d1.parentId}\nTissue: ${
                          d1.tissuename
                      }\nGene 1 (${selectedGene1}): ${Number(d1.value).toFixed(
                          2
                      )}\nGene 2 (${selectedGene2}): ${Number(
                          matchingGene2.value
                      ).toFixed(2)}`,
                  }
                : null;
        })
        .filter(d => d !== null);

    // Calculate dynamic domain values for x and y axes
    const xValues = combinedData.map(d => d?.x) as number[];
    const yValues = combinedData.map(d => d?.y) as number[];

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    // Extend the domain a bit for better visualization

    // const xDomain = [xMin + (0.1*xMin), xMax + (0.1*xMax)];
    // const yDomain = [yMin - (0.1*yMin), yMax + (0.1*yMax)];

    const CustomTooltip = (props: any) => (
        <VictoryTooltip
            {...props}
            flyoutStyle={{
                fill: 'white',
                stroke: '#ccc',
                strokeWidth: 1,
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
            }}
            pointerLength={10}
            pointerWidth={10}
            pointerOrientation="right"
            cornerRadius={5}
            flyoutPadding={{ left: 410, right: 100, top: 50, bottom: 125 }}
            flyoutWidth={900}
            flyoutHeight={900}
            style={{
                fill: '#333',
                fontSize: 14,
            }}
            renderInPortal={false}
        />
    );

    return (
        <VictoryChart
            height={800}
            id="chart-svg"
            width={1500}
            padding={{ top: 100, bottom: 100, left: 110, right: 110 }}
        >
            <VictoryLegend
                x={90}
                y={20}
                orientation="horizontal"
                gutter={20}
                style={{
                    border: { stroke: 'black', strokeWidth: 1 },
                    title: { fontSize: 7 },
                }}
                borderPadding={{ top: 10, bottom: 10, left: 10, right: 10 }}
                data={[
                    {
                        name: 'Gene Expression Data Points',
                        symbol: { fill: '#00FF00' },
                    },
                ]}
            />

            <VictoryAxis
                label={selectedGene1}
                // offsetY={200}
                style={{ axisLabel: { padding: 30 } }}
                // domain={xDomain}
                gridComponent={
                    <line style={{ stroke: '#ccc', strokeWidth: 0.5 }} />
                }
            />
            <VictoryAxis
                dependentAxis
                label={selectedGene2}
                // offsetX={100}
                style={{ axisLabel: { padding: 40 } }}
                // domain={yDomain}
                gridComponent={
                    <line style={{ stroke: '#ccc', strokeWidth: 0.5 }} />
                }
            />

            <VictoryScatter
                data={combinedData}
                x="x"
                y="y"
                style={{
                    data: {
                        fill: '#00FF00',
                        stroke: '#666666',
                        fillOpacity: 0.9,
                        strokeWidth: 1,
                    },
                }}
                labels={(datum: any) => datum.label}
                labelComponent={<CustomTooltip />}
                size={(datum: any, active: any) => (active ? 7 : 5)}
                events={[
                    {
                        target: 'data',
                        eventHandlers: {
                            onMouseOver: () => [
                                {
                                    target: 'labels',
                                    mutation: () => ({ active: true }),
                                },
                                {
                                    target: 'data',
                                    mutation: (props: any) => ({
                                        active: true,
                                        label: props.datum.label,
                                    }),
                                },
                            ],
                            onMouseOut: () => [
                                {
                                    target: 'labels',
                                    mutation: () => ({
                                        active: undefined,
                                    }),
                                },
                                {
                                    target: 'data',
                                    mutation: () => ({ active: false }),
                                },
                            ],
                            onFocus: () => [
                                {
                                    target: 'labels',
                                    mutation: () => ({ active: true }),
                                },
                                {
                                    target: 'data',
                                    mutation: (props: any) => ({
                                        active: true,
                                        label: props.datum.label,
                                    }),
                                },
                            ],
                            onBlur: () => [
                                {
                                    target: 'labels',
                                    mutation: () => ({
                                        active: undefined,
                                    }),
                                },
                                {
                                    target: 'data',
                                    mutation: () => ({ active: false }),
                                },
                            ],
                        },
                    },
                ]}
            />
        </VictoryChart>
    );
};

export default ComparisonScatterPlot;
