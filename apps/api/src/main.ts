import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const config = app.get(ConfigService);
    const port = config.get<number>('PORT', 3000);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    const doc = new DocumentBuilder()
        .setTitle('IoT Signals API')
        .setDescription('CRUD & Query for X-Ray signals')
        .setVersion('0.4.0')
        .build();
    const document = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('docs', app, document);

    app.enableShutdownHooks();
    await app.listen(port);
    console.log(`API http://localhost:${port}  | docs → /docs`);
}
bootstrap();
