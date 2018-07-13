import fileDownload from 'react-file-download';
import request from "superagent";

function base64ToArrayBuffer(base64:string) {
    var binaryString = window.atob(base64);
    var binaryLen = binaryString.length;
    var bytes = new Uint8Array(binaryLen);
    for (var i = 0; i < binaryLen; i++) {
        var ascii = binaryString.charCodeAt(i);
        bytes[i] = ascii;
    }
    return bytes;
}

export default function (filename:string, svg:Element, servletUrl?: string) {
    const svgelement = "<?xml version='1.0'?>"+(new XMLSerializer()).serializeToString(svg);
    const two_megabyte_limit = 2000000;
    if (svgelement.length > two_megabyte_limit) {
        return false;
    }
    const servletURL = servletUrl || "svgtopdf.do";
    const filetype = "pdf_data";
    request.post(servletURL)
        .type('form')
        .send({ filetype, svgelement})
        .end((err, res)=>{
            if (!err && res.ok) {
                fileDownload(base64ToArrayBuffer(res.text), filename);
            }
        });
    return true;
}