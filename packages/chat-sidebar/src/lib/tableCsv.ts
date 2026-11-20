// Serializes a rendered markdown table to CSV.
//
// Reads the DOM rather than the markdown source because the source is not
// available at the point the table is rendered, and the DOM is already the
// authoritative view of what the user is looking at. The {headers, rows} shape
// mirrors Streamdown's TableData so this can be swapped for its exported
// helpers if the renderer is ever migrated.

export interface TableData {
    headers: string[];
    rows: string[][];
}

const cellText = (cell: Element): string =>
    (cell.textContent ?? '').replace(/\s+/g, ' ').trim();

export function extractTableData(table: HTMLTableElement): TableData {
    const headers = Array.from(table.querySelectorAll('thead th')).map(
        cellText
    );
    const bodyRows = table.querySelectorAll('tbody tr');
    // A table with no thead puts its first row in tbody; treat it as data
    // rather than inventing headers for it.
    const rows = Array.from(bodyRows).map(row =>
        Array.from(row.querySelectorAll('td, th')).map(cellText)
    );
    return { headers, rows };
}

function escapeCell(value: string, separator: string): string {
    if (
        value.includes(separator) ||
        value.includes('"') ||
        value.includes('\n') ||
        value.includes('\r')
    ) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export function tableDataToCsv(data: TableData, separator = ','): string {
    const lines = [];
    if (data.headers.length > 0) lines.push(data.headers);
    lines.push(...data.rows);
    return lines
        .map(line => line.map(c => escapeCell(c, separator)).join(separator))
        .join('\n');
}
