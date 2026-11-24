import { assert } from 'chai';
import { EmbeddingPoint } from '../EmbeddingTypes';
import {
    EmbeddingViewportState,
    EMBEDDING_MAX_ZOOM,
    EMBEDDING_MIN_ZOOM,
} from './EmbeddingViewportState';
import { EmbeddingCategoryVisibility } from './EmbeddingCategoryVisibility';

describe('EmbeddingViewportState', () => {
    const points = [
        { x: -10, y: -10 },
        { x: 10, y: 10 },
    ] as EmbeddingPoint[];

    it('reports a move the panel makes itself', () => {
        const seen: number[] = [];
        const viewport = new EmbeddingViewportState(v => seen.push(v.zoom));
        viewport.set({
            target: [1, 2, 0],
            zoom: 3,
            minZoom: EMBEDDING_MIN_ZOOM,
            maxZoom: EMBEDDING_MAX_ZOOM,
        });
        assert.deepEqual(seen, [3]);
        assert.equal(viewport.current.zoom, 3);
    });

    it('stays silent when adopting a move made elsewhere', () => {
        const seen: number[] = [];
        const viewport = new EmbeddingViewportState(v => seen.push(v.zoom));
        viewport.adopt({
            target: [0, 0, 0],
            zoom: 7,
            minZoom: EMBEDDING_MIN_ZOOM,
            maxZoom: EMBEDDING_MAX_ZOOM,
        });
        assert.lengthOf(seen, 0, 'a followed move must not be reported back');
        assert.equal(viewport.current.zoom, 7);
    });

    it('centres on the data and keeps the zoom limits', () => {
        const viewport = new EmbeddingViewportState();
        viewport.centerOn(points);
        assert.deepEqual(viewport.current.target, [0, 0, 0]);
        assert.equal(viewport.current.minZoom, EMBEDDING_MIN_ZOOM);
        assert.equal(viewport.current.maxZoom, EMBEDDING_MAX_ZOOM);
    });

    it('leaves the view alone when there is nothing to centre on', () => {
        const viewport = new EmbeddingViewportState();
        viewport.set({
            target: [5, 5, 0],
            zoom: 2,
            minZoom: EMBEDDING_MIN_ZOOM,
            maxZoom: EMBEDDING_MAX_ZOOM,
        });
        viewport.centerOn([]);
        assert.deepEqual(viewport.current.target, [5, 5, 0]);
    });
});

describe('EmbeddingCategoryVisibility', () => {
    it('toggles one category at a time', () => {
        const visibility = new EmbeddingCategoryVisibility();
        visibility.toggle('Breast Cancer');
        assert.isTrue(visibility.hidden.has('Breast Cancer'));
        visibility.toggle('Breast Cancer');
        assert.isFalse(visibility.hidden.has('Breast Cancer'));
    });

    it('hides all, then shows all', () => {
        const visibility = new EmbeddingCategoryVisibility();
        visibility.toggleAll(['a', 'b', 'c']);
        assert.deepEqual([...visibility.hidden].sort(), ['a', 'b', 'c']);
        visibility.toggleAll(['a', 'b', 'c']);
        assert.lengthOf([...visibility.hidden], 0);
    });

    it('never hides a category another control owns', () => {
        const visibility = new EmbeddingCategoryVisibility({
            alwaysVisible: ['Sample not in this cohort'],
        });
        visibility.toggleAll(['Breast Cancer', 'Sample not in this cohort']);
        assert.deepEqual([...visibility.hidden], ['Breast Cancer']);
    });

    it('keeps such a category hidden when it was hidden on its own', () => {
        const visibility = new EmbeddingCategoryVisibility({
            alwaysVisible: ['Sample not in this cohort'],
        });
        visibility.toggle('Sample not in this cohort');
        visibility.toggleAll(['Breast Cancer', 'Sample not in this cohort']);
        assert.deepEqual([...visibility.hidden], ['Sample not in this cohort']);
    });

    it('reports a category hidden on its own, but not a hide-all', () => {
        const hidden: string[] = [];
        const visibility = new EmbeddingCategoryVisibility({
            onHide: c => hidden.push(c),
        });
        visibility.toggle('a');
        visibility.toggle('a');
        assert.deepEqual(hidden, ['a'], 'reported once, when it was hidden');
        visibility.toggleAll(['a', 'b']);
        assert.deepEqual(
            hidden,
            ['a'],
            'hide-all is one reversible click, so it drops nothing'
        );
    });
});
