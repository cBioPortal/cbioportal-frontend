import React from 'react';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTooltip } from 'victory';
// Importing the required styles and functions from 'cbioportal-frontend-commons'
import { CBIOPORTAL_VICTORY_THEME } from 'cbioportal-frontend-commons';

// Define the DataBin interface
interface DataBin {
    id: string;
    count: number;
    end?: number;
    start?: number;
    specialValue?: string;
}

// Define the Datum interface for the processed data
interface Datum {
    x: string;
    y: number;
    range: string;
    count: number;
}

// Define props interface for the BarChart component
interface BarChartProps {
    dataBins: DataBin[];
}

const BarChart: React.FC<BarChartProps> = ({ dataBins }) => {
    // Filter out data bins with specialValue "NA"
    const filteredData = dataBins.filter(bin => bin.specialValue !== 'NA');

    // Determine the unique x-axis labels including the special values
    const xAxisLabels: string[] = [];
    filteredData.forEach(bin => {
        if (bin.specialValue === '<=') {
            xAxisLabels.push(`<= ${bin.end}`);
        } else if (bin.specialValue === '>') {
            xAxisLabels.push(`> ${bin.start}`);
        } else if (bin.start !== undefined && bin.end !== undefined) {
            xAxisLabels.push(`${bin.start}`);
        }
    });

    // Ensure the xAxisLabels array is sorted
    xAxisLabels.sort((a, b) => {
        const parseLabel = (label: string) => {
            if (label.startsWith('<=')) return parseFloat(label.slice(2));
            if (label.startsWith('>')) return parseFloat(label.slice(1));
            return parseFloat(label);
        };
        return parseLabel(a) - parseLabel(b);
    });

    // Process data bins to create a format suitable for VictoryBar
    const processedData: Datum[] = filteredData.map(bin => {
        let label = '';
        let range = '';
        if (bin.specialValue === '<=') {
            label = `<= ${bin.end}`;
            range = `<= ${bin.end}`;
        } else if (bin.specialValue === '>') {
            label = `> ${bin.start}`;
            range = `> ${bin.start}`;
        } else if (bin.start !== undefined && bin.end !== undefined) {
            label = `${bin.start}`;
            range = `${bin.start} - ${bin.end}`;
        } else {
            label = bin.id.replace(/_/g, ' '); // Replace underscores with spaces
            range = `${bin.start} - ${bin.end}`;
        }

        return { x: label, y: bin.count, range: range, count: bin.count };
    });

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>
                {dataBins.length > 0
                    ? dataBins[0].id.replace(/_/g, ' ')
                    : 'No Data'}
            </h2>
            {processedData.length !== 0 && (
                <VictoryChart
                    theme={CBIOPORTAL_VICTORY_THEME}
                    domainPadding={{ x: 15, y: 20 }}
                    height={400} // Adjust height as necessary
                    width={600} // Adjust width as necessary
                >
                    <VictoryAxis
                        style={{
                            tickLabels: { angle: 45, textAnchor: 'start' },
                        }}
                        tickValues={xAxisLabels}
                    />
                    {console.log(xAxisLabels, 'xasos', processedData)}
                    <VictoryAxis dependentAxis />
                    <VictoryBar
                        data={processedData}
                        barWidth={20} // Adjust the width of each bar
                        labels={(data: any) =>
                            `Number of samples: ${data.count}\nRange: ${data.range}`
                        }
                        labelComponent={
                            <VictoryTooltip
                                cornerRadius={5}
                                style={{ fontSize: 10 }}
                                flyoutStyle={{
                                    fill: 'white',
                                    stroke: 'black',
                                    strokeWidth: 1,
                                }} // Add border
                                flyoutPadding={{
                                    top: 5,
                                    bottom: 5,
                                    left: 10,
                                    right: 10,
                                }}
                            />
                        }
                        style={{ data: { fill: '#2986E2' } }}
                    />
                </VictoryChart>
            )}
        </div>
    );
};

export default BarChart;
