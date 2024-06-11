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
}) => {
    console.log(stackEntity, 'this is stacckentity');
    const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
    const [selectedSortingSample, setSelectedSortingSample] = useState('');

    const handleSampleSelectionChange = (selectedOptions: any) => {
        const selectedSampleIds = selectedOptions
            ? selectedOptions.map((option: any) => option.value)
            : [];
        setSelectedSamples(selectedSampleIds);
        // Log selected options
        console.log(selectedSampleIds);
    };

    console.log(pieChartData, 'piechartDaataaa');
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(
        null
    );
    const [currentTooltipData, setCurrentTooltipData] = useState([]);
    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
    const [tooltipHovered, setTooltipHovered] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [downloadOptionsVisible, setDownloadOptionsVisible] = useState<
        boolean
    >(false);
    const [formattedDatastate, setFormattedDatastate] = useState([] as any);
    const [tooltipArraystate, setToolArraystate] = useState([] as any);
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
    console.log(differentStableIds, 'differentSampleIds');
    const stableIdColorMap: { [key: string]: string } = {};
    let colorIndex = 0;
    const colorScale = [
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
        console.log(formattedDatastate, 'tiiktip');
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
        console.log(tooltipArray, 'here is 1the tooltipArray');

        return tooltipArray;
    };
    const updatedTooltiparray = tooltipUtilArray();
    console.log(updatedTooltiparray);

    useEffect(() => {
        setFormattedDatastate(formattedData);
        const updatedTooltiparray = tooltipUtilArray();
        for (let i = 0; i < differentSampleIds.length; i++) {
            mappedData[differentSampleIds[i]] = updatedTooltiparray[i] || null; // Assign null if there's no corresponding tooltipData
        }
        console.log(mappedData, '  ');

        setToolArraystate(updatedTooltiparray);
    }, []);

    console.log(formattedDatastate, 'this isformattedDatastate');

    console.log(formattedData, 'formattedData');
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
        sortedArray.sort((a: any, b: any) => a.y - b.y);

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
    const sampleOptions = differentSampleIds.map(sampleId => ({
        value: sampleId,
        label: sampleId,
    }));
    const sortingOptions = differentStableIds.map(stableId => ({
        value: stableId,
        label: stableId,
    }));
    console.log(currentTooltipData, 'current data');
    console.log(tooltipArraystate, 'current tooltip data');

    console.log(stableIdColorMap, 'this is color map');
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
        if (stackEntity != '') {
            const sortedFormattedData = sortFormattedData(
                formattedDatastate,
                stackEntity
            );
            setFormattedDatastate(sortedFormattedData);
        }
    }, [stackEntity]);

    return (
        <div style={{ textAlign: 'center', position: 'relative' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    width: '100%',
                    marginTop: '15px',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        flex: '0 0 67%',
                        textAlign: 'center',
                        height: '600px',
                    }}
                    ref={chartRef}
                >
                    <h2>
                        {dataBins.length > 0
                            ? dataBins[0].id.replace(/_/g, ' ')
                            : 'No Data'}
                    </h2>
                    <Select
                        placeholder="Select SampleId.."
                        options={sampleOptions}
                        isMulti
                        onChange={handleSampleSelectionChange}
                        value={selectedSamples.map(sampleId => ({
                            value: sampleId,
                            label: sampleId,
                        }))}
                        style={{
                            padding: '10px',
                            marginTop: '5px',
                            marginBottom: '5px',
                        }}
                    />
                    {/* <div style={{marginTop:"10px"}}>
                <Select
                placeholder="Select samples to sort..."
                options={sortingOptions}
                onChange={handleSortingSampleSelectionChange}
                value={selectedSortingSample}
                style={{ padding: "10px", marginTop: "15px", marginBottom: "5px" }}
            />
            </div> */}
                    <VictoryChart domainPadding={20} height={800} width={800}>
                        <VictoryAxis
                            style={{
                                tickLabels: { fontSize: 18, padding: 5 },
                            }}
                            dependentAxis
                            domain={[0, 1]}
                        />
                        <VictoryAxis
                            style={{
                                tickLabels: { fontSize: 18, padding: 5 },
                            }}
                            tickValues={[0, 0.25, 0.5, 0.75, 1]}
                            domain={[0, 1]}
                        />
                        <VictoryStack>
                            {formattedDatastate.map((elem: any, i: any) => {
                                const filteredFormattedData =
                                    selectedSamples.length > 0
                                        ? elem.filter((dataItem: any) =>
                                              selectedSamples.includes(
                                                  dataItem.x
                                              )
                                          )
                                        : elem;
                                console.log(
                                    filteredFormattedData,
                                    'here is formattedData'
                                );
                                return (
                                    <VictoryBar
                                        horizontal
                                        key={i}
                                        data={filteredFormattedData}
                                        barWidth={30}
                                        style={{
                                            data: {
                                                fill: (d: any) => {
                                                    // console.log(d,"dprop"); // Log the data point 'd'
                                                    return d.color; // Set the fill color based on the 'color' field in your data
                                                },
                                            },
                                        }}
                                        labelComponent={<VictoryTooltip />}
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
                                                        console.log(
                                                            props.datum,
                                                            'propss',
                                                            mappedData
                                                        );

                                                        setIsHovered(true);
                                                        setCurrentTooltipData(
                                                            mappedData[
                                                                props.datum.x
                                                            ]
                                                        );
                                                    },
                                                    onMouseOut: () => {
                                                        setIsHovered(false);
                                                    },
                                                },
                                            },
                                        ]}
                                    />
                                );
                            })}
                        </VictoryStack>
                    </VictoryChart>
                </div>
                <div style={{ flex: '0 0 2%', position: 'relative' }}>
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,

                            cursor: 'pointer',
                            border: '1px solid lightgrey',
                            padding: '5px',
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
                <div style={{ flex: '0 0 31%', position: 'relative' }}>
                    {(isHovered || tooltipHovered) && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '150px',
                                pointerEvents: 'auto',
                                margin: 'auto',
                                transition: 'opacity 0.5s ease-in-out',
                                transitionDelay: '0s',
                                backgroundColor: 'white',
                                width: '350px',
                                boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                                zIndex: 220,
                                display:
                                    isHovered || tooltipHovered
                                        ? 'block'
                                        : 'none',
                            }}
                            onMouseEnter={() => setTooltipHovered(true)}
                            onMouseLeave={() => setTooltipHovered(false)}
                        >
                            <div
                                className="custom-scrollbar"
                                style={{
                                    height: '150px',
                                    overflowY: 'auto',
                                    resize: 'both',
                                    overflow: 'auto',
                                    backgroundColor: 'white',
                                    pointerEvents: 'auto',
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
                                                                                stableIdColorMap[
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
                </div>
            </div>
        </div>
    );
};

export default StackedBarChart;
