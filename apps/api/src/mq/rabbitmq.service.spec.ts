import { RabbitMQService } from './rabbitmq.service';

describe('RabbitMQService.ping', () => {
    const cfg = {
        get: jest.fn((key: string, def: any) =>
            key === 'env.AMQP_QUEUE_XRAY' ? 'xray' : def
        ),
    } as any;

    const xray = { upsertFromParsed: jest.fn() } as any;

    it('returns false when channel missing', async () => {
        const svc = new RabbitMQService(cfg, xray);
        const res = await svc.ping();
        expect(res).toEqual({ connected: false, queue: 'xray' });
    });

    it('returns stats when channel exists', async () => {
        const svc = new RabbitMQService(cfg, xray);
        (svc as any).ch = { checkQueue: jest.fn().mockResolvedValue({ messageCount: 0 }) };
        const res = await svc.ping();
        expect(res).toEqual({ connected: true, queue: 'xray', messageCount: 0 });
    });
});
