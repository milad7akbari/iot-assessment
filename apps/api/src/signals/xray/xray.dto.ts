import { IsIn, IsInt, IsOptional, IsString, Min, IsArray, ArrayNotEmpty, ArrayMaxSize } from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class XRayQueryDto {
    @IsOptional() @IsString()
    deviceId?: string;

    @IsOptional() @IsArray() @ArrayNotEmpty() @ArrayMaxSize(50)
    @Transform(({ value }) => (Array.isArray(value) ? value : String(value || '').split(',').filter(Boolean)))
    deviceIds?: string[];

    @IsOptional() @IsInt() @Min(0)
    from?: number;

    @IsOptional() @IsInt() @Min(0)
    to?: number;

    @IsOptional() @IsInt() @Min(0)
    minDataLength?: number;

    @IsOptional() @IsInt() @Min(0)
    maxDataLength?: number;

    @IsOptional() @IsIn(['timestamp', 'dataLength'])
    sortBy?: 'timestamp' | 'dataLength';

    @IsOptional() @IsIn(['asc', 'desc'])
    sortDir?: 'asc' | 'desc';

    @IsOptional() @IsInt() @Min(1)
    limit?: number;

    @IsOptional() @IsInt() @Min(0)
    skip?: number;
}

export class CreateXRayDto {
    @IsIn(['xray'])
    kind: 'xray' = 'xray';

    @IsString()
    deviceId!: string;

    @IsInt() @Min(0)
    timestamp!: number;

    @IsInt() @Min(0)
    dataLength!: number;

    @IsOptional()
    meta?: { durationMs?: number; minTime?: number; maxTime?: number };

    @IsOptional()
    rawSample?: any;
}

export class UpdateXRayDto extends PartialType(CreateXRayDto) {}
