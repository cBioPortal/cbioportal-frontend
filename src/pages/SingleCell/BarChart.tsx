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
}

const BarChart: React.FC<BarChartProps> = ({ dataBins, downloadData }) => {
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
        if (bin.specialValue === '<=') {
            label = `<= ${bin.end}`;
            range = `<= ${bin.end}`;
        } else if (bin.specialValue == 'NA') {
            label = `NA`;
            range = `NA`;
        } else if (bin.specialValue === '>') {
            label = `> ${bin.start}`;
            range = `> ${bin.start}`;
        } else if (bin.start !== undefined && bin.end !== undefined) {
            label = `${bin.start}`;
            range = `${bin.start} - ${bin.end}`;
        } else {
            label = bin.id.replace(/_/g, ' ');
            range = `${bin.start} - ${bin.end}`;
        }
        return { x: label, y: bin.count, range: range, count: bin.count };
    });

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

    return (
        <div style={{ textAlign: 'center', position: 'relative' }}>
            <h2>
                {dataBins.length > 0
                    ? dataBins[0].id.replace(/_/g, ' ')
                    : 'No Data  '}
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
                    >
                        <VictoryAxis
                            style={{
                                tickLabels: { angle: 45, textAnchor: 'start' },
                            }}
                            tickValues={xAxisLabels}
                        />
                        <VictoryAxis dependentAxis />
                        <VictoryBar
                            data={processedData}
                            barWidth={20}
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
                            onClick={handleDownloadSVGWrapper}
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
