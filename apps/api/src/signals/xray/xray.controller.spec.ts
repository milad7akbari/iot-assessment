import { XRayController } from './xray.controller';

describe('XRayController', () => {
    const svc = {
        create: jest.fn(async (d) => d),
        find: jest.fn(async () => []),
        findOne: jest.fn(async () => ({ id: '1' })),
        update: jest.fn(async () => ({ id: '1u' })),
        remove: jest.fn(async () => ({ ok: 1 })),
    } as any;

    const c = new XRayController(svc);

    it('routes call service', async () => {
        await c.create({ kind: 'xray', deviceId: 'd', timestamp: 1, dataLength: 1 } as any);
        await c.list({});
        await c.get('1');
        await c.update('1', {});
        await c.remove('1');
        expect(svc.create).toHaveBeenCalled();
        expect(svc.findOne).toHaveBeenCalledWith('1');
    });
});
