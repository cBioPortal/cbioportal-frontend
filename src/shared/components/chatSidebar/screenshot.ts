// Capture the current viewport for sending alongside chat-sidebar requests.
// Excludes the sidebar panel itself so the model isn't looking at its own UI.
import html2canvas from 'html2canvas';

// Anthropic recommends keeping the longest side under ~1568px to balance
// readability vs. token cost. ~1024 is plenty for an oncoprint at this scale.
const MAX_LONG_SIDE = 1024;

export async function captureViewport(): Promise<string | null> {
    try {
        const sidebar = document.querySelector(
            '.chat-sidebar-panel'
        ) as HTMLElement | null;
        const launcher = document.querySelector(
            '.chat-sidebar-launcher'
        ) as HTMLElement | null;
        const canvas = await html2canvas(document.body, {
            x: window.scrollX,
            y: window.scrollY,
            width: window.innerWidth,
            height: window.innerHeight,
            scale: 1,
            useCORS: true,
            logging: false,
            ignoreElements: el => el === sidebar || el === launcher,
        });
        return downscaleToPng(canvas, MAX_LONG_SIDE);
    } catch (err) {
        console.warn('chat-sidebar screenshot failed:', err);
        return null;
    }
}

function downscaleToPng(canvas: HTMLCanvasElement, maxSide: number): string {
    const longSide = Math.max(canvas.width, canvas.height);
    if (longSide <= maxSide) return canvas.toDataURL('image/png');
    const scale = maxSide / longSide;
    const out = document.createElement('canvas');
    out.width = Math.round(canvas.width * scale);
    out.height = Math.round(canvas.height * scale);
    const ctx = out.getContext('2d');
    if (!ctx) return canvas.toDataURL('image/png');
    ctx.drawImage(canvas, 0, 0, out.width, out.height);
    return out.toDataURL('image/png');
}
