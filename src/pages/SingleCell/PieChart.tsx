import React, { useState, useEffect, useRef } from 'react';
import { VictoryPie, VictoryTooltip } from 'victory';
import { handleDownloadSVG, handleDownloadPDF } from './downloadUtils';
import './styles.css';

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
    tooltipEnabled: boolean;
    downloadSvg: boolean;
    setDownloadSvg: React.Dispatch<React.SetStateAction<boolean>>;
    downloadPdf: boolean;
    setDownloadPdf: React.Dispatch<React.SetStateAction<boolean>>;
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

const Chart: React.FC<ChartProps> = ({
    dataBins,
    pieChartData,
    tooltipEnabled,
    downloadSvg,
    setDownloadSvg,
    downloadPdf,
    setDownloadPdf,
}) => {
    const [isHovered, setIsHovered] = useState<boolean>(false);
    console.log(pieChartData, 'this is piechartData');
    const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(
        null
    );
    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
    const [tooltipHovered, setTooltipHovered] = useState<boolean>(false);
    const [downloadOptionsVisible, setDownloadOptionsVisible] = useState<
        boolean
    >(false);

    // Create a ref to hold the SVG container
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (downloadSvg) {
            handleDownloadSVG(svgRef);
            setDownloadSvg(false);
        }
    }, [downloadSvg]);

    useEffect(() => {
        if (downloadPdf) {
            handleDownloadPDF(svgRef);
            setDownloadPdf(false);
        }
    }, [downloadPdf]);

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

    // Define color scale (replace with your desired colors)
    const colors = [
        '#2986E2',
        '#DC3912',
        '#f88508',
        '#109618',
        '#990099',
        '#0099c6',
        '#dd4477',
        '#66aa00',
        '#b82e2e',
        '#4e2da2',
        '#38761d',
        '#c90076',
    ];

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
                const value = parseFloat(item.value);
                totalSum += value;
                return acc + value;
            }
            return acc;
        }, 0);
    });

    const pieData = Object.keys(sumValues).map((key, index) => {
        const color =
            pieChartData.find(item => item.genericAssayStableId === key)
                ?.color || colors[index % colors.length];
        return {
            typeOfCell: key,
            percentage: sumValues[key],
            color: color,
        };
    });

    const handleDownloadData = () => {
        const headers = Object.keys(pieChartData[0]);
        const dataRows = pieChartData.map(item =>
            headers.map(header => item[header]).join('\t')
        );
        const dataString = [headers.join('\t'), ...dataRows].join('\n');
        const blob = new Blob([dataString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pie_chart_data.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start', // Align items at the top
                    width: '100%',
                    marginTop: '15px',
                    position: 'relative',
                }}
            >
                <div style={{ flex: '0 0 60%', textAlign: 'center' }}>
                    {' '}
                    {/* Adjust flex basis as needed */}
                    <h2>
                        {dataBins.length > 0
                            ? dataBins[0].id.replace(/_/g, ' ')
                            : 'No Data'}
                    </h2>
                    <svg ref={svgRef} width={400} height={400}>
                        <VictoryPie
                            standalone={false}
                            data={pieData}
                            x="typeOfCell"
                            y="percentage"
                            colorScale={colors} // Use the defined color scale
                            innerRadius={50}
                            labelRadius={50}
                            labelComponent={<VictoryTooltip />}
                            labels={(data: any) =>
                                `Cell type: ${data.typeOfCell}\nPercentage: ${(
                                    (data.percentage / totalSum) *
                                    100
                                ).toFixed(2)}%`
                            }
                            height={400} // Adjust height as necessary
                            width={400} // Adjust width as necessary
                            events={[
                                {
                                    target: 'data',
                                    eventHandlers: {
                                        onMouseOver: (
                                            evt: React.MouseEvent<any>,
                                            props: VictoryEventProps
                                        ) => {
                                            if (!tooltipEnabled) {
                                                setIsHovered(true);
                                                setHoveredSliceIndex(
                                                    props.index
                                                );
                                            }
                                            return [];
                                        },
                                        onMouseOut: () => {
                                            if (!tooltipEnabled) {
                                                setIsHovered(false);
                                            }
                                            return [];
                                        },
                                    },
                                },
                            ]}
                        />
                    </svg>
                    {/* <button onClick={handleDownloadPDF} style={{ marginTop: '20px' }}>
                        Download PDF
                    </button> */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: '30px',
                            cursor: 'pointer',
                            border: '1px solid lightgrey',
                            padding: '5px',
                            // backgroundColor: 'lightgrey',
                            borderRadius: '4px',
                            transition: 'background-color 0.3s ease',
                        }}
                        onMouseEnter={() => setDownloadOptionsVisible(true)}
                        onMouseLeave={() => setDownloadOptionsVisible(false)}
                    >
                        <i
                            className="fa fa-cloud-download"
                            aria-hidden="true"
                        />
                        {downloadOptionsVisible && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '30px',
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
                                        borderBottom: '1px solid #ddd',
                                        transition:
                                            'background-color 0.3s ease',
                                    }}
                                    onClick={() => handleDownloadPDF(svgRef)}
                                    onMouseEnter={e =>
                                        (e.currentTarget.style.backgroundColor =
                                            '#f0f0f0')
                                    }
                                    onMouseLeave={e =>
                                        (e.currentTarget.style.backgroundColor =
                                            'white')
                                    }
                                >
                                    PDF
                                </div>
                                <div
                                    style={{
                                        padding: '8px',
                                        cursor: 'pointer',
                                        transition:
                                            'background-color 0.3s ease',
                                    }}
                                    onClick={() => handleDownloadSVG(svgRef)}
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
                                    onClick={handleDownloadData}
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

                <div style={{ flex: '0 0 40%', position: 'relative' }}>
                    {' '}
                    {/* Adjust flex basis as needed */}
                    {(tooltipVisible || tooltipEnabled) && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '150px', // Move tooltip downwards
                                left: '80px', // Position tooltip to the right of the pie chart container
                                pointerEvents: 'auto', // Enable pointer events to capture hover on tooltip
                                opacity: tooltipEnabled
                                    ? tooltipVisible
                                        ? 1
                                        : 0
                                    : isHovered || tooltipHovered
                                    ? 1
                                    : 0,
                                margin: 'auto',
                                transition: 'opacity 0.5s ease-in-out', // Smooth fade-in and fade-out transition
                                transitionDelay: '0s', // Delay for fade-out when tooltip vanishes
                                backgroundColor: 'white',
                                width: '350px',
                                boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                                zIndex: 220,
                            }}
                            onMouseEnter={() => setTooltipHovered(true)}
                            onMouseLeave={() => setTooltipHovered(false)}
                        >
                            <div
                                className="custom-scrollbar"
                                style={{
                                    height: '150px', // Adjust as necessary
                                    overflowY: 'auto',
                                    resize: 'both',
                                    overflow: 'auto',
                                    backgroundColor: 'white',
                                    pointerEvents: 'auto', // Re-enable pointer events for the scrollable container
                                }}
                            >
                                <table
                                    style={{
                                        borderCollapse: 'collapse',
                                        width: '100%',
                                        textAlign: 'center',
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <th
                                                style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                Color
                                            </th>
                                            <th
                                                style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                Type of Cell
                                            </th>
                                            <th
                                                style={{
                                                    border: '1px solid black',
                                                    padding: '8px',
                                                    textAlign: 'center',
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
                                                        hoveredSliceIndex ===
                                                        index
                                                            ? 'rgba(0, 0, 0, 0.1)'
                                                            : 'transparent',
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        border:
                                                            '1px solid black',
                                                        padding: '8px',
                                                        backgroundColor:
                                                            slice.color,
                                                    }}
                                                ></td>
                                                <td
                                                    style={{
                                                        border:
                                                            '1px solid black',
                                                        padding: '8px',
                                                    }}
                                                >
                                                    {slice.typeOfCell}
                                                </td>
                                                <td
                                                    style={{
                                                        border:
                                                            '1px solid black',
                                                        padding: '8px',
                                                    }}
                                                >
                                                    {(
                                                        (slice.percentage /
                                                            totalSum) *
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chart;
