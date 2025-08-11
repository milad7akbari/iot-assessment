import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongoModule } from './db/mongo.module';
import envConfig from './config/env.config';
import { HealthModule } from './health/health.module';
import { RabbitMQModule } from './mq/rabbitmq.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [envConfig] }),
        MongoModule,
        RabbitMQModule,
        HealthModule,
    ],
})
export class AppModule {}
