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
                            opacity: isVisible ? 1 : 0,
                            transition:
                                'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                            backgroundColor: 'white',
                            width: '320px',
                            zIndex: 220,
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)', // Enhanced shadow for 3D effect
                            borderRadius: '10px', // Rounded corners
                            position: 'relative',
                        }}
                        onMouseEnter={() => setTooltipHovered(true)}
                        onMouseLeave={() => setTooltipHovered(false)}
                    >
                        <div
                            style={{
                                content: '""',
                                position: 'absolute',
                                left: '-10px', // Position the triangle to the left of the tooltip
                                top: '50%', // Center the triangle vertically
                                transform: 'translateY(-50%)', // Center the triangle vertically
                                width: '0',
                                height: '0',
                                borderTop: '10px solid transparent', // Triangle pointing to the right
                                borderBottom: '10px solid transparent',
                                borderRight: '10px solid rgba(0, 0, 0, 0.15)', // Color of the triangle
                                zIndex: 219, // Ensure the triangle is under the tooltip shadow
                            }}
                        ></div>
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
                                                                        textAlign:
                                                                            'center',
                                                                        width:
                                                                            '23px',
                                                                        height:
                                                                            '23px',
                                                                        backgroundColor:
                                                                            map[
                                                                                key
                                                                            ],

                                                                        borderRadius:
                                                                            '50%',
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
