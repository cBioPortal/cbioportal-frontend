const MIN_RENDERABLE_ANNOTATION_SIZE = 1;

export function normalizeSvgSelector(svg: string): string {
    let normalized = svg.replace(
        /<circle\s+cx="([^"]+)"\s+cy="([^"]+)"\s+r="([^"]+)"\s*\/>/g,
        (_match, cx, cy, radius) =>
            `<ellipse cx="${cx}" cy="${cy}" rx="${radius}" ry="${radius}" />`
    );
    normalized = normalized.replace(
        /<ellipse\s+cx="([^"]+)"\s+cy="([^"]+)"\s+rx="([^"]+)"\s+ry="([^"]+)"\s*\/>/g,
        (_match, cx, cy, rx, ry) => {
            const safeRadius = (value: string) =>
                Math.max(
                    MIN_RENDERABLE_ANNOTATION_SIZE,
                    Math.abs(Number(value)) || 0
                );
            return `<ellipse cx="${cx}" cy="${cy}" rx="${safeRadius(
                rx
            )}" ry="${safeRadius(ry)}" />`;
        }
    );
    return normalized.replace(
        /<line\s+x1="([^"]+)"\s+y1="([^"]+)"\s+x2="([^"]+)"\s+y2="([^"]+)"\s*\/>/g,
        (_match, x1, y1, x2, y2) => {
            if (Number(x1) !== Number(x2) || Number(y1) !== Number(y2)) {
                return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
            }
            return `<line x1="${x1}" y1="${y1}" x2="${Number(x1) +
                MIN_RENDERABLE_ANNOTATION_SIZE}" y2="${y2}" />`;
        }
    );
}
