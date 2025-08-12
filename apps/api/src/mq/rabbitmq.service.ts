import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { parseXRayPayload } from '../common/utils/xray.parser';
import { XRayService } from '../signals/xray/xray.service';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RabbitMQService.name);
    private conn!: amqp.Connection;
    private ch!: amqp.Channel;
    private readonly queue: string;
    private readonly retryQueue = 'xray.retry.5s';
    private readonly dlx = 'xray.dlx';
    private readonly dlq = 'xray.dlq';
    private readonly maxRetries = Number(process.env.XRAY_MAX_RETRIES || 3);

    constructor(private cfg: ConfigService, private xray: XRayService) {
        this.queue = this.cfg.get<string>('env.AMQP_QUEUE_XRAY', 'xray')!;
    }

    async onModuleInit() {
        const uri = this.cfg.get<string>('env.AMQP_URI')!;
        this.conn = await amqp.connect(uri);
        this.conn.on('error', (e) => this.logger.error('AMQP connection error', e as any));
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

    private async consume() {
        await this.ch.consume(
            this.queue,
            async (msg) => {
                if (!msg) return;
                try {
                    const body = msg.content.toString();
                    const json = JSON.parse(body);
                    const parsed = parseXRayPayload(json);
                    if (!parsed) throw new Error('invalid xray payload');

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
                    const attempts = (msg.properties.headers?.['x-attempts'] as number) || 0;
                    if (attempts < this.maxRetries) {
                        this.ch.sendToQueue(this.retryQueue, msg.content, {
                            headers: { ...(msg.properties.headers || {}), 'x-attempts': attempts + 1 },
                            contentType: msg.properties.contentType,
                            persistent: true,
                        });
                        this.ch.ack(msg);
                        this.logger.warn(`retry scheduled (${attempts + 1}/${this.maxRetries})`);
                    } else {
                        this.ch.nack(msg, false, false);
                        this.logger.error(`moved to DLQ after ${attempts} retries`);
                    }
                }
            },
            { noAck: false },
        );
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
