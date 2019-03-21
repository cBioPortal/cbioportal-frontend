import svg2pdf from "svg2pdf.js";
import {jsPDF} from "jspdf-yworks";
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

    const font = require("shared/static-data/font.json");
    pdf.addFileToVFS("FreeSans-normal.ttf", font.FreeSans);
    pdf.addFont("FreeSans-normal.ttf", "FreeSans", "normal");

    // render the svg element
    svg2pdf(svg, pdf, {
        xOffset: 0,
        yOffset: 0,
        scale: 1
    });
    pdf.save(fileName);
}

export function svgToPdfData(svg: Element) : string{
    const width = svg.scrollWidth || parseInt((svg.attributes.getNamedItem('width') as Attr).nodeValue!), height = svg.scrollHeight || parseInt((svg.attributes.getNamedItem('height') as Attr).nodeValue!);
    // create a new jsPDF instance
    
    let direction = 'l';
    if (height > width) {
        direction = 'p';
    }

    const pdf = new jsPDF(direction, 'pt', [width, height]);

    // render the svg element
    svg2pdf(svg, pdf, {
        xOffset: 0,
        yOffset: 0,
        scale: 1
    });
    // return the svg data, we don't need the header
    pdf.save("");
    return pdf.output('dataurlstring');
}

export async function svgToPdfPromise(svg:Element) {
    const res = await svgToPdfData(svg);

    if(res) {
        return "";
    }
}