import { assert } from 'chai';
import { frameStatusStyle } from './frameStatusStyle';

describe('frameStatusStyle', () => {
    it('in-frame is solid green', () => {
        const s = frameStatusStyle('inFrame');
        assert.equal(s.label, 'In-frame');
        assert.isFalse(s.hollow);
        assert.equal(s.fill, '#2f9e44');
    });

    it('out-of-frame is solid grey', () => {
        const s = frameStatusStyle('outOfFrame');
        assert.equal(s.label, 'Out-of-frame');
        assert.isFalse(s.hollow);
        assert.equal(s.fill, '#868e96');
    });

    it('unknown is hollow', () => {
        const s = frameStatusStyle('unknown');
        assert.equal(s.label, 'Unknown');
        assert.isTrue(s.hollow);
    });
});
