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

interface DataItem {
    stableId: string;
    value: number;
}
interface DataBin {
    id: string;
    count: number;
    end?: number;
    start?: number;
    specialValue?: string;
}

interface PatientData {
    [key: string]: DataItem[];
}

interface StackedBarChartProps {
    pieChartData: any[];
    dataBins: DataBin[];
    stackEntity: any;
    studyIdToStudy: any;
    hoveredSampleId: any;
    setHoveredSampleId: (value: any) => void;
    currentTooltipData: { [key: string]: { [key: string]: React.ReactNode } };
    setCurrentTooltipData: (value: any) => void;
    map: { [key: string]: string };
    setMap: (value: any) => void;
    dynamicWidth: any;
    setDynamicWidth: (value: any) => void;
    setInitialWidth: (value: any) => void;
    isHorizontal: any;
    setIsHorizontal: (value: any) => void;
    isVisible: any;
    setIsVisible: (value: any) => void;
    tooltipHovered: any;
    setTooltipHovered: (value: any) => void;
    selectedSamples: any;
    setSelectedSamples: (value: any) => void;
    dropdownOptions: any;
    setDropdownOptions: (value: any) => void;
    isReverse: any;
}

interface BarDatum {
    sampleId: string;
    stableId: string;
    value: number;
}

interface datachange {
    sampleId: string;
    stableId: string;
    value: number;
    color: string;
}

interface VictoryEventProps {
    index: number;
}

const StackedBarChart: React.FC<StackedBarChartProps> = ({
    pieChartData,
    dataBins,
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
}) => {
    // const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
    // const [hoveredSampleId, setHoveredSampleId] = useState<string[]>([]);
    // const [isVisible, setIsVisible] = useState(false);
    // const [map, setMap] = useState<{ [key: string]: string }>({});
    console.log(map, 'hereisMap');
    const [selectedSortingSample, setSelectedSortingSample] = useState('');
    // const [isHorizontal, setIsHorizontal] = useState(true);
    const handleSampleSelectionChange = (selectedOptions: any) => {
        const selectedSampleIds = selectedOptions
            ? selectedOptions.map((option: any) => option.value)
            : [];
        setSelectedSamples(selectedSampleIds);
        // Log selected options
        console.log(selectedSampleIds);
    };

    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(
        null
    );
    // const [currentTooltipData, setCurrentTooltipData] = useState([]);
    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
    // const [tooltipHovered, setTooltipHovered] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [downloadOptionsVisible, setDownloadOptionsVisible] = useState<
        boolean
    >(false);
    const [formattedDatastate, setFormattedDatastate] = useState([] as any);
    const [tooltipArraystate, setToolArraystate] = useState([] as any);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [noOfBars, setNoOfBars] = useState(0);
    // const [dynamicWidth,setDynamicWidth]=useState(0);
    const chartRef = useRef<HTMLDivElement>(null);

    let differentSampleIds: string[] = [];
    let differentStableIds: string[] = [];
    // useEffect(() => {
    //   if (pieChartData && pieChartData.length > 0) {

    //     console.log(pieChartData,"this is piechartData sorted")
    //     setLoading(false);
    // }

    // }, [pieChartData]);

    // if (loading) {
    //     return <div>Loading...</div>; // You can replace this with a spinner or any other loading indicator
    // }
    console.log(tooltipPosition.y, 'tooltipposition');
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
    // console.log(updatedPiechartData, 'updatedPiechartDataupdatedPiechartData');

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

    let stableIdData: { [key: string]: BarDatum[] } = {};

    for (let i = 0; i < differentStableIds.length; i++) {
        let stableId = differentStableIds[i];
        stableIdData[stableId] = [];

        for (let j = 0; j < pieChartData.length; j++) {
            if (pieChartData[j].stableId === stableId) {
                stableIdData[stableId].push({
                    sampleId: pieChartData[j].sampleId,
                    stableId: pieChartData[j].stableId,
                    value: parseFloat(pieChartData[j].value), // Ensure the value is a number
                });
            }
        }
    }
    // console.log(stableIdData, 'stableIdDatastableIdData');

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
    // console.log(differentStableIds, 'differentSampleIds');

    // const [stableIdColorMap, setStableIdColorMap] = useState<{ [key: string]: string }>({});
    const sampleOptions = differentSampleIds.map(sampleId => ({
        value: sampleId,
        label: sampleId,
    }));
    useEffect(() => {
        const stableIdColorMap: { [key: string]: string } = {};

        let colorIndex = 0;
        const colorScale = [
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

        let formattedData = Object.keys(stableIdData).map(stableId => {
            if (!stableIdColorMap[stableId]) {
                stableIdColorMap[stableId] =
                    colorScale[colorIndex % colorScale.length];
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
    const colorScale = [
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

    let formattedData = Object.keys(stableIdData).map(stableId => {
        if (!stableIdColorMap[stableId]) {
            stableIdColorMap[stableId] = colorScale[colorIndex];
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
        mappedData[differentSampleIds[i]] = tooltipArray[i] || null; // Assign null if there's no corresponding tooltipData
    }

    const tooltipUtilArray = () => {
        const tooltipArray: any[] = [];

        const formattedDatastate = Object.keys(stableIdData).map(stableId => {
            if (!stableIdColorMap[stableId]) {
                stableIdColorMap[stableId] =
                    colorScale[colorIndex % colorScale.length];
                colorIndex++;
            }
            return stableIdData[stableId].map(item => ({
                x: item.sampleId,
                y: item.value,
                stableId: item.stableId,
                color: stableIdColorMap[stableId],
            }));
        });
        // console.log(formattedDatastate, 'tiiktip');
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
        // console.log(tooltipArray, 'here is 1the tooltipArray');

        return tooltipArray;
    };
    const updatedTooltiparray = tooltipUtilArray();
    // console.log(updatedTooltiparray);

    useEffect(() => {
        setFormattedDatastate(formattedData);
        setNoOfBars(formattedData[0].length);
        let temp = formattedData[0].length * 47;
        console.log(formattedData[0].length, 'ilteredFormattedData.length22');

        setDynamicWidth(temp);
        setInitialWidth(temp - 100);
        const updatedTooltiparray = tooltipUtilArray();
        for (let i = 0; i < differentSampleIds.length; i++) {
            mappedData[differentSampleIds[i]] = updatedTooltiparray[i] || null; // Assign null if there's no corresponding tooltipData
        }

        setToolArraystate(updatedTooltiparray);
    }, []);
    console.log(noOfBars, 'here are no of bars');

    function sortFormattedData(formattedData: any, stableIdToBeSorted: any) {
        // Step 1: Find the array corresponding to the stableIdToBeSorted

        const sortedArray = formattedData.find(
            (arr: any) => arr[0]?.stableId === stableIdToBeSorted
        );

        if (!sortedArray) {
            console.error(
                `StableId ${stableIdToBeSorted} not found in formattedData.`
            );
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
    // Example usage
    // const stableIdToBeSorted = "Astrocyte";
    // const sortedFormattedData = sortFormattedData(formattedData, stableIdToBeSorted);
    // console.log(sortedFormattedData,"sortedFormattedData");
    // formattedData=sortedFormattedData;

    const handleDownloadSVGWrapper = () => {
        if (chartRef.current) {
            const svg = chartRef.current.querySelector('svg');
            if (svg) {
                console.log('SVG Element found:', svg);
                handleDownloadSVG({ current: svg });
            } else {
                console.log('SVG Element not found within chartRef');
            }
        } else {
            console.log('chartRef is not defined');
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
    // const sampleOptions = differentSampleIds.map(sampleId => ({
    //     value: sampleId,
    //     label: sampleId,
    // }));
    const sortingOptions = differentStableIds.map(stableId => ({
        value: stableId,
        label: stableId,
    }));

    const handleSortingSampleSelectionChange = (selectedOption: any) => {
        setSelectedSortingSample(selectedOption);
        const sortedFormattedData = sortFormattedData(
            formattedDatastate,
            selectedOption.value
        );
        setFormattedDatastate(sortedFormattedData);

        const updatedTooltiparray = sortToolTipData(formattedDatastate);
        setToolArraystate(updatedTooltiparray);
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
                // Swap the first array with the array at index temp
                [sortedFormattedData[0], sortedFormattedData[temp]] = [
                    sortedFormattedData[temp],
                    sortedFormattedData[0],
                ];
            }

            console.log(sortedFormattedData, 'this is sortedData');
            setFormattedDatastate(sortedFormattedData);
        }
    }, [stackEntity, isReverse]);

    console.log(formattedDatastate, stackEntity, 'this is formattedState');

    useEffect(() => {
        let timeout: any;
        if (isHovered || tooltipHovered) {
            setIsVisible(true);
            clearTimeout(timeout);
        } else if (isVisible) {
            timeout = setTimeout(() => {
                setIsVisible(false);
            }, 2000); // Tooltip will remain visible for 3 seconds after hover ends
        }
        return () => clearTimeout(timeout);
    }, [isHovered, tooltipHovered]);
    const [tooltipStyle, setTooltipStyle] = useState({});
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        // Calculate filteredFormattedData based on selectedSamples
        const filteredFormattedData = formattedDatastate.map((elem: any) =>
            selectedSamples.length > 0
                ? elem.filter((dataItem: any) =>
                      selectedSamples.includes(dataItem.x)
                  )
                : elem
        );

        // Log filteredFormattedData for debugging (optional)
        console.log('Filtered and formatted data:', filteredFormattedData);

        // Update noOfBars state to the length of filteredFormattedData
        if (filteredFormattedData && filteredFormattedData.length > 0) {
            setNoOfBars(filteredFormattedData[0].length);
            console.log(
                filteredFormattedData.length,
                'filteredFormattedData.length'
            );
            let temp = filteredFormattedData[0].length * 47 + 150;
            setDynamicWidth(temp);
            setInitialWidth(temp - 100);
        }
    }, [selectedSamples, formattedDatastate]);
    return (
        <>
            <div style={{ textAlign: 'center', position: 'relative' }}>
                {/* <button onClick={toggleAxes} style={{ marginBottom: '10px' }}>Swap Axes</button> */}

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
                        {/* <Select
                            placeholder="Select SampleId.."
                            options={dropdownOptions}
                            isMulti
                            onChange={handleSampleSelectionChange}
                            value={selectedSamples.map((sampleId:any) => ({
                                value: sampleId,
                                label: sampleId,
                            }))}
                            style={{
                                padding: '10px',
                                marginTop: '5px',
                                marginBottom: '5px',
                                width: '350px',
                            }}
                        /> */}
                        <div
                            ref={chartRef}
                            style={{
                                width: 'max-content',
                            }}
                        >
                            <VictoryChart
                                domainPadding={20}
                                height={isHorizontal ? dynamicWidth : 600}
                                width={isHorizontal ? 800 : dynamicWidth}
                                padding={{
                                    top: 10,
                                    bottom: isHorizontal ? 60 : 150,
                                    left: isHorizontal ? 190 : 60,
                                    right: 110,
                                }} // Adjust chart padding as needed
                            >
                                {/* Y-Axis (dependentAxis) */}
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

                                {/* X-Axis (independentAxis) */}
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

                    {/* <div style={{ flex: '0 0 18%', position: 'relative' }}>
                    {(isVisible || tooltipHovered) && (
                        <div
                        style={{
                            position: 'absolute',
                            top: `${tooltipPosition.y}px`,
                            pointerEvents: 'auto',
                            transform: 'translateX(-420px)',
                            margin: 'auto',
                            transition:
                                'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                            backgroundColor: 'white',
                            width: '350px',
                            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                            zIndex: 220,
                            opacity: isVisible ? 1 : 0,
                        }}

                            onMouseEnter={() => setTooltipHovered(true)}
                            onMouseLeave={() => setTooltipHovered(false)}
                        >
                            <div
                                className="custom-scrollbar"
                                style={{
                                    height: 'max-content',
                                    overflowY: 'auto',
                                    resize: 'both',
                                    overflow: 'auto',
                                    backgroundColor: 'white',
                                    pointerEvents: 'auto',
                                }}
                            >
                                <h3
                                    style={{
                                        marginTop: '125px',
                                        paddingTop: '7px',
                                    }}
                                >
                                    {hoveredSampleId ? hoveredSampleId : ''}
                                </h3>
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
                                                    padding: '8px',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                Color
                                            </th>
                                            <th
                                                style={{
                                                    padding: '8px',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                Type of Cell
                                            </th>
                                            <th
                                                style={{
                                                    padding: '8px',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                Value
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(currentTooltipData).map(
                                            ([index, item]) => (
                                                <tr key={index}>
                                                    {Object.entries(item).map(
                                                        ([key, value]) => (
                                                            <React.Fragment
                                                                key={key}
                                                            >
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            '8px',
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            width:
                                                                                '23px',
                                                                            height:
                                                                                '23px',
                                                                            backgroundColor:
                                                                                map[
                                                                                    key
                                                                                ],
                                                                            textAlign:
                                                                                'center',
                                                                        }}
                                                                    ></div>
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            '8px',
                                                                    }}
                                                                >
                                                                    {key}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            '8px',
                                                                    }}
                                                                >
                                                                    {
                                                                        value as React.ReactNode
                                                                    }
                                                                </td>
                                                            </React.Fragment>
                                                        )
                                                    )}
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div> */}
                </div>
            </div>
            <div
                style={
                    isHorizontal
                        ? { marginLeft: '80px' }
                        : {
                              width: dynamicWidth > 600 ? dynamicWidth : 600,
                              marginLeft: '80px',
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
