import { assert } from 'chai';
import { getVafChartHeaderTickKey } from './VAFChartHeader';

describe('VAFChartHeader', () => {
    it('builds deterministic keys from tick label and offset', () => {
        assert.equal(
            getVafChartHeaderTickKey({ label: '0.5', offset: 18 }),
            '0.5:18'
        );
    });
});
