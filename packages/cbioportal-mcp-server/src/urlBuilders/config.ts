/**
 * Configuration for URL building
 */
export interface UrlConfig {
    baseUrl: string;
    protocol: string;
}

let config: UrlConfig = {
    baseUrl: process.env.CBIOPORTAL_BASE_URL || 'www.cbioportal.org',
    protocol: 'https:',
};

export function getConfig(): UrlConfig {
    return config;
}

export function setConfig(newConfig: Partial<UrlConfig>): void {
    config = { ...config, ...newConfig };
}

export function trimTrailingSlash(str: string): string {
    return str.replace(/\/$/g, '');
}
