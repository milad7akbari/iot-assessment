import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import envConfig from './config/env.config';
import { HealthModule } from './health/health.module';
import { MongoModule } from './db/mongo.module';
import { RabbitMQModule } from './mq/rabbitmq.module';
import { SignalsModule } from './signals/signals.module';
import {MetricsModule} from "./metrics/metrics.module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [envConfig] }),
        MongoModule,
        RabbitMQModule,
        MetricsModule,
        SignalsModule,
        HealthModule,
    ],
})
export class AppModule {}
