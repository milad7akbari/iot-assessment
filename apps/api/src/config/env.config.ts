import { registerAs } from '@nestjs/config';

export default registerAs('env', () => {
    const {
        RABBIT_USER, RABBIT_PASS, RABBIT_HOST, RABBIT_PORT, RABBIT_VHOST, RABBIT_QUEUE_XRAY,
        MONGO_USER, MONGO_PASS, MONGO_HOST, MONGO_PORT, MONGO_DB,PRODUCER_SAMPLE_FILE, PRODUCER_RATE_MS, PRODUCER_SAMPLE_STREAM,
        PORT, RATE_LIMIT_TTL, RATE_LIMIT_LIMIT, LOG_LEVEL, LOG_PRETTY, SWAGGER_ENABLED,
    } = process.env;

    const amqpUri = `amqp://${encodeURIComponent(RABBIT_USER!)}:${encodeURIComponent(RABBIT_PASS!)}@${RABBIT_HOST || 'localhost'}:${RABBIT_PORT || '5672'}/${encodeURIComponent(RABBIT_VHOST || '/')}`;
    const mongoUri = `mongodb://${encodeURIComponent(MONGO_USER!)}:${encodeURIComponent(MONGO_PASS!)}@${MONGO_HOST || 'localhost'}:${MONGO_PORT || '27017'}/${MONGO_DB || 'iotdb'}?authSource=admin`;

    return {
        PORT: Number(PORT) || 3000,
        AMQP_URI: amqpUri,
        AMQP_QUEUE_XRAY: RABBIT_QUEUE_XRAY || 'xray',
        MONGO_URI: mongoUri,

        RATE_LIMIT_TTL: Number(RATE_LIMIT_TTL) || 60,
        RATE_LIMIT_LIMIT: Number(RATE_LIMIT_LIMIT) || 100,
        LOG_LEVEL: LOG_LEVEL || 'info',
        LOG_PRETTY: LOG_PRETTY === 'true',
        SWAGGER_ENABLED: SWAGGER_ENABLED !== 'false',
    };
});
