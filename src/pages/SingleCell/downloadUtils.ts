// downloadUtils.ts
import { jsPDF } from 'jspdf-yworks';
import svg2pdf from 'svg2pdf.js';
import request from 'superagent';

// Function to handle SVG download
export const handleDownloadSVG = (svgRef: React.RefObject<SVGSVGElement>) => {
    if (svgRef.current) {
        const svg = svgRef.current;
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pie_chart.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// SVG to PDF conversion function
async function svgToPdfDownload(
    fileName: string,
    svg: any,
    fontUrl: string = 'FREE_SANS_PUBLIC_URL'
) {
    const width =
        svg.scrollWidth ||
        parseInt((svg.attributes.getNamedItem('width') as Attr).nodeValue!);
    const height =
        svg.scrollHeight ||
        parseInt((svg.attributes.getNamedItem('height') as Attr).nodeValue!);

    // Create a new jsPDF instance
    let direction = 'l';
    if (height > width) {
        direction = 'p';
    }
    const pdf = new jsPDF(direction, 'pt', [width, height]);

    // Provide special character support for PDF
    try {
        const fontRequest = await request.get(fontUrl);
        // Override Arial with FreeSans to display special characters
        pdf.addFileToVFS('FreeSans-normal.ttf', fontRequest.body.FreeSans);
        pdf.addFont('FreeSans-normal.ttf', 'Arial', 'normal');
    } catch (ex) {
        // We just won't embed font
    } finally {
        // Render the SVG element
        await svg2pdf(svg, pdf, {
            xOffset: 0,
            yOffset: 0,
            scale: 1,
        });
        pdf.save(fileName);
    }
}

// Function to handle PDF download using svgToPdfDownload
export const handleDownloadPDF = async (
    svgRef: React.RefObject<SVGSVGElement>
) => {
    if (svgRef.current) {
        const svg = svgRef.current;
        await svgToPdfDownload('pie_chart.pdf', svg);
    }
};
