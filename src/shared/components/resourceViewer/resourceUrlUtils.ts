/** A PDF cannot be framed directly in every browser, so it goes through Google's viewer. */
export function buildPDFUrl(url: string): string {
    return `https://docs.google.com/viewerng/viewer?url=${url}?pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
}
