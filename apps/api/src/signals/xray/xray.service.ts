import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { XRaySignal, XRaySignalDocument } from './xray.schema';
import { CreateXRayDto, UpdateXRayDto, XRayQueryDto } from './xray.dto';

@Injectable()
export class XRayService {
    constructor(@InjectModel(XRaySignal.name) private model: Model<XRaySignalDocument>) {}

    async create(dto: CreateXRayDto) { return this.model.create(dto); }

    async upsertFromParsed(p: CreateXRayDto) {
        return this.model.findOneAndUpdate(
            { deviceId: p.deviceId, timestamp: p.timestamp, kind: 'xray' },
            { $set: p },
            { upsert: true, new: true },
        );
    }

    async find(q: XRayQueryDto) {
        const filter: FilterQuery<XRaySignalDocument> = { kind: 'xray' };
        if (q.deviceId) filter.deviceId = q.deviceId;
        if (q.from || q.to) {
            filter.timestamp = {};
            if (q.from) filter.timestamp!.$gte = q.from;
            if (q.to) filter.timestamp!.$lte = q.to;
        }
        return this.model
            .find(filter)
            .sort({ timestamp: -1 })
            .skip(q.skip ?? 0)
            .limit(q.limit ?? 50)
            .lean();
    }

    async findOne(id: string) { return this.model.findById(id).lean(); }

    async update(id: string, dto: UpdateXRayDto) {
        return this.model.findByIdAndUpdate(id, { $set: dto }, { new: true });
    }

    async remove(id: string) { return this.model.findByIdAndDelete(id); }
}
