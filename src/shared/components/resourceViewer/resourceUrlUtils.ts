const FILE_EXT_REGEX = /.+\.(.+)/;

/**
 * Lowercased extension of the URL's path, or undefined when it has none. The base makes a
 * relative URL parse instead of throwing; curated resource URLs are not guaranteed absolute.
 */
export function getFileExtension(url: string): string | undefined {
    try {
        const pathName = new URL(url, 'https://www.cbioportal.org').pathname;
        const match = pathName.match(FILE_EXT_REGEX);
        return match ? match[1].toLowerCase() : undefined;
    } catch {
        return undefined;
    }
}

/** A PDF cannot be framed directly in every browser, so it goes through Google's viewer. */
export function buildPDFUrl(url: string): string {
    return `https://docs.google.com/viewerng/viewer?url=${url}?pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
}
