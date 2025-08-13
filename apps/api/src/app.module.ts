import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import envConfig from './config/env.config';
import { HealthModule } from './health/health.module';
import { MongoModule } from './db/mongo.module';
import { RabbitMQModule } from './mq/rabbitmq.module';
import { SignalsModule } from './signals/signals.module';
import {
    ThrottlerModule,
    ThrottlerGuard,
    ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [envConfig] }),

        LoggerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                pinoHttp: {
                    level: cfg.get('env.LOG_LEVEL'),
                    transport: cfg.get('env.LOG_PRETTY')
                        ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
                        : undefined,
                    redact: ['req.headers.authorization', 'password', 'headers.authorization'],
                },
            }),
        }),

        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (cfg: ConfigService): ThrottlerModuleOptions => ({
                throttlers: [
                    {
                        ttl: (Number(cfg.get('env.RATE_LIMIT_TTL', 60)) || 60) * 1000,
                        limit: Number(cfg.get('env.RATE_LIMIT_LIMIT', 100)) || 100,
                    },
                ],
            }),
        }),

        MongoModule,
        RabbitMQModule,
        SignalsModule,
        HealthModule,
    ],
    providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
