export type WsiAgentActionStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'completed'
    | 'failed'
    | 'expired';

export interface WsiAgentViewport {
    image_data_url?: string;
    image_width?: number;
    image_height?: number;
    image_transform?: [number, number, number, number, number, number];
    slide_width: number;
    slide_height: number;
    center_x?: number;
    center_y?: number;
    zoom?: number;
}

export interface WsiAgentContext {
    study_id: string;
    patient_id: string;
    sample_id?: string;
    slide_id: string;
    stain_name?: string;
    match_level?: string;
    filters: Record<string, unknown>;
    slide_metadata: Record<string, unknown>;
    patient_context: Record<string, unknown>;
    existing_annotations: Array<Record<string, unknown>>;
    viewport: WsiAgentViewport;
}

export interface WsiAgentProposal {
    id: string;
    session_id: string;
    action_type:
        | 'create_annotation'
        | 'update_annotation'
        | 'delete_annotation'
        | 'viewer_action';
    study_id: string;
    slide_id: string;
    payload: Record<string, any>;
    status: WsiAgentActionStatus;
    created_at: string;
    decided_at?: string;
    outcome?: { success: boolean; detail?: string };
}

export interface WsiAgentSseEvent {
    event: string;
    data: any;
}

export function parseWsiAgentSseBlock(block: string): WsiAgentSseEvent | null {
    let event = 'message';
    const dataLines: string[] = [];
    block.split(/\r?\n/).forEach(line => {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    });
    if (!dataLines.length) return null;
    try {
        return { event, data: JSON.parse(dataLines.join('\n')) };
    } catch (_) {
        return null;
    }
}

export function applyWsiAgentTransform(
    normalized: { x: number; y: number },
    viewport: WsiAgentViewport
): { x: number; y: number } {
    const imageWidth = viewport.image_width || viewport.slide_width;
    const imageHeight = viewport.image_height || viewport.slide_height;
    const u = (normalized.x / 1000) * imageWidth;
    const v = (normalized.y / 1000) * imageHeight;
    const transform = viewport.image_transform;
    if (!transform) {
        return {
            x: (normalized.x / 1000) * viewport.slide_width,
            y: (normalized.y / 1000) * viewport.slide_height,
        };
    }
    return {
        x: transform[0] * u + transform[1] * v + transform[2],
        y: transform[3] * u + transform[4] * v + transform[5],
    };
}

export function buildWsiAgentSvgSelector(
    geometryType: 'rectangle' | 'polygon',
    normalizedPoints: Array<{ x: number; y: number }>,
    viewport: WsiAgentViewport
): string {
    const points = normalizedPoints.map(point =>
        applyWsiAgentTransform(point, viewport)
    );
    if (geometryType === 'rectangle') {
        const first = points[0];
        const second = points[1];
        const x = Math.min(first.x, second.x);
        const y = Math.min(first.y, second.y);
        return `<svg><rect x="${x}" y="${y}" width="${Math.abs(
            second.x - first.x
        )}" height="${Math.abs(second.y - first.y)}" /></svg>`;
    }
    return `<svg><polygon points="${points
        .map(point => `${point.x},${point.y}`)
        .join(' ')}" /></svg>`;
}

export function agentEndpoint(apiUrl: string, path: string): string {
    return `${apiUrl.replace(/\/$/, '')}${path}`;
}
