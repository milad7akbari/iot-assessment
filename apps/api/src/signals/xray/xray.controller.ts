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
}
