import { ClinicalDataPageCache } from './ClinicalDataPageCache';

describe('ClinicalDataPageCache', () => {
    it('evicts the least recently used page when full', () => {
        const cache = new ClinicalDataPageCache<string>(3);
        cache.set(0, 'page 0');
        cache.set(1, 'page 1');
        cache.set(2, 'page 2');

        expect(cache.get(0)).toBe('page 0');
        cache.set(3, 'page 3');

        expect(cache.get(0)).toBe('page 0');
        expect(cache.get(1)).toBeUndefined();
        expect(cache.get(2)).toBe('page 2');
        expect(cache.get(3)).toBe('page 3');
        expect(cache.size).toBe(3);
    });

    it('increments its version when cleared', () => {
        const cache = new ClinicalDataPageCache<string>(3);
        const initialVersion = cache.version;
        cache.set(0, 'page 0');
        cache.clear();

        expect(cache.version).toBe(initialVersion + 1);
        expect(cache.size).toBe(0);
        expect(cache.get(0)).toBeUndefined();
    });
});
