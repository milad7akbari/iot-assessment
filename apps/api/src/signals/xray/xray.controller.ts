import { Controller, Get, Post, Body, Query, Param, Patch, Delete } from '@nestjs/common';
import { XRayService } from './xray.service';
import { CreateXRayDto, UpdateXRayDto, XRayQueryDto } from './xray.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('xray')
@Controller('signals/xray')
export class XRayController {
    constructor(private readonly service: XRayService) {}

    @Post()
    create(@Body() dto: CreateXRayDto) {
        return this.service.create(dto);
    }

    @Get()
    list(@Query() q: XRayQueryDto) {
        return this.service.find(q);
    }

    @Get(':id')
    get(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateXRayDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }

    @Get('metrics/overview')
    overview(@Query('from') from?: number, @Query('to') to?: number, @Query('deviceId') deviceId?: string) {
        return this.service.overview({ from: from ? +from : undefined, to: to ? +to : undefined, deviceId });
    }

    @Get('metrics/timeseries')
    timeseries(
        @Query('from') from?: number,
        @Query('to') to?: number,
        @Query('deviceId') deviceId?: string,
        @Query('interval') interval?: 'hour'|'day',
    ) {
        return this.service.timeseries({ from: from ? +from : undefined, to: to ? +to : undefined, deviceId, interval });
    }

    @Get('metrics/top-devices')
    topDevices(@Query('from') from?: number, @Query('to') to?: number, @Query('limit') limit?: number) {
        return this.service.topDevices({ from: from ? +from : undefined, to: to ? +to : undefined, limit: limit ? +limit : undefined });
    }

    @Get('metrics/histogram')
    histogram(@Query('field') field?: 'dataLength', @Query('bins') bins?: number, @Query('from') from?: number, @Query('to') to?: number) {
        return this.service.histogram({ field, bins: bins ? +bins : undefined, from: from ? +from : undefined, to: to ? +to : undefined });
    }
}

