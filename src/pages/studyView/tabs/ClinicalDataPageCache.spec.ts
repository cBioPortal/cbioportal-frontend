import { ClinicalDataPageCache } from './ClinicalDataPageCache';

describe('ClinicalDataPageCache', () => {
    it('evicts the least recently used block when full', () => {
        const cache = new ClinicalDataPageCache<string>(3);
        cache.set('query', 0, 'page 0');
        cache.set('query', 1, 'page 1');
        cache.set('query', 2, 'page 2');

        expect(cache.get('query', 0)).toBe('page 0');
        cache.set('query', 3, 'page 3');

        expect(cache.get('query', 0)).toBe('page 0');
        expect(cache.get('query', 1)).toBeUndefined();
        expect(cache.get('query', 2)).toBe('page 2');
        expect(cache.get('query', 3)).toBe('page 3');
        expect(cache.size).toBe(3);
    });

    it('increments its version when cleared', () => {
        const cache = new ClinicalDataPageCache<string>(3);
        cache.set('query', 0, 'page 0');
        const versionBeforeClear = cache.version;
        cache.clear();

        expect(cache.version).toBe(versionBeforeClear + 1);
        expect(cache.size).toBe(0);
        expect(cache.get('query', 0)).toBeUndefined();
    });

    it('clears pages when the query context changes', () => {
        const cache = new ClinicalDataPageCache<string>(3);
        cache.set('first', 0, 'first page');
        const version = cache.version;

        expect(cache.get('second', 0)).toBeUndefined();
        expect(cache.version).toBe(version + 1);
        expect(cache.size).toBe(0);
    });
});
