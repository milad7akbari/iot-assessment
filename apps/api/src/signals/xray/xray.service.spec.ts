import { XRayService } from './xray.service';

function mockModel() {
    const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ id: 1 }]),
    };
    return {
        create: jest.fn(async (d) => d),
        findOneAndUpdate: jest.fn(async (_f, _u, _o) => ({ upserted: true })),
        find: jest.fn(() => chain),
        findById: jest.fn(() => ({ lean: jest.fn().mockResolvedValue({ id: 'x' }) })),
        findByIdAndUpdate: jest.fn(async () => ({ id: 'u' })),
        findByIdAndDelete: jest.fn(async () => ({ ok: 1 })),
    };
}

describe('XRayService', () => {
    const model = mockModel() as any;
    const svc = new XRayService(model);

    it('create', async () => {
        const res = await svc.create({ kind: 'xray', deviceId: 'd', timestamp: 1, dataLength: 2 });
        expect(model.create).toHaveBeenCalled();
        expect(res.deviceId).toBe('d');
    });

    it('upsertFromParsed', async () => {
        await svc.upsertFromParsed({ kind: 'xray', deviceId: 'd', timestamp: 1, dataLength: 2 });
        expect(model.findOneAndUpdate).toHaveBeenCalled();
    });

    it('find with filters', async () => {
        const res = await svc.find({ deviceId: 'd', from: 10, to: 20, limit: 5, skip: 1 });
        expect(model.find).toHaveBeenCalled();
        expect(res[0].id).toBe(1);
    });

    it('findOne/update/remove', async () => {
        await svc.findOne('id');
        await svc.update('id', { deviceId: 'd2' } as any);
        await svc.remove('id');
        expect(model.findById).toHaveBeenCalled();
        expect(model.findByIdAndUpdate).toHaveBeenCalled();
        expect(model.findByIdAndDelete).toHaveBeenCalled();
    });
});
