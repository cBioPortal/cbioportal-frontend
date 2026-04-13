import { assert } from 'chai';
import inlineCssInSvg from './inlineCssInSvg';

function parseSvg(svgString: string): SVGElement {
    return (new DOMParser().parseFromString(svgString, 'image/svg+xml')
        .documentElement as unknown) as SVGElement;
}

describe('inlineCssInSvg', () => {
    it('returns the input unchanged when there are no <style> elements', () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect class="a"/></svg>';
        assert.equal(inlineCssInSvg(svg), svg);
    });

    it('inlines CSS rules onto matching descendants', () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            '<style>.a { fill: red; } .b { stroke: blue; }</style>' +
            '<rect class="a"/>' +
            '<rect class="b"/>' +
            '</svg>';

        const result = parseSvg(inlineCssInSvg(svg));

        assert.equal(
            result.getElementsByTagName('style').length,
            0,
            'style element should be stripped'
        );

        const rects = result.getElementsByTagName('rect');
        assert.include(rects[0].getAttribute('style') || '', 'fill: red');
        assert.include(rects[1].getAttribute('style') || '', 'stroke: blue');
    });

    it('preserves existing inline styles over rule styles for the same property', () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            '<style>.a { fill: red; stroke: black; }</style>' +
            '<rect class="a" style="fill: green;"/>' +
            '</svg>';

        const result = parseSvg(inlineCssInSvg(svg));
        const style = result
            .getElementsByTagName('rect')[0]
            .getAttribute('style') as string;

        assert.include(style, 'fill: green');
        assert.notInclude(style, 'fill: red');
        assert.include(style, 'stroke: black');
    });

    it('handles comma-separated selectors and !important', () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            '<style>.a, .b { fill: red !important; }</style>' +
            '<rect class="a" style="fill: green;"/>' +
            '<rect class="b"/>' +
            '</svg>';

        const result = parseSvg(inlineCssInSvg(svg));
        const rects = result.getElementsByTagName('rect');

        // !important rule overrides non-important inline style
        assert.include(
            rects[0].getAttribute('style') || '',
            'fill: red !important'
        );
        assert.include(
            rects[1].getAttribute('style') || '',
            'fill: red !important'
        );
    });

    it('strips CSS comments before parsing', () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            '<style>/* comment { fill: blue; } */ .a { fill: red; }</style>' +
            '<rect class="a"/>' +
            '</svg>';

        const result = parseSvg(inlineCssInSvg(svg));
        const style = result
            .getElementsByTagName('rect')[0]
            .getAttribute('style') as string;

        assert.include(style, 'fill: red');
        assert.notInclude(style, 'blue');
    });

    it('silently skips rules with invalid selectors', () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            '<style>:::invalid { fill: red; } .a { stroke: blue; }</style>' +
            '<rect class="a"/>' +
            '</svg>';

        const result = parseSvg(inlineCssInSvg(svg));
        const style = result
            .getElementsByTagName('rect')[0]
            .getAttribute('style') as string;

        assert.include(style, 'stroke: blue');
    });

    it('returns the input unchanged when DOMParser is unavailable', () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect class="a"/></svg>';
        const globalWithOptionalDomParser = globalThis as any;
        const originalDOMParser = globalWithOptionalDomParser.DOMParser;

        try {
            globalWithOptionalDomParser.DOMParser = undefined;
            assert.equal(inlineCssInSvg(svg), svg);
        } finally {
            globalWithOptionalDomParser.DOMParser = originalDOMParser;
        }
    });
});
