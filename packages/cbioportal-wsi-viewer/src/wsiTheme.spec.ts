import { capWsiViewerHeight } from './wsiTheme';

describe('capWsiViewerHeight', () => {
    it('keeps the height in a wide window', () => {
        expect(capWsiViewerHeight(780, 1600)).toBe(780);
    });

    it('caps it at three quarters of the width in a tall window', () => {
        expect(capWsiViewerHeight(1400, 1200)).toBe(900);
    });

    it('never caps below 480px', () => {
        expect(capWsiViewerHeight(700, 400)).toBe(480);
        expect(capWsiViewerHeight(300, 400)).toBe(300);
    });
});
