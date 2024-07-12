import React, { useState, useEffect, useRef } from 'react';
import { VictoryPie, VictoryTooltip, VictoryChart, VictoryAxis } from 'victory';
import { handleDownloadSVG, handleDownloadPDF } from './downloadUtils';
import './styles.css';
import { jsPDF } from 'jspdf-yworks';

// Define the DataBin interface
interface DataBin {
    id: string;
    count: number;
    end?: number;
    start?: number;
    specialValue?: string;
}

// Define props interface for the Chart component
interface PatientData {
    [key: string]: { stableId: string; value: number }[];
}

interface ChartProps {
    dataBins: DataBin[];
    pieChartData: any[];
    tooltipEnabled: boolean;
    downloadSvg: boolean;
    setDownloadSvg: React.Dispatch<React.SetStateAction<boolean>>;
    downloadPdf: boolean;
    setDownloadPdf: React.Dispatch<React.SetStateAction<boolean>>;
    heading: any;
    isHovered: any;
    setIsHovered: (value: any) => void;
    hoveredSliceIndex: any;
    setHoveredSliceIndex: (value: any) => void;
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
    heading,
    isHovered,
    setIsHovered,
    hoveredSliceIndex,
    setHoveredSliceIndex,
}) => {
    // const [isHovered, setIsHovered] = useState<boolean>(false);
    console.log(pieChartData, 'this is piechartData');

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
    console.log(differentPatientIds, 'differentPatientIds');
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
    console.log(patientData, 'patientData');
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
        '#00BCD4', // Cyan (High contrast, good accessibility)
        '#FF9800', // Orange (Warm, contrasting)
        '#A52A2A', // Maroon (Deep, high contrast)
        '#795548', // Brown (Earth tone, contrasts well with previous)
        '#27AE60', // Pink (Light, good contrast)
        '#E53935', // Green (Vibrant, contrasts with Pink)
        '#9C27B0', // Violet (Rich, unique hue)
        '#2986E2', // Blue (Calming, high contrast)
        '#FFEB3B', // Light Yellow (Light, good contrast with Blue)
        '#051288', // Red (Bold, contrasts well)
        '#008080',
        '#7a8376',
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
    // console.log(pieChartData,sumValues,"here is piedata")

    const pieData = Object.keys(sumValues).map((key, index) => {
        const color =
            pieChartData.find(item => item.genericAssayStableId === key)
                ?.color || colors[index];
        return {
            typeOfCell: key,
            percentage: sumValues[key],
            color: color,
        };
    });

    const handleDownloadData = () => {
        const columnsToDownload = ['patientId', 'sampleId', 'studyId', 'value'];
        const headers = columnsToDownload;
        const dataRows = pieChartData.map((item: any) =>
            columnsToDownload.map(column => item[column]).join('\t')
        );
        const dataString = [headers.join('\t'), ...dataRows].join('\n');
        const blob = new Blob([dataString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'bar_chart_data.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    const chartRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        const element = document.getElementById('div-to-download');

        if (element) {
            // Find the element to exclude
            const excludeElement = element.querySelector(
                '.exclude-from-svg'
            ) as HTMLElement;
            if (excludeElement) {
                // Hide the element to exclude
                excludeElement.style.display = 'none';
            }

            // Create an SVG element
            const svg = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('width', element.offsetWidth.toString());
            svg.setAttribute('height', (element.offsetHeight + 150).toString());

            // Create a foreignObject element to hold the HTML content
            const foreignObject = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'foreignObject'
            );
            foreignObject.setAttribute('width', '100%');
            foreignObject.setAttribute('height', '100%');

            // Clone the HTML content and append it to the foreignObject
            const clonedContent = element.cloneNode(true) as HTMLElement;

            // Add percentages to cloned content for SVG
            clonedContent
                .querySelectorAll('.pie-label')
                .forEach((label: HTMLElement) => {
                    const percentageSpan = document.createElement('span');
                    const percentage = label.getAttribute('data-percentage');
                    percentageSpan.innerHTML = ` (${percentage}%)`;
                    label.appendChild(percentageSpan);
                });

            foreignObject.appendChild(clonedContent);

            // Append the foreignObject to the SVG
            svg.appendChild(foreignObject);

            // Create a blob from the SVG and trigger a download
            const serializer = new XMLSerializer();
            const svgBlob = new Blob([serializer.serializeToString(svg)], {
                type: 'image/svg+xml;charset=utf-8',
            });
            const url = URL.createObjectURL(svgBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${heading}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Revoke the object URL after download
            URL.revokeObjectURL(url);

            // Show the excluded element again
            if (excludeElement) {
                excludeElement.style.display = '';
            }
        } else {
            console.error('Element not found');
        }
    };

    const handleDownloadPDFWrapper = async () => {
        if (chartRef.current) {
            const svg = chartRef.current.querySelector('svg');
            if (svg) {
                await handleDownloadPDF({ current: svg });
            }
        }
    };
    const handlePDF = () => {
        const element = document.getElementById('div-to-download');

        if (element) {
            // Hide the excluded element
            const excludeElement = element.querySelector(
                '.exclude-from-svg'
            ) as HTMLElement;
            if (excludeElement) {
                excludeElement.style.display = 'none';
            }

            // Create an SVG element
            const svg = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('width', element.offsetWidth.toString());
            svg.setAttribute('height', (element.offsetHeight + 80).toString());

            // Create a foreignObject element to hold the HTML content
            const foreignObject = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'foreignObject'
            );
            foreignObject.setAttribute('width', '100%');
            foreignObject.setAttribute('height', '100%');

            // Clone the HTML content and append it to the foreignObject
            const clonedContent = element.cloneNode(true) as HTMLElement;
            foreignObject.appendChild(clonedContent);

            // Append the foreignObject to the SVG
            svg.appendChild(foreignObject);

            // Create a blob from the SVG
            const serializer = new XMLSerializer();
            const svgBlob = new Blob([serializer.serializeToString(svg)], {
                type: 'image/svg+xml;charset=utf-8',
            });

            // Create a canvas to render the SVG
            const canvas = document.createElement('canvas');
            canvas.width = element.offsetWidth;
            canvas.height = element.offsetHeight + 80;

            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                }
                const pdf = new jsPDF('p', 'pt', 'a4');
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0);
                pdf.save('div-content.pdf');

                // Show the excluded element again
                if (excludeElement) {
                    excludeElement.style.display = '';
                }
            };

            const url = URL.createObjectURL(svgBlob);
            img.src = url;
        } else {
            console.error('Element not found');
        }
    };
    console.log(dataBins, 'this is databinss');
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
                                animate={{
                                    duration: 2000,
                                    onLoad: { duration: 1000 },
                                }}
                                events={[
                                    {
                                        target: 'data',
                                        eventHandlers: {
                                            onMouseOver: (
                                                evt: React.MouseEvent<any>,
                                                props: VictoryEventProps
                                            ) => {
                                                setHoveredSliceIndex(
                                                    props.index
                                                );
                                                if (!tooltipEnabled) {
                                                    setIsHovered(true);
                                                    setHoveredSliceIndex(
                                                        props.index
                                                    );
                                                }

                                                return [];
                                            },
                                            onMouseOut: () => {
                                                setHoveredSliceIndex(-1);
                                                if (!tooltipEnabled) {
                                                    setIsHovered(false);
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
                                    onClick={handleDownload}
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
};

export default Chart;
