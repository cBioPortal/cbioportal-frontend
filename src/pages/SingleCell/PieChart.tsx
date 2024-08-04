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
import { colors, PatientData } from './SingleCellStore';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { GenericAssayData } from 'cbioportal-ts-api-client';

interface ChartProps {
    singleCellStore: any;
    pieChartData: GenericAssayData[];
    store: StudyViewPageStore;
    studyViewFilterFlag: boolean;
    setStudyViewFilterFlag: (value: any) => void;
}

interface PieChartData {
    typeOfCell: string;
    percentage: number;
    color?: string;
}

interface VictoryEventProps {
    index: number;
}

const Chart: React.FC<ChartProps> = observer(
    ({
        singleCellStore,
        pieChartData,
        store,
        studyViewFilterFlag,
        setStudyViewFilterFlag,
    }) => {
        const {
            dataBins,
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
            return null;
        }
        const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
        const [tooltipHovered, setTooltipHovered] = useState<boolean>(false);
        const [downloadOptionsVisible, setDownloadOptionsVisible] = useState<
            boolean
        >(false);

        const svgRef = useRef<SVGSVGElement>(null);

        let differentPatientIds: string[] = [];
        for (let i = 0; i < pieChartData.length; i++) {
            let currentId = pieChartData[i].patientId;
            if (!differentPatientIds.includes(currentId)) {
                differentPatientIds.push(currentId);
            }
        }
        let patientData: PatientData = {};
        for (let i = 0; i < differentPatientIds.length; i++) {
            let id = differentPatientIds[i];
            patientData[id] = [];
            for (let j = 0; j < pieChartData.length; j++) {
                if (pieChartData[j].patientId === id) {
                    patientData[id].push({
                        stableId: pieChartData[j].stableId,
                        value: parseFloat(pieChartData[j].value),
                    });
                }
            }
        }
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
                    );
                    return () => clearTimeout(timeoutId);
                }
            }
        }, [isHovered, tooltipHovered, tooltipEnabled]);
        const uniqueIds: any = [
            ...new Set(
                pieChartData.map((item: any) => item.genericAssayStableId)
            ),
        ];
        const sumValues: { [key: string]: number } = {};
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
            const color = colors[index];
            return {
                typeOfCell: key,
                percentage: sumValues[key],
                color: color,
            };
        });
        useEffect(() => {
            setStudyViewFilterFlag(true);
        }, [store.selectedSamples.result]);
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
                                    colorScale={colors}
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
                            onMouseLeave={() =>
                                setDownloadOptionsVisible(false)
                            }
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
    }
);

export default Chart;
