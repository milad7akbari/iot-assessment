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

    @Get('app') app() { return { ok: true, service: 'api' }; }

    @Get('live') live() { return { ok: true }; }

    @Get('mq')   async mqHealth() { return this.mq.ping(); }

    @Get('db')   db() { return { connected: this.conn.readyState === 1 }; }

    @Get('ready')
    async ready() {
        const mq = await this.mq.ping();
        const db = this.conn.readyState === 1;
        return { ok: mq.connected && db, mq, db };
    }
}
