import {
    VictoryStack,
    VictoryBar,
    VictoryChart,
    VictoryAxis,
    VictoryTooltip,
} from 'victory';
import React, { useState, useEffect, useRef } from 'react';
import { handleDownloadSVG, handleDownloadPDF } from './downloadUtils';
import Select from 'react-select';
import _ from 'lodash';
import { Link } from 'react-router-dom';

interface StackToolTipProps {
    hoveredSampleId: any;
    setHoveredSampleId: (value: any) => void;
    currentTooltipData: { [key: string]: { [key: string]: React.ReactNode } };
    setCurrentTooltipData: (value: any) => void;
    map: { [key: string]: string };
    setMap: (value: any) => void;
    isVisible: any;
    setIsVisible: (value: any) => void;
    tooltipHovered: any;
    setTooltipHovered: (value: any) => void;
    studyIdToStudy: any;
}

const StackToolTip: React.FC<StackToolTipProps> = ({
    hoveredSampleId,
    setHoveredSampleId,
    currentTooltipData,
    setCurrentTooltipData,
    map,
    setMap,
    isVisible,
    setIsVisible,
    tooltipHovered,
    setTooltipHovered,
    studyIdToStudy,
}) => {
    const url = `/patient?sampleId=${hoveredSampleId}&studyId=${studyIdToStudy}`;

    return (
        <>
            {(isVisible || tooltipHovered) && (
                <div>
                    <div
                        style={{
                            pointerEvents: 'auto',
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
                                    textAlign: 'center',
                                }}
                            >
                                <Link
                                    to={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {hoveredSampleId ? hoveredSampleId : ''}
                                </Link>
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
                </div>
            )}
        </>
    );
};

export default StackToolTip;
