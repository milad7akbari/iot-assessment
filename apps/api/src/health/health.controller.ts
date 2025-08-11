import { Controller, Get } from '@nestjs/common';
import { RabbitMQService } from '../mq/rabbitmq.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
    constructor(
        private readonly mq: RabbitMQService,
        @InjectConnection() private readonly conn: Connection,
    ) {}

    @Get('app')
    app() {
        return { ok: true, service: 'api' };
    }

    @Get('mq')
    async mqHealth() {
        return this.mq.ping();
    }

    @Get('db')
    db() {
        return { connected: this.conn.readyState === 1 };
    }
}
