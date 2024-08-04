import React, { useState, useEffect, useRef } from 'react';
import { VictoryPie, VictoryTooltip } from 'victory';
import './styles.css';
import { observer } from 'mobx-react-lite';
import singleCellStore, {
    SampleOption,
    colors,
    PatientData,
} from './SingleCellStore';
interface VictoryEventProps {
    index: number;
}

const PieToolTip: React.FC = observer(() => {
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

    const svgRef = useRef<SVGSVGElement>(null);
    // Set to store unique patient IDs
    let differentPatientIds: string[] = [];

    for (let i = 0; i < pieChartData.length; i++) {
        let currentId = pieChartData[i].patientId;
        if (!differentPatientIds.includes(currentId)) {
            differentPatientIds.push(currentId);
        }
    }
    let patientData: PatientData = {};

    // Iterate over unique patient IDs
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
        ...new Set(pieChartData.map((item: any) => item.genericAssayStableId)),
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

    return (
        <div>
            <div style={{ position: 'relative' }}>
                <div
                    style={{
                        pointerEvents: 'auto',
                        opacity: tooltipEnabled
                            ? tooltipVisible
                                ? 1
                                : 0
                            : isHovered || tooltipHovered
                            ? 1
                            : 0,
                        transition: 'opacity 0.5s ease-in-out',
                        transitionDelay: '0s',
                        backgroundColor: 'white',
                        width: '400px',
                        marginRight: '10px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                        borderRadius: '10px',
                        zIndex: 220,
                        padding: '10px',
                        transform: 'translateZ(0)',
                        position: 'relative',
                    }}
                    onMouseEnter={() => setTooltipHovered(true)}
                    onMouseLeave={() => setTooltipHovered(false)}
                >
                    <div
                        style={{
                            content: '""',
                            position: 'absolute',
                            left: '-10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '0',
                            height: '0',
                            borderTop: '10px solid transparent',
                            borderBottom: '10px solid transparent',
                            borderRight: '10px solid rgba(0, 0, 0, 0.15)',
                            zIndex: 219,
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
                            pointerEvents: 'auto',
                            borderRadius: '10px',
                        }}
                    >
                        <table
                            style={{
                                borderCollapse: 'collapse',
                                width: '100%',
                                textAlign: 'center',
                                borderRadius: '10px',
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            padding: '8px',
                                            backgroundColor: '#f0f0f0',
                                            borderRadius: '10px 10px 0 0',
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
                                                    borderRadius: '50%',
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
