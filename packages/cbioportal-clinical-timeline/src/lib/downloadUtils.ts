import { jsPDF } from 'jspdf';
import svg2pdf from 'svg2pdf.js';

export function saveAsSvg(svgElement: SVGElement, filename: string): void {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    downloadBlob(blob, `${filename}.svg`);
}

export function saveAsPng(svgElement: SVGElement, filename: string): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const svgString = new XMLSerializer().serializeToString(svgElement);

    // Implementation using canvas to convert SVG to PNG
    // TODO: [Canvas drawing implementation here]

    canvas.toBlob(blob => {
        if (blob) downloadBlob(blob, `${filename}.png`);
    });
}

export function saveAsPdf(svgElement: SVGElement, filename: string): void {
    const width = svgElement.width.baseVal.value;
    const height = svgElement.height.baseVal.value;

    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height]);
    svg2pdf(svgElement, pdf, { width, height }).then(() =>
        pdf.save(`${filename}.pdf`)
    );
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
