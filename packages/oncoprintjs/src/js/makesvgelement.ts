export default function makesvgelement(tag: string, attrs: any) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) {
        // skip absent attributes - setAttribute would stringify them, putting
        // literal fill="undefined" into the exported document
        if (attrs[k] === undefined || attrs[k] === null) {
            continue;
        }
        el.setAttribute(k, attrs[k]);
    }
    return el;
}
