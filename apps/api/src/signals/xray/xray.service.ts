import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { XRaySignal, XRaySignalDocument } from './xray.schema';
import { CreateXRayDto, UpdateXRayDto, XRayQueryDto } from './xray.dto';

export type Range = { from?: number; to?: number; deviceId?: string };
export type TimeseriesArgs = { from?: number; to?: number; deviceId?: string; interval?: 'hour' | 'day' };
export type TopDevicesArgs = { from?: number; to?: number; limit?: number };
export type HistogramArgs = { field?: 'dataLength'; bins?: number; from?: number; to?: number };

@Injectable()
export class XRayService {
    constructor(@InjectModel(XRaySignal.name) private readonly model: Model<XRaySignalDocument>) {}

    async create(dto: CreateXRayDto) {
        return this.model.create(dto);
    }

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
        if (q.deviceIds?.length) filter.deviceId = { $in: q.deviceIds };

        if (q.from || q.to) {
            filter.timestamp = {};
            if (q.from) filter.timestamp!.$gte = q.from;
            if (q.to) filter.timestamp!.$lte = q.to;
        }

        if (q.minDataLength !== undefined || q.maxDataLength !== undefined) {
            filter.dataLength = {};
            if (q.minDataLength !== undefined) filter.dataLength!.$gte = q.minDataLength;
            if (q.maxDataLength !== undefined) filter.dataLength!.$lte = q.maxDataLength;
        }

        const sortField = q.sortBy ?? 'timestamp';
        const sortDir = (q.sortDir === 'asc' ? 1 : -1) as 1 | -1;

        const query = this.model
            .find(filter)
            .sort({ [sortField]: sortDir })
            .skip(q.skip ?? 0)
            .limit(Math.min(q.limit ?? 50, 200));

        if (sortField === 'timestamp') {
            query.hint({ deviceId: 1, timestamp: -1 } as any);
        }

        return query.lean();
    }

    async findOne(id: string) {
        return this.model.findById(id).lean();
    }

    async update(id: string, dto: UpdateXRayDto) {
        return this.model.findByIdAndUpdate(id, { $set: dto }, { new: true });
    }

    async remove(id: string) {
        return this.model.findByIdAndDelete(id);
    }

    async overview(r: Range) {
        const match: Record<string, any> = { kind: 'xray' };
        if (r.deviceId) match.deviceId = r.deviceId;
        if (r.from || r.to) {
            match.timestamp = {};
            if (r.from) match.timestamp.$gte = r.from;
            if (r.to) match.timestamp.$lte = r.to;
        }

        const [doc] = await this.model.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    devices: { $addToSet: '$deviceId' },
                    minTs: { $min: '$timestamp' },
                    maxTs: { $max: '$timestamp' },
                    avgLen: { $avg: '$dataLength' },
                },
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    devicesCount: { $size: '$devices' },
                    timeRange: { from: '$minTs', to: '$maxTs' },
                    avgDataLength: { $round: ['$avgLen', 2] },
                },
            },
        ]);

        return doc ?? { count: 0, devicesCount: 0 };
    }

    async timeseries({ from, to, deviceId, interval = 'hour' }: TimeseriesArgs) {
        const match: Record<string, any> = { kind: 'xray' };
        if (deviceId) match.deviceId = deviceId;
        if (from || to) {
            match.timestamp = {};
            if (from) match.timestamp.$gte = from;
            if (to) match.timestamp.$lte = to;
        }

        return this.model.aggregate([
            { $match: match },
            { $addFields: { tsDate: { $toDate: '$timestamp' } } },
            {
                $group: {
                    _id: { t: { $dateTrunc: { date: '$tsDate', unit: interval } }, d: '$deviceId' },
                    count: { $sum: 1 },
                    avgLen: { $avg: '$dataLength' },
                },
            },
            {
                $project: {
                    _id: 0,
                    deviceId: '$_id.d',
                    time: '$_id.t',
                    count: 1,
                    avgDataLength: { $round: ['$avgLen', 2] },
                },
            },
            { $sort: { time: 1 } },
        ]);
    }

    async topDevices({ from, to, limit = 10 }: TopDevicesArgs) {
        const match: Record<string, any> = { kind: 'xray' };
        if (from || to) {
            match.timestamp = {};
            if (from) match.timestamp.$gte = from;
            if (to) match.timestamp.$lte = to;
        }

        return this.model.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$deviceId',
                    count: { $sum: 1 },
                    lastTs: { $max: '$timestamp' },
                    avgLen: { $avg: '$dataLength' },
                },
            },
            {
                $project: {
                    _id: 0,
                    deviceId: '$_id',
                    count: 1,
                    lastTs: 1,
                    avgDataLength: { $round: ['$avgLen', 2] },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]);
    }

    async histogram({ field = 'dataLength', bins = 10, from, to }: HistogramArgs) {
        const match: Record<string, any> = { kind: 'xray' };
        if (from || to) {
            match.timestamp = {};
            if (from) match.timestamp.$gte = from;
            if (to) match.timestamp.$lte = to;
        }

        return this.model.aggregate([
            { $match: match },
            { $bucketAuto: { groupBy: `$${field}`, buckets: Math.max(1, Math.min(bins, 50)) } },
            { $project: { _id: 0, min: '$min', max: '$max', count: '$count' } },
        ]);
    }
}
