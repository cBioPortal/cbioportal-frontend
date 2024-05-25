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
    pieChartData: any[];
}

const Chart: React.FC<ChartProps> = ({ dataBins, pieChartData }) => {
    // Filter out data bins with specialValue "NA"
    const uniqueIds: string[] = [
        ...new Set(pieChartData.map((item: any) => item.genericAssayStableId)),
    ];
    const sumValues: { [key: string]: number } = {};

    // Calculate the total sum of sumValues
    let totalSum = 0;
    uniqueIds.forEach((id: string) => {
        sumValues[id] = pieChartData.reduce((acc: number, item: any) => {
            if (item.genericAssayStableId === id) {
                // Convert item.value to a number before adding
                const value = parseFloat(item.value);
                totalSum += value; // Add to the total sum
                return acc + value;
            }
            return acc;
        }, 0);
    });
    console.log(sumValues, 'sumishere');

    // Convert sumValues object into an array of objects suitable for VictoryPie
    const pieData = Object.keys(sumValues).map(key => ({
        typeOfCell: key,
        percentage: sumValues[key],
    }));

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>
                {dataBins.length > 0
                    ? dataBins[0].id.replace(/_/g, ' ')
                    : 'No Data'}
            </h2>
            <VictoryPie
                data={pieData}
                x="typeOfCell"
                y="percentage"
                colorScale="qualitative"
                innerRadius={50}
                labelRadius={100}
                labelComponent={<VictoryTooltip />}
                labels={(data: any) =>
                    `Cell type: ${data.typeOfCell}\nPercentage: ${(
                        (data.percentage / totalSum) *
                        100
                    ).toFixed(2)}%`
                }
                height={400} // Adjust height as necessary
                width={600} // Adjust width as necessary
            />
        </div>
    );
};

export default Chart;
