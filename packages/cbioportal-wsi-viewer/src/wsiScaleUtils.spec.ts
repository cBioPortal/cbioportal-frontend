import {
    chooseScaleBar,
    formatMagnification,
    nativeObjectivePower,
} from './wsiScaleUtils';

describe('chooseScaleBar', () => {
    it('picks a round length that fits on screen', () => {
        // 0.5 µm/px at 1:1: 60 px is 30 µm, so the first round length is 50 µm.
        expect(chooseScaleBar(0.5)).toEqual({ widthPx: 100, label: '50 µm' });
    });

    it('switches to millimetres from 1000 µm', () => {
        // Zoomed out: 20 µm per screen pixel.
        expect(chooseScaleBar(20)).toEqual({ widthPx: 100, label: '2 mm' });
    });

    it('keeps the bar between 60 and 150 px across scales', () => {
        for (const umPerPx of [0.013, 0.25, 0.9, 3.3, 47, 512]) {
            const bar = chooseScaleBar(umPerPx)!;
            expect(bar.widthPx).toBeGreaterThanOrEqual(60);
            expect(bar.widthPx).toBeLessThanOrEqual(150);
        }
    });

    it('has no bar without a usable scale', () => {
        expect(chooseScaleBar(0)).toBeUndefined();
        expect(chooseScaleBar(NaN)).toBeUndefined();
        expect(chooseScaleBar(-1)).toBeUndefined();
    });
});

describe('nativeObjectivePower', () => {
    it('prefers the recorded objective power', () => {
        expect(
            nativeObjectivePower({
                objective_power: 40,
                mpp: { x: 0.5, y: 0.5 },
            })
        ).toBe(40);
    });

    it('estimates it from the resolution', () => {
        expect(nativeObjectivePower({ mpp: { x: 0.5, y: 0.5 } })).toBe(20);
    });

    it('is unknown without either', () => {
        expect(nativeObjectivePower({})).toBeUndefined();
        expect(nativeObjectivePower(null)).toBeUndefined();
    });
});

describe('formatMagnification', () => {
    it('labels the on-screen magnification', () => {
        expect(formatMagnification(20, 1)).toBe('20×');
        expect(formatMagnification(20, 0.21)).toBe('4.2×');
        expect(formatMagnification(40, 0.025)).toBe('1.0×');
    });

    it('is unknown without an objective power or zoom', () => {
        expect(formatMagnification(undefined, 1)).toBeUndefined();
        expect(formatMagnification(20, 0)).toBeUndefined();
    });
});
