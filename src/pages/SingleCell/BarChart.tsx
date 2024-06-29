import React, { useState, useRef } from 'react';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTooltip } from 'victory';
import { CBIOPORTAL_VICTORY_THEME } from 'cbioportal-frontend-commons';
import { handleDownloadSVG, handleDownloadPDF } from './downloadUtils';

interface DataBin {
    id: string;
    count: number;
    end?: number;
    start?: number;
    specialValue?: string;
}

interface Datum {
    x: string;
    y: number;
    range: string;
    count: number;
}

interface gaData {
    uniqueSampleKey: string;
    uniquePatientKey: string;
    molecularProfileId: string;
    sampleId: string;
    patientId: string;
    studyId: string;
    value: string;
    genericAssayStableId: string;
    stableId: string;
}

interface BarChartProps {
    dataBins: DataBin[];
    downloadData: gaData[];
    selectedEntity: any;
    heading: any;
}

const BarChart: React.FC<BarChartProps> = ({
    dataBins,
    downloadData,
    selectedEntity,
    heading,
}) => {
    const [downloadOptionsVisible, setDownloadOptionsVisible] = useState(false);
    const [filterNA, setFilterNA] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterNA(e.target.checked);
    };

    const filteredData = !filterNA
        ? dataBins.filter(bin => bin.specialValue !== 'NA')
        : dataBins;

    const xAxisLabels: string[] = [];
    filteredData.forEach(bin => {
        if (bin.specialValue === '<=') {
            xAxisLabels.push(`<= ${bin.end}`);
        } else if (bin.specialValue === '>') {
            xAxisLabels.push(`> ${bin.start}`);
        } else if (bin.start !== undefined && bin.end !== undefined) {
            xAxisLabels.push(`${bin.start}`);
        } else {
            xAxisLabels.push(`NA`);
        }
    });

    xAxisLabels.sort((a, b) => {
        const parseLabel = (label: string) => {
            if (label.startsWith('<=')) return parseFloat(label.slice(2));
            if (label.startsWith('>')) return parseFloat(label.slice(1));
            return parseFloat(label);
        };
        return parseLabel(a) - parseLabel(b);
    });

    const processedData: Datum[] = filteredData.map(bin => {
        let label = '';
        let range = '';
        let alignment = '';
        if (bin.specialValue === '<=') {
            label = `<= ${bin.end}`;
            range = `<= ${bin.end}`;
            alignment = 'middle';
        } else if (bin.specialValue == 'NA') {
            label = `NA`;
            range = `NA`;
            alignment = 'middle';
        } else if (bin.specialValue === '>') {
            label = `> ${bin.start}`;
            range = `> ${bin.start}`;
            alignment = 'middle';
        } else if (bin.start !== undefined && bin.end !== undefined) {
            label = `${bin.start}`;
            range = `${bin.start} - ${bin.end}`;
            alignment = 'start';
        } else {
            label = bin.id.replace(/_/g, ' ');
            range = `${bin.start} - ${bin.end}`;
            alignment = 'start';
        }
        return {
            x: label,
            y: bin.count,
            range: range,
            count: bin.count,
            alignment: alignment,
        };
    });

    console.log(processedData, 'thi is processed data');
    const handleDownloadSVGWrapper = () => {
        if (chartRef.current) {
            const svg = chartRef.current.querySelector('svg');
            if (svg) {
                handleDownloadSVG({ current: svg });
            }
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

    const handleDownloadData = () => {
        const columnsToDownload = ['patientId', 'sampleId', 'studyId', 'value'];
        const headers = columnsToDownload;
        const dataRows = downloadData.map((item: any) =>
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

            // Create a blob from the SVG and trigger a download
            const serializer = new XMLSerializer();
            const svgBlob = new Blob([serializer.serializeToString(svg)], {
                type: 'image/svg+xml;charset=utf-8',
            });
            const url = URL.createObjectURL(svgBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedEntity.stableId}.svg`;
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
    console.log(selectedEntity, 'selectedEntity side');
    return (
        <div
            id="div-to-download"
            style={{ textAlign: 'center', position: 'relative' }}
        >
            <h2>
                {heading && heading.length > 0
                    ? heading.replace(/_/g, ' ')
                    : 'No Data'}
            </h2>
            <label
                style={{
                    display: 'block',
                    marginBottom: '10px',
                    marginTop: '10px',
                    textAlign: 'end',
                }}
            >
                <input
                    type="checkbox"
                    checked={filterNA}
                    onChange={handleCheckboxChange}
                />{' '}
                Show NA values
            </label>
            {processedData.length !== 0 && (
                <div ref={chartRef}>
                    <VictoryChart
                        theme={CBIOPORTAL_VICTORY_THEME}
                        domainPadding={{ x: 15, y: 20 }}
                        height={400}
                        width={600}
                        padding={{
                            bottom: 80,
                            left: 60,
                        }}
                    >
                        <VictoryAxis
                            label={`Absolute/Relative Counts (${selectedEntity.stableId})`}
                            style={{
                                tickLabels: { angle: 45, textAnchor: 'start' },
                                axisLabel: { padding: 50, fontSize: 15 },
                            }}
                            tickValues={xAxisLabels}
                        />
                        <VictoryAxis
                            label="No. of Samples"
                            style={{
                                axisLabel: { padding: 30, fontSize: 15 },
                            }}
                            dependentAxis
                        />
                        <VictoryBar
                            data={processedData}
                            barWidth={600 / processedData.length - 8}
                            aligment={'start'}
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
                                    }}
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
                </div>
            )}

            <div
                className="exclude-from-svg"
                style={{
                    position: 'absolute',
                    top: 0,
                    right: '30px',
                    cursor: 'pointer',
                    border: '1px solid lightgrey',
                    padding: '5px',
                    borderRadius: '4px',
                    transition: 'background-color 0.3s ease',
                    zIndex: 10,
                }}
                onMouseEnter={() => setDownloadOptionsVisible(true)}
                onMouseLeave={() => setDownloadOptionsVisible(false)}
            >
                <i className="fa fa-cloud-download" aria-hidden="true" />
                {downloadOptionsVisible && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '30px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'white',
                            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                            zIndex: 20,
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
                                transition: 'background-color 0.3s ease',
                            }}
                            onClick={handleDownloadPDFWrapper}
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
                                transition: 'background-color 0.3s ease',
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
                                transition: 'background-color 0.3s ease',
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
    );
};

export default BarChart;
