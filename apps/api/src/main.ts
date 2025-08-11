import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const config = app.get(ConfigService);
    const port = config.get<number>('PORT', 3000);

    app.enableShutdownHooks();

    await app.listen(port);
    // eslint-disable-next-line no-console
    console.log(`API running on http://localhost:${port}`);
}
bootstrap();
