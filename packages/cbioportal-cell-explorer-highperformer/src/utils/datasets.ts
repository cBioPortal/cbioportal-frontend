export const STORAGE_KEY = 'highperformer:datasets';

export function loadDatasets(): string[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') || [];
    } catch {
        return [];
    }
}

export function saveDatasets(datasets: string[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
}
