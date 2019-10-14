export default function makesvgelement(tag:string, attrs:any) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) {
        if (attrs.hasOwnProperty(k)) {
            el.setAttribute(k, attrs[k]);
        }
    }
    return el;
}