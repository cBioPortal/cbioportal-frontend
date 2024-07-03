import React, { useState, useRef, useEffect } from 'react';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTooltip } from 'victory';
import { CBIOPORTAL_VICTORY_THEME } from 'cbioportal-frontend-commons';
import { handleDownloadSVG, handleDownloadPDF } from './downloadUtils';
import {
    DataBinMethodConstants,
    StudyViewPageStore,
} from 'pages/studyView/StudyViewPageStore';
import BarChart1 from '../studyView/charts/barChart/BarChart';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import client from 'shared/api/cbioportalClientInstance';
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
    stableIdBin: any;
    profileTypeBin: any;
    store: StudyViewPageStore;
    databinState: any;
    setDatabinState: (value: any) => void;
}

const BarChart: React.FC<BarChartProps> = ({
    dataBins,
    downloadData,
    selectedEntity,
    heading,
    stableIdBin,
    profileTypeBin,
    store,
    databinState,
    setDatabinState,
}) => {
    const [downloadOptionsVisible, setDownloadOptionsVisible] = useState(false);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [filterNA, setFilterNA] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterNA(e.target.checked);
    };

    const fetchDataBins = async (editedArray: any) => {
        const gaDataBins = await internalClient.fetchGenericAssayDataBinCountsUsingPOST(
            {
                dataBinMethod: DataBinMethodConstants.STATIC,
                genericAssayDataBinCountFilter: {
                    genericAssayDataBinFilters: [
                        {
                            stableId: stableIdBin,
                            profileType: profileTypeBin,
                            customBins: editedArray,
                        },
                    ] as any,
                    studyViewFilter: store.filters,
                },
            }
        );
        console.log(gaDataBins, 'gaDataBins-2');
        setDatabinState(gaDataBins);
    };

    const filteredData = !filterNA
        ? databinState.filter((bin: any) => bin.specialValue !== 'NA')
        : databinState;

    const xAxisLabels: string[] = [];
    filteredData.forEach((bin: any) => {
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

    const processedData: Datum[] = filteredData.map((bin: any) => {
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
    const [showXAxisValuesModal, setShowXAxisValuesModal] = useState(false);
    const formattedXAxisLabels = xAxisLabels
        .filter(label => !label.startsWith('<=') && !label.startsWith('>'))
        .join(', ');
    const handleCustomDatabins = () => {
        setShowXAxisValuesModal(true);
    };

    const handleCloseXAxisValuesModal = () => {
        setShowXAxisValuesModal(false);
    };
    console.log(formattedXAxisLabels, 'formattedCX');
    const [editValues, setEditValues] = useState(formattedXAxisLabels);

    useEffect(() => {
        setEditValues(formattedXAxisLabels);
    }, [formattedXAxisLabels]);
    const isCommaSeparatedNumeric = (input: string) => {
        const trimmedInput = input.replace(/\s/g, ''); // Remove all whitespace
        const regex = /^(\d+(,\d+)*)?$/; // Allow optional leading or trailing commas
        return regex.test(trimmedInput);
    };

    // State for validation message
    const [validationMessage, setValidationMessage] = useState('');
    const handleSave = () => {
        if (!isCommaSeparatedNumeric(editValues)) {
            setValidationMessage(
                'Please enter valid comma-separated numeric values.'
            );
        } else {
            console.log('Edited values:', editValues);
            // fetchDataBins(editValues);
            const editedValuesArray = editValues
                .split(',') // Split by commas
                .map(value => Number(value.trim())); // Convert each trimmed substring to a number

            console.log('Edited values array:', editedValuesArray);
            fetchDataBins(editedValuesArray);
            setValidationMessage('');
            handleCloseXAxisValuesModal();
        }
    };
    console.log(selectedEntity, 'selectedEntity side');
    return (
        <>
            <div
                id="div-to-download"
                style={{
                    textAlign: 'center',
                    position: 'relative',
                    marginBottom: '20px',
                }}
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
                            width={640}
                            padding={{
                                bottom: 80,
                                left: 60,
                                right: 60,
                            }}
                        >
                            <VictoryAxis
                                label={`Absolute/Relative Counts (${selectedEntity?.stableId})`}
                                style={{
                                    tickLabels: {
                                        angle: 45,
                                        textAnchor: 'start',
                                    },
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
                                barWidth={600 / processedData.length - 7}
                                alignment={'start'}
                                labels={(data: any) =>
                                    `Number of samples: ${data.count}\nRange: ${data.range}`
                                }
                                labelComponent={
                                    <VictoryTooltip
                                        cornerRadius={5}
                                        style={{ fontSize: 14 }}
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
                        top: '0',
                        right: '0',
                        cursor: 'pointer',
                        zIndex: 100,
                    }}
                    onMouseLeave={() => {
                        setOptionsVisible(false);
                        setDownloadOptionsVisible(false);
                    }}
                >
                    <i
                        className="fa fa-ellipsis-v"
                        aria-hidden="true"
                        onMouseEnter={() => setOptionsVisible(true)}
                        style={{
                            padding: '10px',
                            borderRadius: '50%',
                            border: '1px solid lightgrey',
                            transition: 'background-color 0.3s ease',
                        }}
                    />
                    {optionsVisible && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                backgroundColor: 'white',
                                boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                                zIndex: 200,
                                borderRadius: '4px',
                                overflow: 'hidden',
                                minWidth: '160px',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #ddd',
                                    transition: 'background-color 0.3s ease',
                                }}
                                onClick={() =>
                                    setDownloadOptionsVisible(
                                        !downloadOptionsVisible
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
                                <span style={{ marginRight: '8px' }}>
                                    <i className="fa fa-download" />
                                </span>
                                Download{' '}
                                <span style={{ fontSize: '12px' }}>
                                    {downloadOptionsVisible ? '▲' : '▼'}
                                </span>
                            </div>
                            {downloadOptionsVisible && (
                                <div
                                    style={{
                                        backgroundColor: 'white',
                                        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                                        zIndex: 200,
                                        borderRadius: '4px',
                                        overflow: 'hidden',
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
                                        <i
                                            className="fa fa-file-pdf-o"
                                            style={{
                                                marginRight: '8px',
                                            }}
                                        />
                                        PDF
                                    </div>
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
                                        <i
                                            className="fa fa-file-image-o"
                                            style={{
                                                marginRight: '8px',
                                            }}
                                        />
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
                                        <i
                                            className="fa fa-database"
                                            style={{
                                                marginRight: '8px',
                                            }}
                                        />
                                        Data
                                    </div>
                                </div>
                            )}
                            <div
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #ddd',
                                    transition: 'background-color 0.3s ease',
                                }}
                                onClick={handleCustomDatabins}
                                onMouseEnter={e =>
                                    (e.currentTarget.style.backgroundColor =
                                        '#f0f0f0')
                                }
                                onMouseLeave={e =>
                                    (e.currentTarget.style.backgroundColor =
                                        'white')
                                }
                            >
                                Custom Databins
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showXAxisValuesModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        zIndex: 300,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '20px',
                    }}
                    onClick={handleCloseXAxisValuesModal}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '30px',
                            borderRadius: '8px',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '80%',
                            overflow: 'auto',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ marginBottom: '20px' }}>
                            Please specify bin boundaries of the x axis
                        </h3>
                        <textarea
                            value={editValues}
                            onChange={e => {
                                setEditValues(e.target.value);
                                setValidationMessage('');
                            }}
                            style={{
                                width: '100%',
                                height: '100px',
                                marginBottom: '10px',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                fontSize: '14px',
                                resize: 'none',
                                outline: 'none',
                            }}
                            onFocus={e =>
                                (e.target.style.border = '1px solid #007bff')
                            }
                            onBlur={e =>
                                (e.target.style.border = '1px solid #ccc')
                            }
                        />
                        {validationMessage && (
                            <div style={{ color: 'red', marginBottom: '10px' }}>
                                {validationMessage}
                            </div>
                        )}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <button
                                onClick={handleSave}
                                style={{
                                    marginRight: '10px',
                                    padding: '8px 16px', // Adjusted padding to make the button smaller
                                    backgroundColor: '#007bff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'background-color 0.3s ease',
                                }}
                                onMouseEnter={e =>
                                    isCommaSeparatedNumeric(editValues) &&
                                    (e.currentTarget.style.backgroundColor =
                                        '#0056b3')
                                }
                                onMouseLeave={e =>
                                    isCommaSeparatedNumeric(editValues) &&
                                    (e.currentTarget.style.backgroundColor =
                                        '#007bff')
                                }
                            >
                                Update
                            </button>
                            <button
                                onClick={handleCloseXAxisValuesModal}
                                style={{
                                    padding: '8px 16px', // Adjusted padding to make the button smaller
                                    backgroundColor: '#6c757d',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'background-color 0.3s ease',
                                }}
                                onMouseEnter={e =>
                                    (e.currentTarget.style.backgroundColor =
                                        '#5a6268')
                                }
                                onMouseLeave={e =>
                                    (e.currentTarget.style.backgroundColor =
                                        '#6c757d')
                                }
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BarChart;
