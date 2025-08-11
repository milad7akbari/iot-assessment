import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RabbitMQModule } from '../mq/rabbitmq.module';

@Module({ imports: [RabbitMQModule], controllers: [HealthController] })
export class HealthModule {}
