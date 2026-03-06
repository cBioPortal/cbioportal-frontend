export function zScoreToColor(zScore: number): string {
    // Clamp to [-3, 3] for color mapping
    const clamped = Math.max(-3, Math.min(3, zScore));
    const normalized = (clamped + 3) / 6; // 0 to 1

    if (normalized < 0.5) {
        // Blue to white (negative z-scores)
        const t = normalized * 2; // 0 to 1
        const r = Math.round(t * 255);
        const g = Math.round(t * 255);
        const b = 255;
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        // White to red (positive z-scores)
        const t = (normalized - 0.5) * 2; // 0 to 1
        const r = 255;
        const g = Math.round(255 * (1 - t));
        const b = Math.round(255 * (1 - t));
        return `rgb(${r}, ${g}, ${b})`;
    }
}

export function formatZScore(zScore: number): string {
    const formatted = Math.abs(zScore).toFixed(2);
    if (zScore > 0) {
        return `+${formatted}`;
    } else if (zScore < 0) {
        return `-${formatted}`;
    }
    return formatted;
}

export function cnaToLabel(alteration: number): string {
    switch (alteration) {
        case -2:
            return 'HOMDEL';
        case -1:
            return 'HETLOSS';
        case 1:
            return 'GAIN';
        case 2:
            return 'AMP';
        default:
            return '';
    }
}

export function cnaToColor(alteration: number): string {
    switch (alteration) {
        case -2:
            return '#2387aa'; // deep blue for HOMDEL
        case -1:
            return '#88c4d8'; // light blue for HETLOSS
        case 1:
            return '#e7a1a1'; // pink for GAIN
        case 2:
            return '#c1272d'; // red for AMP
        default:
            return '#aaaaaa';
    }
}
