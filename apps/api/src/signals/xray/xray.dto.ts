import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateXRayDto {
    @ApiProperty({ example: 'xray', default: 'xray' })
    @IsIn(['xray'])
    kind: 'xray' = 'xray';

    @ApiProperty({ example: 'dev-123' })
    @IsString()
    deviceId!: string;

    @ApiProperty({ example: 1723276800000 })
    @IsInt() @Min(0)
    timestamp!: number;

    @ApiProperty({ example: 1024 })
    @IsInt() @Min(0)
    dataLength!: number;

    @ApiProperty({ required: false })
    @IsOptional()
    meta?: { durationMs?: number; minTime?: number; maxTime?: number };

    @ApiProperty({ required: false })
    @IsOptional()
    rawSample?: any;
}
export class UpdateXRayDto extends PartialType(CreateXRayDto) {}

export class XRayQueryDto {
    @IsOptional() @IsString()
    deviceId?: string;

    @IsOptional() @IsInt() @Min(0)
    from?: number;

    @IsOptional() @IsInt() @Min(0)
    to?: number;

    @IsOptional() @IsInt() @Min(1)
    limit?: number;

    @IsOptional() @IsInt() @Min(0)
    skip?: number;
}
