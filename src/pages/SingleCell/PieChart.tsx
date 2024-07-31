import React, { useState, useEffect, useRef } from 'react';
import { VictoryPie, VictoryTooltip, VictoryChart, VictoryAxis } from 'victory';
import {
    handleDownloadSvgUtils,
    handleDownloadDataUtils,
} from './downloadUtils';
import './styles.css';
import { jsPDF } from 'jspdf-yworks';
import { observer } from 'mobx-react-lite';
import singleCellStore_importedDirectly from './SingleCellStore';
import { colors } from './SingleCellStore';
interface DataBin {
    id: string;
    count: number;
    end?: number;
    start?: number;
    specialValue?: string;
}

interface PatientData {
    [key: string]: { stableId: string; value: number }[];
}

interface ChartProps {
    singleCellStore: any;
}

// Define the type for the pie chart data
interface PieChartData {
    typeOfCell: string;
    percentage: number;
    color?: string; // Optional color property if not using colorScale
}

// Define the type for the VictoryPie event props
interface VictoryEventProps {
    index: number;
}

const Chart: React.FC<ChartProps> = observer(({ singleCellStore }) => {
    const {
        dataBins,
        pieChartData,
        tooltipEnabled,
        downloadSvg,
        setDownloadSvg,
        downloadPdf,
        setDownloadPdf,
        heading,
        isHovered,
        setIsHovered,
        hoveredSliceIndex,
        setHoveredSliceIndex,
    } = singleCellStore;

    if (!singleCellStore) {
        console.error('singleCellStore is undefined');
        return null; // Handle the case where singleCellStore is not available
    }
    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
    const [tooltipHovered, setTooltipHovered] = useState<boolean>(false);
    const [downloadOptionsVisible, setDownloadOptionsVisible] = useState<
        boolean
    >(false);

    // Create a ref to hold the SVG container
    const svgRef = useRef<SVGSVGElement>(null);
    // Set to store unique patient IDs
    let differentPatientIds: string[] = [];

    // Extract unique patient IDs from piechartData
    for (let i = 0; i < pieChartData.length; i++) {
        let currentId = pieChartData[i].patientId;
        if (!differentPatientIds.includes(currentId)) {
            differentPatientIds.push(currentId);
        }
    }
    // Initialize an object to store data for each patient
    // let patientData = {};
    let patientData: PatientData = {};

    // Iterate over unique patient IDs
    for (let i = 0; i < differentPatientIds.length; i++) {
        let id = differentPatientIds[i];
        patientData[id] = []; // Initialize array for current patient ID

        // Iterate over piechartData to find data for current patient
        for (let j = 0; j < pieChartData.length; j++) {
            if (pieChartData[j].patientId === id) {
                patientData[id].push({
                    stableId: pieChartData[j].stableId,
                    value: pieChartData[j].value,
                });
            }
        }
    }

    // Set tooltip visibility with a delay when hover state changes, only if tooltipEnabled is false
    useEffect(() => {
        if (tooltipEnabled) {
            setTooltipVisible(true);
        } else {
            if (isHovered || tooltipHovered) {
                setTooltipVisible(true);
            } else {
                const timeoutId = setTimeout(
                    () => setTooltipVisible(false),
                    300
                ); // 300ms delay before hiding tooltip
                return () => clearTimeout(timeoutId);
            }
        }
    }, [isHovered, tooltipHovered, tooltipEnabled]);

    // Filter out data bins with specialValue "NA"
    const uniqueIds: any = [
        ...new Set(pieChartData.map((item: any) => item.genericAssayStableId)),
    ];
    const sumValues: { [key: string]: number } = {};

    // Calculate the total sum of sumValues
    let totalSum = 0;
    uniqueIds.forEach((id: string) => {
        sumValues[id] = pieChartData.reduce((acc: number, item: any) => {
            if (item.genericAssayStableId === id) {
                const value = parseFloat(item.value);
                totalSum += value;
                return acc + value;
            }
            return acc;
        }, 0);
    });

    const pieData = Object.keys(sumValues).map((key, index) => {
        const color =
            pieChartData.find((item: any) => item.genericAssayStableId === key)
                ?.color || colors[index];
        return {
            typeOfCell: key,
            percentage: sumValues[key],
            color: color,
        };
    });

    return (
        <>
            <div id="div-to-download">
                <div style={{ marginTop: '30px' }}>
                    <h2 style={{ textAlign: 'center' }}>
                        {heading && heading.length > 0
                            ? heading.replace(/_/g, ' ')
                            : 'No Data'}
                    </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div>
                        <VictoryChart height={510} width={800}>
                            <VictoryAxis
                                style={{
                                    axis: { stroke: 'none' },
                                    ticks: { stroke: 'none' },
                                    tickLabels: { fill: 'none' },
                                }}
                            />
                            <VictoryAxis
                                dependentAxis
                                style={{
                                    axis: { stroke: 'none' },
                                    ticks: { stroke: 'none' },
                                    tickLabels: { fill: 'none' },
                                }}
                            />

                            <VictoryPie
                                standalone={false}
                                data={pieData}
                                x="typeOfCell"
                                y="percentage"
                                colorScale={colors} // Use the defined color scale
                                innerRadius={60}
                                labelRadius={50}
                                labelComponent={<VictoryTooltip />}
                                labels={(data: any) =>
                                    `Cell type: ${
                                        data.typeOfCell
                                    }\nPercentage: ${(
                                        (data.percentage / totalSum) *
                                        100
                                    ).toFixed(2)}%`
                                }
                                events={[
                                    {
                                        target: 'data',
                                        eventHandlers: {
                                            onMouseOver: (
                                                evt: React.MouseEvent<any>,
                                                props: VictoryEventProps
                                            ) => {
                                                singleCellStore_importedDirectly.setHoveredSliceIndex(
                                                    props.index
                                                );
                                                if (!tooltipEnabled) {
                                                    singleCellStore_importedDirectly.setIsHovered(
                                                        true
                                                    );
                                                    singleCellStore_importedDirectly.setHoveredSliceIndex(
                                                        props.index
                                                    );
                                                }

                                                return [];
                                            },
                                            onMouseOut: () => {
                                                singleCellStore_importedDirectly.setHoveredSliceIndex(
                                                    -1
                                                );
                                                if (!tooltipEnabled) {
                                                    singleCellStore_importedDirectly.setIsHovered(
                                                        false
                                                    );
                                                }

                                                return [];
                                            },
                                        },
                                    },
                                ]}
                            />
                        </VictoryChart>
                    </div>
                    <div
                        style={{
                            cursor: 'pointer',
                            border: '1px solid lightgrey',
                            padding: '5px',
                            borderRadius: '4px',
                            transition: 'background-color 0.3s ease',

                            position: 'relative',
                        }}
                        onMouseEnter={() => setDownloadOptionsVisible(true)}
                        onMouseLeave={() => setDownloadOptionsVisible(false)}
                        className="exclude-from-svg"
                    >
                        <i
                            className="fa fa-cloud-download"
                            aria-hidden="true"
                        />
                        {downloadOptionsVisible && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: 'white',
                                    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                                    zIndex: 220,
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    transition: 'opacity 0.3s ease-out',
                                    opacity: downloadOptionsVisible ? 1 : 0,
                                }}
                            >
                                <div
                                    style={{
                                        padding: '8px',
                                        cursor: 'pointer',
                                        transition:
                                            'background-color 0.3s ease',
                                    }}
                                    onClick={() =>
                                        handleDownloadSvgUtils(
                                            'div-to-download',
                                            'piechart_chart',
                                            'pieChart'
                                        )
                                    }
                                    onMouseEnter={e =>
                                        (e.currentTarget.style.backgroundColor =
                                            '#f0f0f0')
                                    }
                                    onMouseLeave={e =>
                                        (e.currentTarget.style.backgroundColor =
                                            'white')
                                    }
                                >
                                    SVG
                                </div>
                                <div
                                    style={{
                                        padding: '8px',
                                        cursor: 'pointer',
                                        transition:
                                            'background-color 0.3s ease',
                                    }}
                                    onClick={() =>
                                        handleDownloadDataUtils(
                                            pieChartData,
                                            'pie_chart_data.txt'
                                        )
                                    }
                                    onMouseEnter={e =>
                                        (e.currentTarget.style.backgroundColor =
                                            '#f0f0f0')
                                    }
                                    onMouseLeave={e =>
                                        (e.currentTarget.style.backgroundColor =
                                            'white')
                                    }
                                >
                                    Data
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        marginLeft: '120px',
                        marginRight: '40px',
                        marginBottom: '40px',
                    }}
                >
                    {pieData.map((data: any, index: any) => (
                        <div key={index} style={{ marginTop: '6px' }}>
                            <div
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: data.color,
                                    display: 'inline-block',
                                    marginLeft: '10px',
                                    marginRight: '10px',
                                }}
                            ></div>
                            <span
                                className="pie-label"
                                data-percentage={(
                                    (data.percentage / totalSum) *
                                    100
                                ).toFixed(2)}
                            >
                                {data.typeOfCell}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
});

export default Chart;
