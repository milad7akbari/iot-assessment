import { parseXRayPayload } from './xray.parser';

describe('parseXRayPayload', () => {
    it('parses basic xray payload', () => {
        const input = { deviceId: 'd1', time: 1000, points: [[1000,[0,0,0]], [1500,[1,1,2]]] };
        const out = parseXRayPayload(input)!;
        expect(out.deviceId).toBe('d1');
        expect(out.timestamp).toBe(1000);
        expect(out.dataLength).toBe(2);
        expect(out.meta?.durationMs).toBe(500);
    });

    it('returns null on invalid', () => {
        expect(parseXRayPayload({})).toBeNull();
    });
});
