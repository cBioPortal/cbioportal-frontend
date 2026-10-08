import { assert } from 'chai';

import { GnomadSummary } from '../model/GnomadSummary';
import { setGnomadTableData } from './GnomadUtils';

describe('GnomadUtils', () => {
    describe('missing fields in the Genome Nexus response', () => {
        it('falls back to zero when the gnomAD sub-objects are missing', () => {
            const result: { [key: string]: GnomadSummary } = {};

            setGnomadTableData('Total', {} as any, result);

            assert.equal(result['Total'].alleleCount, 0);
            assert.equal(result['Total'].alleleNumber, 0);
            assert.equal(result['Total'].homozygotes, 0);
            assert.equal(result['Total'].alleleFrequency, 0);
        });

        it('still reads the values when the sub-objects are populated', () => {
            const result: { [key: string]: GnomadSummary } = {};

            setGnomadTableData(
                'Total',
                {
                    alleleCount: { ac: 10 },
                    alleleNumber: { an: 100 },
                    homozygotes: { hom: 2 },
                    alleleFrequency: { af: 0.1 },
                } as any,
                result
            );

            assert.equal(result['Total'].alleleCount, 10);
            assert.equal(result['Total'].alleleNumber, 100);
            assert.equal(result['Total'].homozygotes, 2);
            assert.equal(result['Total'].alleleFrequency, 0.1);
        });
        it('falls back to count / total when a population frequency is missing', () => {
            const result: { [key: string]: GnomadSummary } = {};

            setGnomadTableData(
                'Total',
                {
                    alleleCount: { ac: 10 },
                    alleleNumber: { an: 100 },
                    homozygotes: { hom: 2 },
                    alleleFrequency: {},
                } as any,
                result
            );

            assert.equal(result['Total'].alleleFrequency, 0.1);
        });

        it('keeps an explicit zero frequency', () => {
            const result: { [key: string]: GnomadSummary } = {};

            setGnomadTableData(
                'Total',
                {
                    alleleCount: { ac: 10 },
                    alleleNumber: { an: 100 },
                    homozygotes: { hom: 2 },
                    alleleFrequency: { af: 0 },
                } as any,
                result
            );

            assert.equal(result['Total'].alleleFrequency, 0);
        });
    });
});
