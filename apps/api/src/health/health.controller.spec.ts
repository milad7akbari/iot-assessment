import { HealthController } from './health.controller';

describe('HealthController', () => {
    it('returns app ok', () => {
        const mq: any = { ping: jest.fn().mockResolvedValue({ connected: true }) };
        const conn: any = { readyState: 1 };
        const c = new HealthController(mq, conn as any);
        expect(c.app()).toEqual({ ok: true, service: 'api' });
    });

    it('reports db and mq', async () => {
        const mq: any = { ping: jest.fn().mockResolvedValue({ connected: true }) };
        const conn: any = { readyState: 1 };
        const c = new HealthController(mq, conn as any);
        expect(await c.mqHealth()).toEqual({ connected: true });
        expect(c.db()).toEqual({ connected: true });
    });
});
