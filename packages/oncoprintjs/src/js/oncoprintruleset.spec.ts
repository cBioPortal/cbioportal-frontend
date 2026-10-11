import createRuleSet, { RuleSetType } from './oncoprintruleset';

describe('gradient conditional overlays', () => {
    it('draws an overlay over gradient and null cells only when the condition matches', () => {
        const ruleSet = createRuleSet({
            type: RuleSetType.GRADIENT,
            value_key: 'value',
            value_range: [0, 1],
            value_stop_points: [0, 1],
            colors: [
                [0, 0, 0, 1],
                [255, 255, 255, 1],
            ],
            conditional_overlays: [
                {
                    condition: datum => datum.uncalled === true,
                    shapes: [
                        {
                            type: 'rectangle',
                            fill: [0, 0, 0, 0],
                            stroke: [255, 255, 255, 1],
                            'stroke-width': 2,
                            z: 1001,
                        },
                    ],
                },
            ],
        });

        const shapes = ruleSet.getSpecificShapesForDatum(
            [
                { value: 0.2, uncalled: true },
                { value: null, uncalled: true },
                { value: 0.2, uncalled: false },
                { value: null, uncalled: false },
                { value: null, uncalled: true, na: true },
            ],
            20,
            20
        );

        expect(shapes.map(cell => cell.length)).toEqual([2, 2, 1, 1, 2]);
        expect(shapes[0][1].stroke).toEqual([255, 255, 255, 1]);
        expect(shapes[1][1].stroke).toEqual([255, 255, 255, 1]);
        expect(shapes[0][1].z).toBeGreaterThan(shapes[0][0].z!);
        expect(shapes[4].some(shape => shape.z === 1001)).toBe(false);
    });
});
