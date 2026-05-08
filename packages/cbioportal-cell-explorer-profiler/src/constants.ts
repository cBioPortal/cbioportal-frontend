export const METHOD_COLORS: Record<string, string> = {
    obsm: '#1f77b4',
    obs: '#ff7f0e',
    geneExpression: '#2ca02c',
    var: '#d62728',
    obsColumns: '#9467bd',
    X: '#8c564b',
    uns: '#e377c2',
};

export const DEFAULT_METHOD_COLOR = '#7f7f7f';

export function getMethodColor(method: string): string {
    return METHOD_COLORS[method] || DEFAULT_METHOD_COLOR;
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatShape(shape: number[] | undefined | null): string {
    if (!shape || shape.length === 0) return '';
    return `[${shape.join(' \u00d7 ')}]`;
}
