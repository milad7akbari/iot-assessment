import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { MetricsService } from './metrics/metrics.service';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const cfg = app.get(ConfigService);
    const port = cfg.get<number>('env.PORT', 3000);

    app.useLogger(app.get(Logger));
    app.use(helmet());
    app.enableCors();

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    if (cfg.get<boolean>('env.SWAGGER_ENABLED')) {
        const doc = new DocumentBuilder()
            .setTitle('IoT Signals API')
            .setDescription('CRUD, Query & Analytics for X-Ray signals')
            .setVersion('1.0.0')
            .build();
        const document = SwaggerModule.createDocument(app, doc);
        SwaggerModule.setup('docs', app, document);
    }

    const metrics = app.get(MetricsService);
    app.useGlobalInterceptors(new MetricsInterceptor(metrics));

    app.enableShutdownHooks();
    await app.listen(port);
    console.log(`API http://localhost:${port} | docs → /docs`);
}
bootstrap();
