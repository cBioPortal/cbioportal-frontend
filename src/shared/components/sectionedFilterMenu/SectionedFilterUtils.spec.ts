import { assert } from 'chai';
import {
    countOptionIds,
    getOptionSection,
    matchesSectionedFilter,
} from './SectionedFilterUtils';

describe('SectionedFilterUtils', () => {
    it('gets the section of an option', () => {
        assert.equal(getOptionSection('level:LEVEL_1'), 'level');
    });

    it('matches any selected option of a section, all or any sections', () => {
        const ids = ['a:1', 'b:2'];
        assert.isTrue(
            matchesSectionedFilter(ids, { selections: [], matchAll: true })
        );
        assert.isTrue(
            matchesSectionedFilter(ids, {
                selections: ['a:1', 'a:3'],
                matchAll: true,
            })
        );
        assert.isFalse(
            matchesSectionedFilter(ids, {
                selections: ['a:1', 'b:3'],
                matchAll: true,
            })
        );
        assert.isTrue(
            matchesSectionedFilter(ids, {
                selections: ['a:1', 'b:3'],
                matchAll: false,
            })
        );
    });

    it('counts items per option', () => {
        const counts = countOptionIds([['a:1', 'b:2'], ['a:1']]);
        assert.equal(counts.get('a:1'), 2);
        assert.equal(counts.get('b:2'), 1);
    });
});
