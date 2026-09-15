import { WsiAnnotationController } from './wsiAnnotationController';
import { createOSDAnnotator } from '@annotorious/openseadragon';

jest.mock('@annotorious/openseadragon', () => ({
    createOSDAnnotator: jest.fn(),
    W3CImageFormat: jest.fn(() => ({})),
}));

function apiAnnotation(
    id: string,
    version = 1,
    label = id,
    layer = 'Default',
    type = '#3b82f6'
) {
    return {
        id,
        body: { label, comment: layer, type },
        target: {
            selector: {
                type: 'FragmentSelector',
                value: 'xywh=pixel:1,2,3,4',
            },
        },
        version,
        created_by: 'user',
    };
}

describe('WsiAnnotationController', () => {
    const token = jest.fn().mockResolvedValue('annotation-token');

    beforeEach(() => {
        jest.restoreAllMocks();
        token.mockClear();
        window.localStorage.clear();
        global.fetch = jest.fn() as typeof fetch;
    });

    it('sends the annotation capability on API requests', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => [apiAnnotation('a1')],
        } as Response);
        const controller = new WsiAnnotationController(
            'https://tiles.example',
            'study1',
            token
        );

        controller.beginSlide('slide1');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(token).toHaveBeenCalledTimes(1);
        const request = (global.fetch as jest.Mock).mock.calls[0];
        expect(request[0]).toContain('study_id=study1');
        expect(request[1].headers.get('Authorization')).toBe(
            'Bearer annotation-token'
        );
        expect(controller.annotations[0].id).toBe('a1');
    });

    it('ignores an out-of-order response from a previous slide', async () => {
        let resolveFirst!: (response: Response) => void;
        let resolveSecond!: (response: Response) => void;
        jest.spyOn(global, 'fetch')
            .mockImplementationOnce(
                () =>
                    new Promise(resolve => {
                        resolveFirst = resolve;
                    })
            )
            .mockImplementationOnce(
                () =>
                    new Promise(resolve => {
                        resolveSecond = resolve;
                    })
            );
        const controller = new WsiAnnotationController(
            'https://tiles.example',
            'study1',
            token
        );

        controller.beginSlide('slide1');
        controller.beginSlide('slide2');
        await new Promise(resolve => setTimeout(resolve, 0));
        resolveSecond({
            ok: true,
            json: async () => [apiAnnotation('new')],
        } as Response);
        await new Promise(resolve => setTimeout(resolve, 0));
        resolveFirst({
            ok: true,
            json: async () => [apiAnnotation('old')],
        } as Response);
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(
            controller.annotations.map(annotation => annotation.id)
        ).toEqual(['new']);
    });

    it('reports an unauthorized annotation load without exposing partial data', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: false,
            status: 401,
        } as Response);
        const controller = new WsiAnnotationController(
            'https://tiles.example',
            'study1',
            token
        );

        controller.beginSlide('slide1');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(controller.loading).toBe(false);
        expect(controller.annotations).toEqual([]);
        expect(controller.error).toBe('Unable to load annotations.');
    });

    it('stores the server version after an update', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => apiAnnotation('a1', 2, 'renamed'),
        } as Response);
        const controller = new WsiAnnotationController(
            'https://tiles.example',
            'study1',
            token
        );
        (controller as any).annotations = [
            (controller as any).fromApi(apiAnnotation('a1', 1), 'slide1'),
        ];
        (controller as any).slideId = 'slide1';

        await (controller as any).updateAnnotation(
            (controller as any).annotations[0]
        );

        expect(controller.annotations[0].version).toBe(2);
        expect((global.fetch as jest.Mock).mock.calls[0][1].body).toContain(
            '"version":1'
        );
    });

    it('applies the active layer and color and auto-labels native shapes', async () => {
        const handlers: Record<string, (...args: any[]) => void> = {};
        const annotator = {
            on: jest.fn((name: string, handler: (...args: any[]) => void) => {
                handlers[name] = handler;
            }),
            setVisible: jest.fn(),
            setAnnotations: jest.fn(),
            setFilter: jest.fn(),
            setStyle: jest.fn(),
            setDrawingEnabled: jest.fn(),
            setEnabled: jest.fn(),
        };
        (createOSDAnnotator as jest.Mock).mockReturnValue(annotator);
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => apiAnnotation('saved', 1, 'Tumor 1'),
        } as Response);
        const controller = new WsiAnnotationController(
            'https://tiles.example',
            'study1',
            token
        );
        (controller as any).slideId = 'slide1';
        controller.addLayer('Tumor');
        controller.setActiveNamedColor('Tumor', '#ef4444');
        const viewerElement = document.createElement('div');
        controller.attachViewer({ element: viewerElement }, {}, 'slide1');
        jest.spyOn(
            controller as any,
            'imagePoint'
        ).mockImplementation((x: number, y: number) => ({ x, y }));

        controller.setTool('ellipse');
        viewerElement.dispatchEvent(
            new MouseEvent('pointerdown', { clientX: 10, clientY: 20 })
        );
        viewerElement.dispatchEvent(
            new MouseEvent('pointermove', { clientX: 30, clientY: 50 })
        );
        expect(controller.customDrawPreview).toMatchObject({
            tool: 'ellipse',
            start: { x: 10, y: 20 },
            current: { x: 30, y: 50 },
        });
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(controller.customDrawPreview).toBeNull();

        handlers.createAnnotation({
            id: 'client-1',
            body: [],
            target: {
                source: 'slide1',
                selector: {
                    type: 'FragmentSelector',
                    value: 'xywh=pixel:1,2,3,4',
                },
            },
        });
        await new Promise(resolve => setTimeout(resolve, 0));

        const payload = JSON.parse(
            (global.fetch as jest.Mock).mock.calls[0][1].body
        );
        expect(payload.body).toEqual({
            label: 'Tumor 1',
            comment: 'Tumor',
            type: 'Tumor|#ef4444',
        });
        expect(controller.activeTool).toBeNull();
    });

    it('creates rectangles by drag and polygons by clicking points', async () => {
        const annotator = {
            on: jest.fn(),
            setVisible: jest.fn(),
            setAnnotations: jest.fn(),
            setFilter: jest.fn(),
            setStyle: jest.fn(),
            setDrawingEnabled: jest.fn(),
            cancelDrawing: jest.fn(),
        };
        (createOSDAnnotator as jest.Mock).mockReturnValue(annotator);
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => apiAnnotation('saved'),
        } as Response);
        const controller = new WsiAnnotationController(
            'https://tiles.example',
            'study1',
            token
        );
        (controller as any).slideId = 'slide1';
        const viewerElement = document.createElement('div');
        const annotationCanvas = document.createElement('canvas');
        annotationCanvas.className = 'a9s-gl-canvas';
        viewerElement.appendChild(annotationCanvas);
        controller.attachViewer({ element: viewerElement }, {}, 'slide1');
        jest.spyOn(
            controller as any,
            'imagePoint'
        ).mockImplementation((x: number, y: number) => ({ x, y }));

        const pointer = (type: string, x: number, y: number) =>
            viewerElement.dispatchEvent(
                new MouseEvent(type, {
                    bubbles: true,
                    button: 0,
                    clientX: x,
                    clientY: y,
                })
            );

        const dragTools = [
            ['rectangle', '<rect'],
            ['ellipse', '<ellipse'],
            ['circle', '<ellipse'],
            ['line', '<line'],
        ] as const;
        for (const [tool] of dragTools) {
            controller.setTool(tool);
            pointer('pointerdown', 10, 20);
            pointer('pointermove', 60, 80);
            pointer('pointerup', 60, 80);
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(controller.activeTool).toBeNull();
            expect(viewerElement.style.cursor).toBe('');
            expect(annotationCanvas.style.pointerEvents).toBe('auto');
        }

        controller.setTool('polygon');
        for (const [x, y] of [
            [100, 100],
            [160, 100],
            [160, 160],
            [100, 100],
        ]) {
            pointer('pointerdown', x, y);
            pointer('pointerup', x, y);
        }
        await new Promise(resolve => setTimeout(resolve, 0));

        const requests = (global.fetch as jest.Mock).mock.calls.map(call =>
            JSON.parse(call[1].body)
        );
        expect(requests).toHaveLength(5);
        dragTools.forEach(([, selectorTag], index) => {
            expect(requests[index].target.selector.value).toContain(
                selectorTag
            );
        });
        expect(requests[2].target.selector.value).toContain('rx="25" ry="25"');
        expect(requests[4].target.selector.value).toContain('<polygon');
        expect(controller.activeTool).toBeNull();
        expect(viewerElement.style.cursor).toBe('');
        expect(annotationCanvas.style.pointerEvents).toBe('auto');
    });

    it('removes hidden layers from the Annotorious overlay', () => {
        const annotator = {
            on: jest.fn(),
            setVisible: jest.fn(),
            setAnnotations: jest.fn(),
            setStyle: jest.fn(),
            setDrawingEnabled: jest.fn(),
            cancelSelected: jest.fn(),
        };
        (createOSDAnnotator as jest.Mock).mockReturnValue(annotator);
        const controller = new WsiAnnotationController(
            'https://tiles.example',
            'study1',
            token
        );
        (controller as any).slideId = 'slide1';
        (controller as any).annotations = [
            (controller as any).fromApi(apiAnnotation('default-1'), 'slide1'),
            (controller as any).fromApi(
                apiAnnotation(
                    'tumor-1',
                    1,
                    'Tumor 1',
                    'Tumor',
                    'Tumor|#ef4444'
                ),
                'slide1'
            ),
        ];

        controller.attachViewer(
            { element: document.createElement('div') },
            {},
            'slide1'
        );
        const visibleAnnotationIds = () => {
            const calls = annotator.setAnnotations.mock.calls;
            return calls[calls.length - 1][0].map(
                (annotation: { id: string }) => annotation.id
            );
        };
        expect(visibleAnnotationIds()).toEqual(['default-1', 'tumor-1']);

        (controller as any).showAnnotationTooltip(
            (controller as any).annotations[1],
            new MouseEvent('click', { clientX: 10, clientY: 20 })
        );
        expect(controller.annotationTooltip?.layerName).toBe('Tumor');

        controller.toggleLayerVisibility('Tumor');
        expect(controller.visibleAnnotationCount).toBe(1);
        expect(visibleAnnotationIds()).toEqual(['default-1']);
        expect(annotator.cancelSelected).toHaveBeenCalledTimes(1);
        expect(controller.annotationTooltip).toBeNull();

        controller.toggleLayerVisibility('Tumor');
        expect(controller.visibleAnnotationCount).toBe(2);
        expect(visibleAnnotationIds()).toEqual(['default-1', 'tumor-1']);
    });

    it('keeps a hidden layer out of the overlay after annotations reload', async () => {
        const annotator = {
            on: jest.fn(),
            setVisible: jest.fn(),
            setAnnotations: jest.fn(),
            setStyle: jest.fn(),
            setDrawingEnabled: jest.fn(),
            cancelSelected: jest.fn(),
        };
        (createOSDAnnotator as jest.Mock).mockReturnValue(annotator);
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => [
                apiAnnotation('default-1'),
                apiAnnotation(
                    'tumor-1',
                    1,
                    'Tumor 1',
                    'Tumor',
                    'Tumor|#ef4444'
                ),
            ],
        } as Response);
        const controller = new WsiAnnotationController(
            'https://tiles.example',
            'study1',
            token
        );
        controller.toggleLayerVisibility('Tumor');
        controller.beginSlide('slide1');
        controller.attachViewer(
            { element: document.createElement('div') },
            {},
            'slide1'
        );

        await new Promise(resolve => setTimeout(resolve, 0));

        const calls = annotator.setAnnotations.mock.calls;
        expect(
            calls[calls.length - 1][0].map(
                (annotation: { id: string }) => annotation.id
            )
        ).toEqual(['default-1']);
        expect(controller.visibleAnnotationCount).toBe(1);
    });
});
