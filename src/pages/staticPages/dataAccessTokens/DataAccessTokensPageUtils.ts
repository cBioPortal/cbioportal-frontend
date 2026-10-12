import {
    DataAccessToken,
    DataAccessTokenSummary,
} from 'cbioportal-ts-api-client';

export const DATA_ACCESS_TOKEN_FILE_NAME = 'cbioportal_data_access_token.txt';

// The API serializes token dates as 'yyyy-MM-dd HH:mm:ss' in UTC
export function parseTokenDate(date: string | undefined): Date | undefined {
    if (!date) {
        return undefined;
    }
    const parsed = new Date(date.replace(' ', 'T') + 'Z');
    return isNaN(parsed.getTime()) ? undefined : parsed;
}

export function formatTokenDate(date: string | undefined): string {
    const parsed = parseTokenDate(date);
    return parsed ? parsed.toLocaleString() : '';
}

export function isTokenExpired(
    expiration: string | undefined,
    now: Date = new Date()
): boolean {
    const parsed = parseTokenDate(expiration);
    return parsed !== undefined && parsed.getTime() < now.getTime();
}

export function getTokenFileContents(token: DataAccessToken): string {
    const lines = [`token: ${token.token}`];
    if (token.creation) {
        lines.push(`creation_date: ${token.creation}`);
    }
    if (token.expiration) {
        lines.push(`expiration_date: ${token.expiration}`);
    }
    return lines.join('\n') + '\n';
}

// Number of existing tokens that creating a new token will revoke,
// since the server drops the oldest token once the per-user limit is reached
export function getNumberOfTokensRevokedOnCreate(
    numberOfTokens: number,
    maxNumberOfTokens: number
): number {
    if (!(maxNumberOfTokens > 0) || numberOfTokens < maxNumberOfTokens) {
        return 0;
    }
    return numberOfTokens - maxNumberOfTokens + 1;
}

// Same masking as the server's token preview
export function maskToken(token: string): string {
    const n = 4;
    if (!token || token.length <= n * 2) {
        return '…';
    }
    return token.slice(0, n) + '…' + token.slice(-n);
}

export function isSummaryOfToken(
    summary: DataAccessTokenSummary,
    token: DataAccessToken
): boolean {
    return (
        summary.tokenPreview === maskToken(token.token) &&
        summary.creation === token.creation
    );
}
