import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, Connection, Channel, ConsumeMessage } from 'amqplib';
import { parseXRayPayload } from '../common/utils/xray.parser';
import { XRayService } from '../signals/xray/xray.service';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RabbitMQService.name);
    private conn!: Connection;
    private ch!: Channel;
    private readonly queue: string;

    constructor(
        private readonly cfg: ConfigService,
        private readonly xray: XRayService,
    ) {
        this.queue = this.cfg.get<string>('env.AMQP_QUEUE_XRAY', 'xray')!;
    }

    async onModuleInit() {
        const uri = this.cfg.get<string>('env.AMQP_URI')!;
        this.conn = await connect(uri);

        this.conn.on('error', (e: unknown) => {
            const err = e as Error;
            this.logger.error('AMQP connection error', err?.stack ?? String(e));
        });
        this.conn.on('close', () => this.logger.warn('AMQP connection closed'));

        this.ch = await this.conn.createChannel();
        await this.ch.assertQueue(this.queue, { durable: true });

        await this.ch.consume(
            this.queue,
            async (msg: ConsumeMessage | null) => {
                if (!msg) return;
                try {
                    const parsed = parseXRayPayload(JSON.parse(msg.content.toString()));
                    if (!parsed) { this.logger.warn('xray parse skipped'); this.ch.ack(msg); return; }

                    await this.xray.upsertFromParsed({
                        kind: 'xray',
                        deviceId: parsed.deviceId,
                        timestamp: parsed.timestamp,
                        dataLength: parsed.dataLength,
                        meta: parsed.meta,
                        rawSample: parsed.rawSample,
                    });

                    this.ch.ack(msg);
                } catch (e) {
                    this.logger.error('consume error', e as any);
                    this.ch.nack(msg, false, false);
                }
            },
            { noAck: false },
        );

        this.logger.log(`AMQP connected. Queue asserted: ${this.queue}`);
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
