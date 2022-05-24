import { ServerConfigHelpers, UrlParamPair, pairMatchesPath } from './config';
import { assert } from 'chai';

describe('ServerConfigHelpers', () => {
    describe('parses config data format', () => {
        it('parses two entrees and arrays from comma delimitted list', () => {
            const testString =
                'TCGA PanCancer Atlas Studies#*pan_can_atlas*;Curated set of non-redundant studies#acbc_mskcc_2015,acc_tcga_pan_can_atlas_2018';
            const output = ServerConfigHelpers.parseConfigFormat(testString);
            assert.deepEqual(output, {
                'TCGA PanCancer Atlas Studies': ['*pan_can_atlas*'],
                'Curated set of non-redundant studies': [
                    'acbc_mskcc_2015',
                    'acc_tcga_pan_can_atlas_2018',
                ],
            });
        });

        it('handles trailing semicolon', () => {
            const testString =
                'TCGA PanCancer Atlas Studies#*pan_can_atlas*;Curated set of non-redundant studies#acbc_mskcc_2015,acc_tcga_pan_can_atlas_2018;';
            const output = ServerConfigHelpers.parseConfigFormat(testString);
            assert.deepEqual(output, {
                'TCGA PanCancer Atlas Studies': ['*pan_can_atlas*'],
                'Curated set of non-redundant studies': [
                    'acbc_mskcc_2015',
                    'acc_tcga_pan_can_atlas_2018',
                ],
            });
        });
    });

    describe('pairMatchesPath', () => {
        it('should match exact match', () => {
            const pair: UrlParamPair = { url: '/foo/', params: { a: '1' } };
            const ans = pairMatchesPath(pair, '/foo/bar/baz', { a: '1' });

            assert.isTrue(ans);
        });

        it('should match exact match with empty params', () => {
            const pair: UrlParamPair = { url: '/foo/', params: {} };
            const ans = pairMatchesPath(pair, '/foo/bar/baz', {});

            assert.isTrue(ans);
        });

        it('should match exact match with extra params', () => {
            const pair: UrlParamPair = { url: '/foo/', params: { a: '1' } };
            const ans = pairMatchesPath(pair, '/foo/bar/baz', {
                a: '1',
                b: '1',
            });

            assert.isTrue(ans);
        });

        it('should not match exact when missing all params', () => {
            const pair: UrlParamPair = { url: '/foo/', params: { a: '1' } };
            const ans = pairMatchesPath(pair, '/foo/bar/baz', {});

            assert.isFalse(ans);
        });

        it('should not match exact when missing some params', () => {
            const pair: UrlParamPair = {
                url: '/foo/',
                params: { a: '1', b: '1' },
            };
            const ans = pairMatchesPath(pair, '/foo/bar/baz', { a: '1' });

            assert.isFalse(ans);
        });

        it('should not match when param has different val', () => {
            const pair: UrlParamPair = { url: '/foo/', params: { a: '1' } };
            const ans = pairMatchesPath(pair, '/foo/bar/baz', { a: '2' });

            assert.isFalse(ans);
        });
    });
});
