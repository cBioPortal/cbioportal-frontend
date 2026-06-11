import * as React from 'react';
import useAppStore from '../store/useAppStore';
import { COLOR_SCALES } from '../utils/colors';

export default function ContinuousLegend() {
    const expressionRange = useAppStore(s => s.expressionRange);
    const colorScaleName = useAppStore(s => s.colorScaleName);

    if (!expressionRange) return null;

    const scale = COLOR_SCALES[colorScaleName] || COLOR_SCALES.viridis;
    // Sample 5 evenly spaced stops for the CSS gradient
    const stops = [0, 0.25, 0.5, 0.75, 1].map(t => {
        const idx = t * (scale.length - 1);
        const lo = Math.floor(idx);
        const hi = Math.min(lo + 1, scale.length - 1);
        const frac = idx - lo;
        const r = Math.round(
            scale[lo][0] + (scale[hi][0] - scale[lo][0]) * frac
        );
        const g = Math.round(
            scale[lo][1] + (scale[hi][1] - scale[lo][1]) * frac
        );
        const b = Math.round(
            scale[lo][2] + (scale[hi][2] - scale[lo][2]) * frac
        );
        return `rgb(${r}, ${g}, ${b})`;
    });

    const gradient = `linear-gradient(to right, ${stops.join(', ')})`;

    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, marginBottom: 4, color: '#888' }}>
                {colorScaleName.charAt(0).toUpperCase() +
                    colorScaleName.slice(1)}
            </div>
            <div
                style={{
                    height: 12,
                    borderRadius: 3,
                    background: gradient,
                }}
            />
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    marginTop: 2,
                }}
            >
                <span>{expressionRange.min.toFixed(2)}</span>
                <span>{expressionRange.max.toFixed(2)}</span>
            </div>
        </div>
    );
}
