import React, { useState, useEffect, useRef } from 'react';
import { VictoryPie, VictoryTooltip } from 'victory';
import './styles.css';
import { observer } from 'mobx-react-lite';
import { colors } from './SingleCellStore';
// Define the DataBin interface

// Define props interface for the Chart component
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

const PieToolTip: React.FC<ChartProps> = observer(({ singleCellStore }) => {
    // const [isHovered, setIsHovered] = useState<boolean>(false);
    const {
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
        <div>
            <div style={{ position: 'relative' }}>
                <div
                    style={{
                        pointerEvents: 'auto', // Enable pointer events to capture hover on tooltip
                        opacity: tooltipEnabled
                            ? tooltipVisible
                                ? 1
                                : 0
                            : isHovered || tooltipHovered
                            ? 1
                            : 0,
                        transition: 'opacity 0.5s ease-in-out', // Smooth fade-in and fade-out transition
                        transitionDelay: '0s', // Delay for fade-out when tooltip vanishes
                        backgroundColor: 'white',
                        width: '400px',
                        marginRight: '10px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)', // Enhanced shadow for 3D effect
                        borderRadius: '10px', // Rounded corners
                        zIndex: 220,
                        padding: '10px', // Padding inside the tooltip
                        transform: 'translateZ(0)', // Prevents flickering in some browsers
                        position: 'relative', // Position relative for the pseudo-element
                    }}
                    onMouseEnter={() => setTooltipHovered(true)}
                    onMouseLeave={() => setTooltipHovered(false)}
                >
                    {/* Triangle */}
                    <div
                        style={{
                            content: '""',
                            position: 'absolute',
                            left: '-10px', // Position the triangle to the left of the tooltip
                            top: '50%', // Center the triangle vertically
                            transform: 'translateY(-50%)', // Center the triangle vertically
                            width: '0',
                            height: '0',
                            borderTop: '10px solid transparent', // Triangle pointing to the right
                            borderBottom: '10px solid transparent',
                            borderRight: '10px solid rgba(0, 0, 0, 0.15)', // Color of the triangle
                            zIndex: 219, // Ensure the triangle is under the tooltip shadow
                        }}
                    ></div>

                    <div
                        className="custom-scrollbar"
                        style={{
                            height: tooltipEnabled ? 'max-content' : undefined,
                            overflowY: 'auto',
                            resize: 'both',
                            overflow: 'auto',
                            backgroundColor: 'white',
                            pointerEvents: 'auto', // Re-enable pointer events for the scrollable container
                            borderRadius: '10px', // Same rounded corners inside
                        }}
                    >
                        <table
                            style={{
                                borderCollapse: 'collapse',
                                width: '100%',
                                textAlign: 'center',
                                borderRadius: '10px', // Same rounded corners for table
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            padding: '8px',
                                            backgroundColor: '#f0f0f0', // Light grey background for header
                                            borderRadius: '10px 10px 0 0', // Rounded corners on top
                                        }}
                                    >
                                        Color
                                    </th>
                                    <th
                                        style={{
                                            padding: '8px',
                                            textAlign: 'center',
                                            backgroundColor: '#f0f0f0',
                                        }}
                                    >
                                        Type of Cell
                                    </th>
                                    <th
                                        style={{
                                            padding: '8px',
                                            textAlign: 'center',
                                            backgroundColor: '#f0f0f0',
                                        }}
                                    >
                                        Frequency
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pieData.map((slice, index) => (
                                    <tr
                                        key={slice.typeOfCell}
                                        style={{
                                            backgroundColor:
                                                hoveredSliceIndex === index
                                                    ? 'rgba(0, 0, 0, 0.15)'
                                                    : 'transparent',
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: '8px',
                                                textAlign: 'center',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '23px',
                                                    height: '23px',
                                                    backgroundColor:
                                                        slice.color,
                                                    textAlign: 'center',
                                                    borderRadius: '50%', // Circular shape for color indicators
                                                }}
                                            ></div>
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px',
                                            }}
                                        >
                                            {slice.typeOfCell}
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px',
                                            }}
                                        >
                                            {(
                                                (slice.percentage / totalSum) *
                                                100
                                            ).toFixed(2)}
                                            %
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PieToolTip;
