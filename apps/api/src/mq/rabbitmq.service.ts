import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, Channel, ConsumeMessage } from 'amqplib';
import { parseXRayPayload } from '../common/utils/xray.parser';
import { XRayService } from '../signals/xray/xray.service';

type AmqpConnectionMinimal = {
    createChannel(): Promise<Channel>;
    close(): Promise<void>;
    on(ev: 'error' | 'close', cb: (...args: unknown[]) => void): void;
};

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RabbitMQService.name);

    private conn!: AmqpConnectionMinimal;
    private ch!: Channel;

    private readonly queue: string;
    private readonly retryQueue = 'xray.retry.5s';
    private readonly dlx = 'xray.dlx';
    private readonly dlq = 'xray.dlq';
    private readonly maxRetries: number;

    constructor(
        private readonly cfg: ConfigService,
        private readonly xray: XRayService,
    ) {
        this.queue = this.cfg.get<string>('env.AMQP_QUEUE_XRAY', 'xray')!;
        this.maxRetries = Number(process.env.XRAY_MAX_RETRIES || 3);
    }

    async onModuleInit(): Promise<void> {
        const uri = this.cfg.get<string>('env.AMQP_URI')!;
        this.conn = (await connect(uri)) as unknown as AmqpConnectionMinimal;

        this.conn.on('error', (err: unknown) => this.logger.error('AMQP connection error', err as any));
        this.conn.on('close', () => this.logger.warn('AMQP connection closed'));

        this.ch = await this.conn.createChannel();

        await this.ch.assertExchange(this.dlx, 'fanout', { durable: true });
        await this.ch.assertQueue(this.dlq, { durable: true });
        await this.ch.bindQueue(this.dlq, this.dlx, '');

        await this.ch.assertQueue(this.queue, {
            durable: true,
            arguments: { 'x-dead-letter-exchange': this.dlx },
        });

        await this.ch.assertQueue(this.retryQueue, {
            durable: true,
            arguments: {
                'x-message-ttl': 5000,
                'x-dead-letter-exchange': '',
                'x-dead-letter-routing-key': this.queue,
            },
        });

        await this.consume();
        this.logger.log(`AMQP ready (queue=${this.queue}, dlq=${this.dlq}, retry=${this.retryQueue})`);
    }

    private async consume(): Promise<void> {
        await this.ch.consume(
            this.queue,
            async (msg: ConsumeMessage | null) => {
                if (!msg) return;
                try {
                    const json = JSON.parse(msg.content.toString());
                    const parsed = parseXRayPayload(json);
                    if (!parsed) throw new Error('Invalid xray payload');

                    await this.xray.upsertFromParsed({
                        kind: 'xray',
                        deviceId: parsed.deviceId,
                        timestamp: parsed.timestamp,
                        dataLength: parsed.dataLength,
                        meta: parsed.meta,
                        rawSample: parsed.rawSample,
                    });

                    this.ch.ack(msg);
                } catch (err) {
                    const attempts = (msg.properties.headers?.['x-attempts'] as number) || 0;
                    if (attempts < this.maxRetries) {
                        this.ch.sendToQueue(this.retryQueue, msg.content, {
                            headers: { ...(msg.properties.headers || {}), 'x-attempts': attempts + 1 },
                            contentType: msg.properties.contentType,
                            persistent: true,
                        });
                        this.ch.ack(msg);
                        this.logger.warn(`Retry scheduled (${attempts + 1}/${this.maxRetries})`);
                    } else {
                        this.ch.nack(msg, false, false);
                        this.logger.error(`Moved to DLQ after ${attempts} retries`);
                    }
                }
            },
            { noAck: false },
        );
    }

    async ping(): Promise<{ connected: boolean; queue: string; messageCount?: number }> {
        if (!this.ch) return { connected: false, queue: this.queue };
        const q = await this.ch.checkQueue(this.queue);
        return { connected: true, queue: this.queue, messageCount: q.messageCount };
    }

    async onModuleDestroy(): Promise<void> {
        try { if (this.ch) await this.ch.close(); } catch (e) { this.logger.warn(String(e)); }
        try { if (this.conn) await this.conn.close(); } catch (e) { this.logger.warn(String(e)); }
    }
}
