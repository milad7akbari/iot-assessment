import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MSchema, SchemaTypes } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type XRaySignalDocument = HydratedDocument<XRaySignal>;

@Schema({ _id: false })
export class XRayMeta {
    @ApiProperty({ required: false })
    @Prop({ type: Number })
    durationMs?: number;

    @ApiProperty({ required: false })
    @Prop({ type: Number })
    minTime?: number;

    @ApiProperty({ required: false })
    @Prop({ type: Number })
    maxTime?: number;
}
export const XRayMetaSchema = SchemaFactory.createForClass(XRayMeta);

@Schema({ collection: 'signals', timestamps: true })
export class XRaySignal {
    @ApiProperty({ example: 'xray' })
    @Prop({ required: true, enum: ['xray'], default: 'xray', index: true })
    kind: 'xray' = 'xray';

    @ApiProperty({ example: 'dev-123' })
    @Prop({ required: true, index: true })
    deviceId!: string;

    @ApiProperty({ example: 1723276800000 })
    @Prop({ required: true, index: true })
    timestamp!: number;

    @ApiProperty({ example: 1024 })
    @Prop({ required: true, min: 0 })
    dataLength!: number;

    @ApiProperty({ required: false, type: () => XRayMeta })
    @Prop({ type: XRayMetaSchema, _id: false })
    meta?: XRayMeta;

    @ApiProperty({ required: false })
    @Prop({ type: SchemaTypes.Mixed })
    rawSample?: unknown;
}
export const XRaySignalSchema = SchemaFactory.createForClass(XRaySignal);
XRaySignalSchema.index({ deviceId: 1, timestamp: -1 });
XRaySignalSchema.index({ timestamp: -1 });
XRaySignalSchema.index({ dataLength: -1 });
XRaySignalSchema.index({ deviceId: 1, dataLength: -1 });

