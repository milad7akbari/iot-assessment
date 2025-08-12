import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import {SignalsModule} from "../signals/signals.module";

@Module({
    providers: [RabbitMQService],
    imports: [SignalsModule],
    exports: [RabbitMQService],
})
export class RabbitMQModule {}
