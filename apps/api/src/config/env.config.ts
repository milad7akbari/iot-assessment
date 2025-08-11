import { registerAs } from '@nestjs/config';

export default registerAs('env', () => {
    const {
        RABBIT_USER, RABBIT_PASS, RABBIT_HOST, RABBIT_PORT, RABBIT_VHOST, RABBIT_QUEUE_XRAY,
        MONGO_USER, MONGO_PASS, MONGO_HOST, MONGO_PORT, MONGO_DB,
        PORT,
    } = process.env;

    const amqpUri =
        `amqp://${encodeURIComponent(RABBIT_USER!)}:` +
        `${encodeURIComponent(RABBIT_PASS!)}@${RABBIT_HOST || 'localhost'}:${RABBIT_PORT || '5672'}` +
        `/${encodeURIComponent(RABBIT_VHOST || '/')}`;

    const mongoUri =
        `mongodb://${encodeURIComponent(MONGO_USER!)}:` +
        `${encodeURIComponent(MONGO_PASS!)}@${MONGO_HOST || 'localhost'}:${MONGO_PORT || '27017'}` +
        `/${MONGO_DB || 'iotdb'}?authSource=admin`;
    console.log(amqpUri)
    console.log(mongoUri)
    return {
        PORT: Number(PORT) || 3000,
        AMQP_URI: amqpUri,
        AMQP_QUEUE_XRAY: RABBIT_QUEUE_XRAY || 'xray',
        MONGO_URI: mongoUri,
    };
});
