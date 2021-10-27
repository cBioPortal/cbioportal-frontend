import { POINT_RADIUS, TimelineEvent } from './types';
import React from 'react';
import { getAttributeValue } from './lib/helpers';

enum Shape {
    CIRCLE = 'circle',
    SQUARE = 'square',
    TRIANGLE = 'triangle',
    DIAMOND = 'diamond',
    STAR = 'star',
    CAMERA = 'camera',
}
function getSpecifiedShapeIfExists(e: TimelineEvent) {
    const shape = getAttributeValue('STYLE_SHAPE', e);
    if (!shape) {
        return undefined;
    }
    const lcShape = shape.toLowerCase();
    switch (lcShape) {
        case 'circle':
        case 'square':
        case 'triangle':
        case 'diamond':
        case 'star':
        case 'camera':
            return lcShape as Shape;
        default:
            return undefined;
    }
}

export function renderShape(
    e: TimelineEvent,
    y: number,
    eventColorGetter: (e: TimelineEvent) => string
) {
    const shape = getSpecifiedShapeIfExists(e) || Shape.CIRCLE;
    const color = eventColorGetter(e);

    let sideLength: number;
    switch (shape) {
        case Shape.CIRCLE:
            return <circle cx="0" cy={y} r={POINT_RADIUS} fill={color} />;
        case Shape.SQUARE:
            sideLength = 0.8 * POINT_RADIUS;
            return (
                <rect
                    x={0}
                    y={y - sideLength}
                    width={2 * sideLength}
                    height={2 * sideLength}
                    fill={color}
                />
            );
        case Shape.TRIANGLE:
            sideLength = 1.3 * POINT_RADIUS;
            return (
                <polygon
                    points={`0,${y - sideLength} ${sideLength *
                        Math.sin(Math.PI / 3)},${y +
                        sideLength * Math.cos(Math.PI / 3)} ${-sideLength *
                        Math.sin(Math.PI / 3)},${y +
                        sideLength * Math.cos(Math.PI / 3)}`}
                    fill={color}
                />
            );
        case Shape.DIAMOND:
            sideLength = 0.8 * POINT_RADIUS;
            return (
                <rect
                    x={0}
                    y={y - sideLength}
                    fill={color}
                    width={2 * sideLength}
                    height={2 * sideLength}
                    style={{
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        transform: 'rotate(45deg)',
                    }}
                />
            );
        case Shape.STAR:
            sideLength = 1.3 * POINT_RADIUS;
            const angleIncrement = (2 * Math.PI) / 10;
            let points = '';
            for (let i = 0; i < 10; i++) {
                let radius;
                if (i % 2 === 0) {
                    radius = sideLength;
                } else {
                    radius = sideLength / 2;
                }
                points = `${points} ${radius *
                    Math.sin(i * angleIncrement)},${y -
                    radius * Math.cos(i * angleIncrement)}`;
            }
            return <polygon points={points} fill={color} />;
        case Shape.CAMERA:
            return (
                <g>
                    // top part
                    <rect
                        x={-2.5}
                        y={y - 4}
                        width={5}
                        height={1}
                        fill={color}
                    />
                    // body
                    <rect x={-5} y={y - 3} width={10} height={6} fill={color} />
                    // lens
                    <circle
                        fill={color}
                        stroke={'white'}
                        cx={0}
                        cy={y}
                        r={2}
                        strokeWidth={0.8}
                    />
                </g>
            );
    }
}
