import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import {SignalsModule} from "../signals/signals.module";
import {MetricsModule} from "../metrics/metrics.module";

@Module({
    providers: [RabbitMQService],
    imports: [SignalsModule, MetricsModule],
    exports: [RabbitMQService],
})
export class RabbitMQModule {}
