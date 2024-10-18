import {
    VictoryStack,
    VictoryBar,
    VictoryChart,
    VictoryAxis,
    VictoryTooltip,
} from 'victory';
import React, { useState, useEffect, useRef } from 'react';
import { handleDownloadSVG, handleDownloadPDF } from './downloadUtils';
import './styles.css';
import Select from 'react-select';
import _ from 'lodash';
import singleCellStore, { SampleOption, colors } from './SingleCellStore';
import {
    DataBinMethodConstants,
    StudyViewPageStore,
} from 'pages/studyView/StudyViewPageStore';
import { DataBin } from 'pages/studyView/StudyViewUtils';
import { GenericAssayData } from 'cbioportal-ts-api-client';

interface DataItem {
    stableId: string;
    value: number;
}
interface StackedBarChartProps {
    store: StudyViewPageStore;
    pieChartData: GenericAssayData[];
    dataBins: DataBin[];
    studyViewFilterFlag: boolean;
    setStudyViewFilterFlag: (value: any) => void;
    stackEntity: any;
    studyIdToStudy: string;
    hoveredSampleId: string;
    setPieChartData: (value: GenericAssayData[]) => void;
    setHoveredSampleId: (value: string) => void;
    currentTooltipData: { [key: string]: { [key: string]: React.ReactNode } };
    setCurrentTooltipData: (value: {
        [key: string]: { [key: string]: React.ReactNode };
    }) => void;
    map: { [key: string]: string };
    setMap: (value: { [key: string]: string }) => void;
    dynamicWidth: number;
    setDynamicWidth: (value: number) => void;
    setInitialWidth: (value: any) => void;
    isHorizontal: any;
    setIsHorizontal: (value: any) => void;
    isVisible: boolean;
    setIsVisible: (value: boolean) => void;
    tooltipHovered: boolean;
    setTooltipHovered: (value: boolean) => void;
    selectedSamples: SampleOption[];
    setSelectedSamples: (value: SampleOption[]) => void;
    dropdownOptions: SampleOption[];
    setDropdownOptions: (value: SampleOption[]) => void;
    isReverse: boolean;
    setSelectedOption: (value: any) => void;
}

interface StackedBarDatum {
    sampleId: string;
    stableId: string;
    value: number;
}

const StackedBarChart: React.FC<StackedBarChartProps> = ({
    store,
    pieChartData,
    setPieChartData,
    dataBins,
    studyViewFilterFlag,
    setStudyViewFilterFlag,
    stackEntity,
    studyIdToStudy,
    hoveredSampleId,
    setHoveredSampleId,
    currentTooltipData,
    setCurrentTooltipData,
    map,
    setMap,
    dynamicWidth,
    setDynamicWidth,
    setInitialWidth,
    isHorizontal,
    setIsHorizontal,
    isVisible,
    setIsVisible,
    tooltipHovered,
    setTooltipHovered,
    selectedSamples,
    setSelectedSamples,
    dropdownOptions,
    setDropdownOptions,
    isReverse,
    setSelectedOption,
}) => {
    const [selectedSortingSample, setSelectedSortingSample] = useState('');
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(
        null
    );
    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [downloadOptionsVisible, setDownloadOptionsVisible] = useState<
        boolean
    >(false);
    const [formattedDatastate, setFormattedDatastate] = useState([] as any);
    const [tooltipArraystate, setToolArraystate] = useState([] as any);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [noOfBars, setNoOfBars] = useState(0);
    const chartRef = useRef<HTMLDivElement>(null);
    let differentSampleIds: string[] = [];
    let differentStableIds: string[] = [];
    function calculatePercentageForPieChartData(data: any) {
        const groupedData = data.reduce((acc: any, item: any) => {
            if (!acc[item.sampleId]) {
                acc[item.sampleId] = [];
            }
            acc[item.sampleId].push(item);
            return acc;
        }, {});

        Object.keys(groupedData).forEach(sampleId => {
            const sampleData = groupedData[sampleId];
            const total = sampleData.reduce(
                (sum: any, item: any) => sum + parseFloat(item.value),
                0
            );

            sampleData.forEach((item: any) => {
                const percentage = (parseFloat(item.value) / total).toFixed(5);
                item.value = percentage + '%';
            });
        });

        return _.flatMap(groupedData);
    }
    const updatedPiechartData = calculatePercentageForPieChartData(
        pieChartData
    );
    for (let i = 0; i < pieChartData.length; i++) {
        let currentSampleId = pieChartData[i].sampleId;
        let currentStableId = pieChartData[i].stableId;

        if (!differentSampleIds.includes(currentSampleId)) {
            differentSampleIds.push(currentSampleId);
        }
        if (!differentStableIds.includes(currentStableId)) {
            differentStableIds.push(currentStableId);
        }
    }

    let stableIdData: { [key: string]: StackedBarDatum[] } = {};

    for (let i = 0; i < differentStableIds.length; i++) {
        let stableId = differentStableIds[i];
        stableIdData[stableId] = [];

        for (let j = 0; j < pieChartData.length; j++) {
            if (pieChartData[j].stableId === stableId) {
                stableIdData[stableId].push({
                    sampleId: pieChartData[j].sampleId,
                    stableId: pieChartData[j].stableId,
                    value: parseFloat(pieChartData[j].value),
                });
            }
        }
    }

    let tooltipData: { [key: string]: string } = {};

    differentSampleIds.forEach(sampleId => {
        let sampleTooltip = '';
        pieChartData.forEach(data => {
            if (data.sampleId === sampleId) {
                sampleTooltip += `${data.stableId}: ${data.value}\n`;
            }
        });
        tooltipData[sampleId] = sampleTooltip.trim();
    });
    const sampleOptions = differentSampleIds.map(sampleId => ({
        value: sampleId,
        label: sampleId,
    }));
    useEffect(() => {
        setStudyViewFilterFlag(true);
    }, [store.selectedSamples.result]);
    useEffect(() => {
        const stableIdColorMap: { [key: string]: string } = {};
        let colorIndex = 0;
        let formattedData = Object.keys(stableIdData).map(stableId => {
            if (!stableIdColorMap[stableId]) {
                stableIdColorMap[stableId] = colors[colorIndex % colors.length];
                colorIndex++;
            }
            return stableIdData[stableId].map(item => ({
                x: item.sampleId,
                y: item.value,
                stableId: item.stableId,
                color: stableIdColorMap[stableId],
            }));
        });
        setMap(stableIdColorMap);
        setDropdownOptions(sampleOptions);
    }, []);
    const stableIdColorMap: { [key: string]: string } = {};
    let colorIndex = 0;
    let formattedData = Object.keys(stableIdData).map(stableId => {
        if (!stableIdColorMap[stableId]) {
            stableIdColorMap[stableId] = colors[colorIndex];
            colorIndex++;
        }
        return stableIdData[stableId].map(item => ({
            x: item.sampleId,
            y: item.value,
            stableId: item.stableId,
            color: stableIdColorMap[stableId],
        }));
    });
    const tooltipArray: any[] = [];

    const rows = formattedData.length;
    const columns = formattedData[0].length;

    for (let i = 0; i < columns; i++) {
        tooltipArray[i] = {};
        for (let j = 0; j < rows; j++) {
            let eleArray = formattedData[j];
            let eleName = eleArray[i].stableId;
            let eleLabel = eleArray[i].x;
            let value = eleArray[i].y;
            tooltipArray[i][j] = { [eleName]: value };
        }
    }
    const mappedData: any = {};
    for (let i = 0; i < differentSampleIds.length; i++) {
        mappedData[differentSampleIds[i]] = tooltipArray[i] || null;
    }

    const tooltipUtilArray = () => {
        const tooltipArray: any[] = [];
        const formattedDatastate = Object.keys(stableIdData).map(stableId => {
            if (!stableIdColorMap[stableId]) {
                stableIdColorMap[stableId] = colors[colorIndex % colors.length];
                colorIndex++;
            }
            return stableIdData[stableId].map(item => ({
                x: item.sampleId,
                y: item.value,
                stableId: item.stableId,
                color: stableIdColorMap[stableId],
            }));
        });
        const rows = formattedDatastate.length;
        const columns = formattedDatastate[0].length;

        for (let i = 0; i < columns; i++) {
            tooltipArray[i] = {};
            for (let j = 0; j < rows; j++) {
                let eleArray = formattedDatastate[j];
                let eleName = eleArray[i].stableId;
                let eleLabel = eleArray[i].x;
                let value = eleArray[i].y;
                tooltipArray[i][j] = { [eleName]: value };
            }
        }
        return tooltipArray;
    };
    const updatedTooltiparray = tooltipUtilArray();

    useEffect(() => {
        setFormattedDatastate(formattedData);
        setNoOfBars(formattedData[0].length);
        let temp = formattedData[0].length * 47 + 200;
        setDynamicWidth(temp);
        setInitialWidth(temp - 30);
        const updatedTooltiparray = tooltipUtilArray();
        for (let i = 0; i < differentSampleIds.length; i++) {
            mappedData[differentSampleIds[i]] = updatedTooltiparray[i] || null;
        }

        setToolArraystate(updatedTooltiparray);
        setDropdownOptions(sampleOptions);
    }, [pieChartData]);
    useEffect(() => {
        setFormattedDatastate(formattedData);
        setNoOfBars(formattedData[0].length);
        let temp = formattedData[0].length * 47 + 200;
        setDynamicWidth(temp);
        setInitialWidth(temp - 25);
        const updatedTooltiparray = tooltipUtilArray();
        for (let i = 0; i < differentSampleIds.length; i++) {
            mappedData[differentSampleIds[i]] = updatedTooltiparray[i] || null;
        }

        setToolArraystate(updatedTooltiparray);
    }, []);
    function sortFormattedData(formattedData: any, stableIdToBeSorted: any) {
        // Step 1: Find the array corresponding to the stableIdToBeSorted
        const sortedArray = formattedData.find(
            (arr: any) => arr[0]?.stableId === stableIdToBeSorted
        );

        if (!sortedArray) {
            return formattedData;
        }
        // Step 2: Sort the array by the y value
        if (!isReverse) {
            sortedArray.sort((a: any, b: any) => a.y - b.y);
        } else {
            sortedArray.sort((a: any, b: any) => b.y - a.y);
        }
        // Step 3: Create a mapping of x values to the sorted order
        const sortedOrder = sortedArray.map((item: any) => item.x);

        // Step 4: Reorder all arrays in formattedData to match the sorted order
        const reorderedData = formattedData.map((arr: any) => {
            const xToDataMap = arr.reduce((acc: any, item: any) => {
                acc[item.x] = item;
                return acc;
            }, {});

            return sortedOrder.map((xValue: any) => xToDataMap[xValue]);
        });
        return reorderedData;
    }
    function sortToolTipData(formattedData: any) {
        const tooltipArraytemp: any[] = [];

        const rows = formattedData.length;
        const columns = formattedData[0].length;

        for (let i = 0; i < columns; i++) {
            tooltipArraytemp[i] = {};
            for (let j = 0; j < rows; j++) {
                let eleArray = formattedDatastate[j];
                let eleName = eleArray[i].stableId;
                let value = eleArray[i].y;
                tooltipArraytemp[i][j] = { [eleName]: value };
            }
        }
        return tooltipArraytemp;
    }

    const handleDownloadSVGWrapper = () => {
        if (chartRef.current) {
            const svg = chartRef.current.querySelector('svg');
            if (svg) {
                handleDownloadSVG({ current: svg });
            } else {
            }
        } else {
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
        const columnsToDownload = ['sampleId', 'stableId', 'value'];
        const headers = columnsToDownload;
        const dataRows = pieChartData.map((item: any) =>
            columnsToDownload.map(column => item[column]).join('\t')
        );
        const dataString = [headers.join('\t'), ...dataRows].join('\n');
        const blob = new Blob([dataString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'stacked_bar_chart_data.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        if (stackEntity !== '') {
            const sortedFormattedData = sortFormattedData(
                formattedDatastate,
                stackEntity
            );
            let temp = 0;
            let found = false;

            for (let i = 0; i < sortedFormattedData.length; i++) {
                let dataArray = sortedFormattedData[i];
                if (dataArray[0].stableId === stackEntity) {
                    temp = i;
                    found = true;
                    break;
                }
            }

            if (found) {
                [sortedFormattedData[0], sortedFormattedData[temp]] = [
                    sortedFormattedData[temp],
                    sortedFormattedData[0],
                ];
            }

            setFormattedDatastate(sortedFormattedData);
        }
    }, [stackEntity, isReverse]);

    useEffect(() => {
        let timeout: any;
        if (isHovered || tooltipHovered) {
            setIsVisible(true);
            clearTimeout(timeout);
        } else if (isVisible) {
            timeout = setTimeout(() => {
                setIsVisible(false);
            }, 2000);
        }
        return () => clearTimeout(timeout);
    }, [isHovered, tooltipHovered]);
    const [tooltipStyle, setTooltipStyle] = useState({});
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const filteredFormattedData = formattedDatastate.map((elem: any) =>
            selectedSamples.length > 0
                ? elem.filter((dataItem: any) =>
                      selectedSamples.includes(dataItem.x)
                  )
                : elem
        );
        if (filteredFormattedData && filteredFormattedData.length > 0) {
            setNoOfBars(filteredFormattedData[0].length);
            let temp = filteredFormattedData[0].length * 47 + 200;
            setDynamicWidth(temp);
            setInitialWidth(temp - 25);
        }
    }, [selectedSamples, formattedDatastate]);
    return (
        <>
            <div style={{ textAlign: 'center', position: 'relative' }}>
                <div
                    style={{
                        display: 'flex',

                        alignItems: 'flex-start',

                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            flex: '0 0 80%',
                            height: 'auto',
                        }}
                    >
                        <div
                            ref={chartRef}
                            style={{
                                width: 'max-content',
                            }}
                        >
                            <VictoryChart
                                domainPadding={20}
                                height={isHorizontal ? dynamicWidth : 600}
                                width={isHorizontal ? 980 : dynamicWidth}
                                padding={{
                                    top: 10,
                                    bottom: isHorizontal ? 40 : 160,
                                    left: isHorizontal ? 210 : 60,
                                    right: 120,
                                }}
                            >
                                <VictoryAxis
                                    style={{
                                        tickLabels: {
                                            fontSize: 13,
                                            angle: isHorizontal ? 0 : 45,
                                            textAnchor: isHorizontal
                                                ? 'end'
                                                : 'start',
                                        },
                                    }}
                                    dependentAxis={isHorizontal ? true : false}
                                    domain={[0, 1]}
                                />
                                <VictoryAxis
                                    style={{
                                        tickLabels: {
                                            fontSize: 13,
                                            padding: 5,
                                        },
                                    }}
                                    dependentAxis={isHorizontal ? false : true}
                                    tickValues={[0, 0.25, 0.5, 0.75, 1]}
                                    domain={[0, 1]}
                                />

                                <VictoryStack>
                                    {formattedDatastate.map(
                                        (elem: any, i: any) => {
                                            const filteredFormattedData =
                                                selectedSamples.length > 0
                                                    ? elem.filter(
                                                          (dataItem: any) =>
                                                              selectedSamples.includes(
                                                                  dataItem.x
                                                              )
                                                      )
                                                    : elem;

                                            return (
                                                <VictoryBar
                                                    key={i}
                                                    data={filteredFormattedData}
                                                    horizontal={
                                                        isHorizontal
                                                            ? true
                                                            : false
                                                    }
                                                    barWidth={25}
                                                    style={{
                                                        data: {
                                                            fill: (d: any) =>
                                                                d.color,
                                                        },
                                                    }}
                                                    labelComponent={
                                                        <VictoryTooltip />
                                                    }
                                                    events={[
                                                        {
                                                            target: 'data',
                                                            eventHandlers: {
                                                                onMouseOver: (
                                                                    evt: React.MouseEvent<
                                                                        any
                                                                    >,
                                                                    props: any
                                                                ) => {
                                                                    const target = evt.target as HTMLElement;
                                                                    const rect = target.getBoundingClientRect();
                                                                    const x =
                                                                        rect.left +
                                                                        window.scrollX +
                                                                        rect.width /
                                                                            2;
                                                                    const y =
                                                                        rect.top +
                                                                        window.scrollY;
                                                                    setTooltipPosition(
                                                                        { x, y }
                                                                    );
                                                                    setIsHovered(
                                                                        true
                                                                    );
                                                                    setCurrentTooltipData(
                                                                        mappedData[
                                                                            props
                                                                                .datum
                                                                                .x
                                                                        ]
                                                                    );
                                                                    setHoveredSampleId(
                                                                        props
                                                                            .datum
                                                                            .x
                                                                    );
                                                                },
                                                                onMouseOut: () => {
                                                                    setIsHovered(
                                                                        false
                                                                    );
                                                                },
                                                            },
                                                        },
                                                    ]}
                                                />
                                            );
                                        }
                                    )}
                                </VictoryStack>
                            </VictoryChart>
                        </div>
                        ;
                    </div>
                    <div style={{ flex: '0 0 2%', position: 'relative' }}>
                        <div
                            style={{
                                position: 'absolute',
                                top: 20,

                                cursor: 'pointer',
                                border: '1px solid lightgrey',
                                padding: '5px',
                                borderRadius: '4px',
                                transition: 'background-color 0.3s ease',
                            }}
                            onMouseEnter={() => setDownloadOptionsVisible(true)}
                            onMouseLeave={() =>
                                setDownloadOptionsVisible(false)
                            }
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
                                            borderBottom: '1px solid #ddd',
                                            transition:
                                                'background-color 0.3s ease',
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
                </div>
            </div>
            <div
                style={
                    isHorizontal
                        ? { marginLeft: '130px' }
                        : {
                              width: dynamicWidth > 600 ? dynamicWidth : 600,
                              marginLeft: '90px',
                          }
                }
            >
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {Object.keys(map).map(cellName => (
                        <div
                            key={cellName}
                            style={{
                                marginTop: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                marginRight: '10px',
                                marginBottom: '10px',
                            }}
                        >
                            <div
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: map[cellName],
                                    marginRight: '5px',
                                }}
                            ></div>
                            <span>{cellName}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default StackedBarChart;
