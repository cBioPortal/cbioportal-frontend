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

    // dealing with oncoprint svg (temporarily)
    _.forEach((svg as Element).childNodes, (element => {
        if ((element as Element).attributes.getNamedItem('x') !== null && (element as Element).attributes.getNamedItem('y') !== null && (element as Element).nodeName === 'g') {
            (element as Element).attributes.removeNamedItem('y');
            (element as Element).attributes.removeNamedItem('x');
        }
        _.forEach((element as ChildNode).childNodes,(child => {
            if ((child as Element).attributes.getNamedItem('x') !== null && (child as Element).attributes.getNamedItem('y') !== null  && (child as Element).nodeName === 'g') {
                (child as Element).attributes.removeNamedItem('y');
                (child as Element).attributes.removeNamedItem('x');
            }
        }))
    }));
    
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