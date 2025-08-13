import { Controller, Get, Res } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { Response } from 'express';

@Controller('metrics')
export class MetricsController {
    constructor(private readonly m: MetricsService) {}
    @Get()
    async metrics(@Res() res: Response) {
        res.setHeader('Content-Type', this.m.registry.contentType);
        res.end(await this.m.registry.metrics());
    }
}
