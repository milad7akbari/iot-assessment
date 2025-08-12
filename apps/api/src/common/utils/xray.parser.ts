export type RawXRay = {
    deviceId?: string;
    time?: number;
    points?: Array<[number, [number, number, number]]>;
    data?: any;
};

export type ParsedXRay = {
    deviceId: string;
    timestamp: number;
    dataLength: number;
    meta?: { durationMs?: number; minTime?: number; maxTime?: number };
    rawSample?: any;
};

export function parseXRayPayload(input: unknown): ParsedXRay | null {
    if (!input || typeof input !== 'object') return null;
    const payload = input as RawXRay;

    const deviceId = String(payload.deviceId ?? '').trim();
    const timestamp = Number.isFinite(payload.time) ? Number(payload.time) : Date.now();

    let dataLength = 0, minTime: number | undefined, maxTime: number | undefined;
    if (Array.isArray(payload.points)) {
        dataLength = payload.points.length;
        for (const p of payload.points) {
            const t = Array.isArray(p) ? Number(p[0]) : NaN;
            if (Number.isFinite(t)) {
                if (minTime === undefined || t < minTime) minTime = t;
                if (maxTime === undefined || t > maxTime) maxTime = t;
            }
        }
    } else if (payload.data && typeof payload.data === 'object') {
        try {
            dataLength = Array.isArray((payload as any).data) ? (payload as any).data.length : Object.keys(payload.data).length;
        } catch { dataLength = 0; }
    }

    if (!deviceId || !Number.isFinite(timestamp)) return null;

    const meta: ParsedXRay['meta'] = {};
    if (minTime !== undefined && maxTime !== undefined) {
        meta.minTime = minTime; meta.maxTime = maxTime; meta.durationMs = maxTime - minTime;
    }

    const rawSample = (payload.points || payload.data) ? {
        ...(payload.points ? { pointsPreview: payload.points.slice(0, 50) } : {}),
    } : undefined;

    return { deviceId, timestamp, dataLength, meta, rawSample };
}
