import { UIMessage } from 'ai';
import { screenshotParts } from './report';

// The report is model-written, so the file may load nothing from elsewhere: a
// remote URL in it could carry the report off-site when the file is opened.
const CONTENT_SECURITY_POLICY =
    "default-src 'none'; img-src data:; style-src 'unsafe-inline'";

const STYLE = `
body { margin: 0; print-color-adjust: exact; color: #1f2328; font: 15px/1.6 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
main { max-width: 820px; margin: 0 auto; padding: 32px 24px; }
h1, h2, h3, h4 { line-height: 1.3; margin: 1.6em 0 0.6em; }
h1 { font-size: 1.8em; margin-top: 0; }
h2 { font-size: 1.4em; padding-bottom: 0.2em; border-bottom: 1px solid #d1d9e0; }
h3 { font-size: 1.15em; }
a { color: #0969da; }
table { border-collapse: collapse; margin: 1em 0; display: block; overflow-x: auto; }
th, td { border: 1px solid #d1d9e0; padding: 6px 12px; text-align: left; vertical-align: top; }
th { background: #f6f8fa; }
code { font: 0.9em ui-monospace, SFMono-Regular, Menlo, monospace; background: #f6f8fa; padding: 0.1em 0.3em; border-radius: 4px; }
pre { background: #f6f8fa; padding: 12px 16px; border-radius: 6px; overflow-x: auto; }
pre code { background: none; padding: 0; }
blockquote { margin: 1em 0; padding-left: 1em; border-left: 3px solid #d1d9e0; color: #59636e; }
figure { margin: 1.5em 0; }
figure img { max-width: 100%; border: 1px solid #d1d9e0; }
figcaption { color: #59636e; font-size: 0.9em; }
@media print {
    main { max-width: none; padding: 0; }
    table { display: table; }
    pre { white-space: pre-wrap; }
    h1, h2, h3, h4 { break-after: avoid; }
    tr, figure, pre, blockquote { break-inside: avoid; }
}
`;

const DEFAULT_TITLE = 'Research report';

// A standalone page: the rendered report, then the chat's screenshots.
export function reportHtml(rendered: Element, messages: UIMessage[]): string {
    const doc = document.implementation.createHTMLDocument(
        rendered.querySelector('h1')?.textContent?.trim() || DEFAULT_TITLE
    );
    doc.documentElement.lang = 'en';
    const csp = doc.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = CONTENT_SECURITY_POLICY;
    const charset = doc.createElement('meta');
    charset.setAttribute('charset', 'utf-8');
    const style = doc.createElement('style');
    style.textContent = STYLE;
    doc.head.prepend(charset, csp);
    doc.head.append(style);

    const main = doc.createElement('main');
    main.append(
        ...Array.from(rendered.childNodes, node => doc.importNode(node, true))
    );

    const images = screenshotParts(messages).filter(part =>
        part.url.startsWith('data:image/')
    );
    if (images.length > 0) {
        const heading = doc.createElement('h2');
        heading.textContent = 'Appendix: Captured Screenshots';
        main.append(heading);
        images.forEach((part, i) => {
            const name = part.filename ?? `Screenshot ${i + 1}`;
            const figure = doc.createElement('figure');
            const img = doc.createElement('img');
            img.src = part.url;
            img.alt = name;
            const caption = doc.createElement('figcaption');
            caption.textContent = name;
            figure.append(img, caption);
            main.append(figure);
        });
    }
    doc.body.append(main);
    return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

// Opens the browser's print dialog on the page, where Save as PDF is offered.
export function printHtml(html: string): void {
    const frame = document.createElement('iframe');
    frame.style.cssText =
        'position: fixed; right: 0; bottom: 0; width: 0; height: 0; border: 0;';
    frame.onload = () => {
        const win = frame.contentWindow;
        if (!win) return;
        win.addEventListener('afterprint', () => frame.remove());
        win.print();
    };
    frame.srcdoc = html;
    document.body.append(frame);
}
