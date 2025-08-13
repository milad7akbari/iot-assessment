import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
    readonly registry = new Registry();
    readonly httpDuration: Histogram<string>;
    readonly xrayProcessed: Counter<string>;
    readonly xrayProcessDuration: Histogram<string>;

    constructor() {
        collectDefaultMetrics({ register: this.registry });

        this.httpDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request duration',
            labelNames: ['method', 'route', 'code'],
            buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
            registers: [this.registry],
        });

        this.xrayProcessed = new Counter({
            name: 'xray_messages_total',
            help: 'Processed xray messages',
            labelNames: ['status'],
            registers: [this.registry],
        });

        this.xrayProcessDuration = new Histogram({
            name: 'xray_process_seconds',
            help: 'Duration of xray processing',
            buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 1],
            registers: [this.registry],
        });
    }
}
