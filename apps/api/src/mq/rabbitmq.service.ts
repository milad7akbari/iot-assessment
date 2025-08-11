import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RabbitMQService.name);
    private conn!: amqp.Connection;
    private ch!: amqp.Channel;
    private readonly queue: string;

    constructor(private readonly cfg: ConfigService) {
        this.queue = this.cfg.get<string>('env.AMQP_QUEUE_XRAY', 'xray')!;
    }

    async onModuleInit() {
        const uri = this.cfg.get<string>('env.AMQP_URI')!;
        const conn = await amqp.connect(uri);
        this.conn = conn;

        conn.on('error', (e: Error) => this.logger.error('AMQP connection error', e.message));
        conn.on('close', () => this.logger.warn('AMQP connection closed'));

        const ch = await conn.createChannel();
        this.ch = ch;

        await ch.assertQueue(this.queue, { durable: true });

        await ch.consume(this.queue, (msg: amqp.Message | null) => {
            if (!msg) return;
            try {
                const body = msg.content.toString();
                this.logger.log(`[xray] received: ${body.slice(0, 200)}...`);
                ch.ack(msg);
            } catch (e) {
                this.logger.error('consume error', (e as Error).message);
                ch.nack(msg, false, false);
            }
        });
    }

    async onModuleDestroy() {
        try { await this.ch?.close(); } catch {}
        try { await this.conn?.close(); } catch {}
    }

    async ping() {
        if (!this.ch) return { connected: false, queue: this.queue };
        const q = await this.ch.checkQueue(this.queue);
        return { connected: true, queue: this.queue, messageCount: q.messageCount };
    }
}
