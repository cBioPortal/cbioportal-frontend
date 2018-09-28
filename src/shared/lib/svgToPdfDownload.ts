import fileDownload from 'react-file-download';
import {default as request, Request} from "superagent";
import {buildCBioPortalPageUrl} from "../api/urls";

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

export default function (filename:string, svg:Element, servletUrl?: string) {
    const req = svgToPdfRequest(svg, servletUrl);

    if (!req) {
       return false;
    }

    req.end((err, res)=>{
        if (!err && res.ok) {
            fileDownload(base64ToArrayBuffer(res.text), filename);
        }
    });

    return true;
}

export function svgToPdfRequest(svg:Element, servletUrl?: string): Request|undefined {
    const svgelement = "<?xml version='1.0'?>"+replaceUnicodeChars((new XMLSerializer()).serializeToString(svg));
    const two_megabyte_limit = 2000000;

    if (svgelement.length > two_megabyte_limit) {
        return undefined;
    }

    const servletURL = servletUrl || buildCBioPortalPageUrl("svgtopdf.do");
    const filetype = "pdf_data";

    return request.post(servletURL)
        .type('form')
        .send({filetype, svgelement});
}

export async function svgToPdfPromise(svg:Element, servletUrl?: string) {
    const res = await svgToPdfRequest(svg, servletUrl);

    if(res && res.ok) {
        return base64ToArrayBuffer(res.text);
    }
}

// TODO add more characters if needed
function replaceUnicodeChars(svg: string) {
    return svg
        .replace(/≤/g, "&lt;=")
        .replace(/≥/g, "&gt;=");
}