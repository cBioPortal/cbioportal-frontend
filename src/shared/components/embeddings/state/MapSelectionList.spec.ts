import { assert } from 'chai';
import { MapSelectionList } from './MapSelectionList';
import { SELECTION_COLORS } from './MapSelection';

describe('MapSelectionList', () => {
    const keys = (...k: string[]) => new Set(k);

    it('names and colours selections in the order they are drawn', () => {
        const list = new MapSelectionList();
        list.add(keys('s1'));
        list.add(keys('s2'));
        assert.deepEqual(
            list.summaries.map(s => s.name),
            ['Selection 1', 'Selection 2']
        );
        assert.deepEqual(
            list.summaries.map(s => s.color),
            [SELECTION_COLORS[0], SELECTION_COLORS[1]]
        );
    });

    it('starts over at Selection 1 after a clear', () => {
        // Clearing is how you start again, so the numbering has to start
        // again too, rather than carrying on from the run before.
        const list = new MapSelectionList();
        list.add(keys('s1'));
        list.add(keys('s2'));
        list.clear();
        list.add(keys('s3'));
        assert.deepEqual(
            list.summaries.map(s => s.name),
            ['Selection 1']
        );
        assert.equal(list.summaries[0].color, SELECTION_COLORS[0]);
    });

    it('starts over once the last selection is removed one by one', () => {
        const list = new MapSelectionList();
        list.add(keys('s1'));
        list.add(keys('s2'));
        list.remove(list.all[0].id);
        list.remove(list.all[0].id);
        assert.isTrue(list.isEmpty);
        list.add(keys('s3'));
        assert.deepEqual(
            list.summaries.map(s => s.name),
            ['Selection 1']
        );
    });

    it('never reuses a number a chip is still showing', () => {
        const list = new MapSelectionList();
        list.add(keys('s1'));
        list.add(keys('s2'));
        list.add(keys('s3'));
        assert.deepEqual(
            list.summaries.map(s => s.name),
            ['Selection 1', 'Selection 2', 'Selection 3']
        );
    });

    it('fills the gap a removed selection leaves rather than skipping', () => {
        const list = new MapSelectionList();
        list.add(keys('s1'));
        list.add(keys('s2'));
        list.add(keys('s3'));
        list.remove(2);
        list.add(keys('s4'));
        assert.deepEqual(
            list.summaries.map(s => s.name),
            ['Selection 1', 'Selection 2', 'Selection 3']
        );
        // The refilled slot keeps slot 2's colour, and the chips stay in
        // number order however they were drawn.
        assert.deepEqual(
            list.summaries.map(s => s.color),
            [SELECTION_COLORS[0], SELECTION_COLORS[1], SELECTION_COLORS[2]]
        );
        assert.deepEqual(
            list.summaries.map(s => s.count),
            [1, 1, 1]
        );
        assert.deepEqual(Array.from(list.all[1].keys), ['s4']);
    });

    it('fills the lowest free slot when several are free', () => {
        const list = new MapSelectionList();
        list.add(keys('s1'));
        list.add(keys('s2'));
        list.add(keys('s3'));
        list.remove(1);
        list.remove(2);
        list.add(keys('s4'));
        assert.deepEqual(
            list.summaries.map(s => s.name),
            ['Selection 1', 'Selection 3']
        );
    });

    it('ignores an empty selection', () => {
        const list = new MapSelectionList();
        list.add(new Set<string>());
        assert.isTrue(list.isEmpty);
        list.add(keys('s1'));
        assert.deepEqual(
            list.summaries.map(s => s.name),
            ['Selection 1']
        );
    });

    it('unions every selection, and reports none as null', () => {
        const list = new MapSelectionList();
        assert.isNull(list.keys);
        list.add(keys('a', 'b'));
        list.add(keys('b', 'c'));
        assert.deepEqual(Array.from(list.keys!).sort(), ['a', 'b', 'c']);
    });

    it('gives a point in two selections the higher-numbered colour', () => {
        const list = new MapSelectionList();
        list.add(keys('a', 'shared'));
        list.add(keys('shared'));
        assert.equal(list.colorByKey.get('a'), SELECTION_COLORS[0]);
        assert.equal(list.colorByKey.get('shared'), SELECTION_COLORS[1]);
    });

    it('cycles colours once the palette runs out', () => {
        const list = new MapSelectionList();
        for (let i = 0; i < SELECTION_COLORS.length + 1; i++) {
            list.add(keys(`s${i}`));
        }
        const summaries = list.summaries;
        assert.equal(
            summaries[SELECTION_COLORS.length].color,
            SELECTION_COLORS[0]
        );
    });

    it('keeps each lasso as an outline in its own colour', () => {
        const square = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
        ];
        const list = new MapSelectionList();
        list.add(keys('a'), square);
        list.add(keys('b'), square);
        assert.deepEqual(
            list.outlines.map(o => o.color),
            [SELECTION_COLORS[0], SELECTION_COLORS[1]]
        );
        list.remove(list.all[0].id);
        assert.lengthOf(list.outlines, 1);
        list.clear();
        assert.lengthOf(list.outlines, 0);
    });

    it('has no outline for a selection made without a lasso', () => {
        const list = new MapSelectionList();
        list.add(keys('a'));
        list.add(keys('b'), [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
        ]);
        assert.lengthOf(list.outlines, 0);
    });

    it('renames without disturbing colour or count', () => {
        const list = new MapSelectionList();
        list.add(keys('a', 'b'));
        list.rename(list.all[0].id, 'Responders');
        assert.deepEqual(list.summaries, [
            {
                id: 1,
                name: 'Responders',
                color: SELECTION_COLORS[0],
                count: 2,
            },
        ]);
    });
});
