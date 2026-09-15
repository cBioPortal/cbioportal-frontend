import {
    agentEndpoint,
    applyWsiAgentTransform,
    buildWsiAgentSvgSelector,
    parseWsiAgentSseBlock,
    WsiAgentViewport,
} from './wsiAgent';

const viewport: WsiAgentViewport = {
    image_width: 100,
    image_height: 50,
    image_transform: [2, 0, 10, 0, 4, 20],
    slide_width: 1000,
    slide_height: 800,
};

describe('wsi agent helpers', () => {
    it('parses streamed SSE events', () => {
        expect(
            parseWsiAgentSseBlock(
                'event: message.delta\ndata: {"text":"hello"}'
            )
        ).toEqual({ event: 'message.delta', data: { text: 'hello' } });
        expect(parseWsiAgentSseBlock('data: not-json')).toBeNull();
    });

    it('maps normalized viewport points through the slide transform', () => {
        expect(applyWsiAgentTransform({ x: 500, y: 500 }, viewport)).toEqual({
            x: 110,
            y: 120,
        });
    });

    it('builds whole-slide SVG selectors for rectangles and polygons', () => {
        expect(
            buildWsiAgentSvgSelector(
                'rectangle',
                [
                    { x: 0, y: 0 },
                    { x: 1000, y: 1000 },
                ],
                viewport
            )
        ).toBe('<svg><rect x="10" y="20" width="200" height="200" /></svg>');
        expect(
            buildWsiAgentSvgSelector(
                'polygon',
                [
                    { x: 0, y: 0 },
                    { x: 1000, y: 0 },
                    { x: 500, y: 1000 },
                ],
                viewport
            )
        ).toContain('<polygon points="10,20 210,20 110,220"');
    });

    it('joins the configured tile-server base and agent route', () => {
        expect(agentEndpoint('http://tiles/wsi/', '/agent/chat')).toBe(
            'http://tiles/wsi/agent/chat'
        );
    });
});
