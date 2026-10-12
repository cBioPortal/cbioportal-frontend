import { assert } from 'chai';
import {
    getNumberOfTokensRevokedOnCreate,
    getTokenFileContents,
    isSummaryOfToken,
    isTokenExpired,
    maskToken,
    parseTokenDate,
} from './DataAccessTokensPageUtils';

describe('DataAccessTokensPageUtils', () => {
    describe('parseTokenDate', () => {
        it('parses API dates as UTC', () => {
            assert.equal(
                parseTokenDate('2026-10-07 21:30:05')!.toISOString(),
                '2026-10-07T21:30:05.000Z'
            );
        });
        it('returns undefined for missing or malformed dates', () => {
            assert.isUndefined(parseTokenDate(undefined));
            assert.isUndefined(parseTokenDate(''));
            assert.isUndefined(parseTokenDate('not a date'));
        });
    });

    describe('isTokenExpired', () => {
        const now = new Date('2026-10-07T12:00:00Z');
        it('is true for an expiration in the past', () => {
            assert.isTrue(isTokenExpired('2026-10-07 11:59:59', now));
        });
        it('is false for an expiration in the future', () => {
            assert.isFalse(isTokenExpired('2026-10-07 12:00:01', now));
        });
        it('is false when expiration is unknown', () => {
            assert.isFalse(isTokenExpired(undefined, now));
        });
    });

    describe('getNumberOfTokensRevokedOnCreate', () => {
        it('revokes nothing below the limit', () => {
            assert.equal(getNumberOfTokensRevokedOnCreate(0, 1), 0);
            assert.equal(getNumberOfTokensRevokedOnCreate(4, 5), 0);
        });
        it('revokes the oldest token at the limit', () => {
            assert.equal(getNumberOfTokensRevokedOnCreate(1, 1), 1);
            assert.equal(getNumberOfTokensRevokedOnCreate(5, 5), 1);
        });
        it('revokes down to the limit when above it', () => {
            assert.equal(getNumberOfTokensRevokedOnCreate(3, 1), 3);
        });
        it('revokes nothing when the limit is unknown', () => {
            assert.equal(getNumberOfTokensRevokedOnCreate(3, NaN), 0);
            assert.equal(getNumberOfTokensRevokedOnCreate(3, 0), 0);
        });
    });

    describe('getTokenFileContents', () => {
        it('formats the token file', () => {
            assert.equal(
                getTokenFileContents({
                    token: 'abc',
                    username: 'user',
                    creation: '2026-10-07 12:00:00',
                    expiration: '2026-11-06 12:00:00',
                }),
                'token: abc\ncreation_date: 2026-10-07 12:00:00\nexpiration_date: 2026-11-06 12:00:00\n'
            );
        });
    });

    describe('maskToken', () => {
        it('keeps the first and last four characters', () => {
            assert.equal(
                maskToken('3f2a9c1e-0000-4000-8000-00000000b7d4'),
                '3f2a…b7d4'
            );
        });
        it('hides short tokens entirely', () => {
            assert.equal(maskToken('abcdefgh'), '…');
        });
    });

    describe('isSummaryOfToken', () => {
        const token = {
            token: '3f2a9c1e-0000-4000-8000-00000000b7d4',
            username: 'user',
            creation: '2026-10-07 12:00:00',
            expiration: '2026-11-06 12:00:00',
        };
        const summary = {
            id: 'id',
            tokenPreview: '3f2a…b7d4',
            username: 'user',
            creation: '2026-10-07 12:00:00',
            expiration: '2026-11-06 12:00:00',
        };
        it('matches the summary of the same token', () => {
            assert.isTrue(isSummaryOfToken(summary, token));
        });
        it('does not match a different token', () => {
            assert.isFalse(
                isSummaryOfToken(
                    { ...summary, tokenPreview: 'aaaa…bbbb' },
                    token
                )
            );
            assert.isFalse(
                isSummaryOfToken(
                    { ...summary, creation: '2026-10-07 12:00:01' },
                    token
                )
            );
        });
    });
});
