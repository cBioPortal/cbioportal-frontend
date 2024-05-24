import React from 'react';
import { VictoryPie, VictoryTooltip } from 'victory';

// Define the DataBin interface
interface DataBin {
    id: string;
    count: number;
    end?: number;
    start?: number;
    specialValue?: string;
}

// Define props interface for the Chart component
interface ChartProps {
    dataBins: DataBin[];
}

const Chart: React.FC<ChartProps> = ({ dataBins }) => {
    // Filter out data bins with specialValue "NA"
    const filteredData = dataBins.filter(bin => bin.specialValue !== 'NA');

    // Process data bins to create a format suitable for VictoryPie
    const processedData = filteredData.map(bin => {
        // Generate the label based on start, end, and specialValue
        let label = '';
        if (bin.start !== undefined && bin.end !== undefined) {
            label = `Count: ${bin.count}, Range: ${bin.start} - ${bin.end}`;
        } else if (bin.specialValue === '<=') {
            label = `Count: ${bin.count}, Range: <= ${bin.end}`;
        } else if (bin.specialValue === '>') {
            label = `Count: ${bin.count}, Range: > ${bin.start}`;
        } else if (bin.specialValue) {
            label = bin.specialValue;
        } else {
            label = bin.id.replace(/_/g, ' '); // Replace underscores with spaces
        }

        return { x: label, y: bin.count };
    });

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>
                {dataBins.length > 0
                    ? dataBins[0].id.replace(/_/g, ' ')
                    : 'No Data'}
            </h2>
            <VictoryPie
                data={processedData}
                colorScale="qualitative"
                innerRadius={50}
                labelRadius={50}
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
                width={300} // Set the width of the pie chart
                height={300} // Set the height of the pie chart
            />
        </div>
    );
};

export default Chart;
