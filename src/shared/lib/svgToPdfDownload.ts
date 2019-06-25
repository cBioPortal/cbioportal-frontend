import svg2pdf from "svg2pdf.js";
import {jsPDF} from "jspdf-yworks";
import font from "FreeSans.json";
import _ from "lodash";

function base64ToArrayBuffer(base64:string) {
    const binaryString = window.atob(base64);
    const binaryLen = binaryString.length;
    const bytes = new Uint8Array(binaryLen);
    for (let i = 0; i < binaryLen; i++) {
        const ascii = binaryString.charCodeAt(i);
        bytes[i] = ascii;
    }
    return bytes;
}

export default function svgToPdfDownload(fileName: string, svg: any) {
    const width = svg.scrollWidth || parseInt((svg.attributes.getNamedItem('width') as Attr).nodeValue!), height = svg.scrollHeight || parseInt((svg.attributes.getNamedItem('height') as Attr).nodeValue!);

    // create a new jsPDF instance
    let direction = 'l';
    if (height > width) {
        direction = 'p';
    }
    const pdf = new jsPDF(direction, 'pt', [width, height]);

    // override Arial with FreeSans to display special charactors
    pdf.addFileToVFS("FreeSans-normal.ttf", font.FreeSans);
    pdf.addFont("FreeSans-normal.ttf", "Arial", "normal");

    // render the svg element
    svg2pdf(svg, pdf, {
        xOffset: 0,
        yOffset: 0,
        scale: 1
    });
    
    pdf.save(fileName);
}