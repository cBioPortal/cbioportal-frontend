import { assert } from 'chai';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { getGA4Instance, trackQuery } from './tracking';

describe('tracking', () => {
    afterEach(() => {
        delete getBrowserWindow().gtag;
    });

    it('does not throw when GA4 tracking was not initialized', () => {
        assert.doesNotThrow(() =>
            trackQuery(['study_es_0'], 'TP53', ['TP53'], false)
        );
    });

    it('sends events to gtag when GA4 tracking was initialized', () => {
        const calls: any[][] = [];
        getBrowserWindow().gtag = (...args: any[]) => calls.push(args);
        trackQuery(['study_es_0'], 'TP53', ['TP53'], false);
        assert.equal(calls.length, 1);
        assert.equal(calls[0][1], 'resultsViewQuery');
        assert.equal(getGA4Instance(), getBrowserWindow().gtag);
    });
});
