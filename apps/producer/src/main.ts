import * as amqp from 'amqplib';

const RABBIT_USER = process.env.RABBIT_USER || 'm7a';
const RABBIT_PASS = process.env.RABBIT_PASS || 'm7a';
const RABBIT_HOST = process.env.RABBIT_HOST || 'rabbitmq';
const RABBIT_PORT = process.env.RABBIT_PORT || '5672';
const RABBIT_VHOST = encodeURIComponent(process.env.RABBIT_VHOST || '/');
const QUEUE = process.env.RABBIT_QUEUE_XRAY || 'xray';

const RATE_MS = Number(process.env.PRODUCER_RATE_MS || 1000);
const DEVICES = Number(process.env.PRODUCER_DEVICE_COUNT || 2);

function amqpUri() {
    return `amqp://${encodeURIComponent(RABBIT_USER)}:${encodeURIComponent(RABBIT_PASS)}@${RABBIT_HOST}:${RABBIT_PORT}/${RABBIT_VHOST}`;
}

function samplePayload(d: number) {
    const deviceId = `dev-${(d % 999) + 1}`;
    const t0 = Date.now();
    const points = Array.from({ length: 20 }, (_, i) => [t0 + i * 50, [i, i * 2, Math.random() * 3]]);
    return { deviceId, time: t0, points };
}

(async () => {
    const conn = await amqp.connect(amqpUri());
    const ch = await conn.createChannel();
    await ch.assertQueue(QUEUE, { durable: true });

    console.log(`Producer connected. Publishing to "${QUEUE}" every ${RATE_MS}ms ...`);
    let i = 0;
    setInterval(() => {
        for (let d = 0; d < DEVICES; d++) {
            const payload = samplePayload(d + i);
            ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), { contentType: 'application/json' });
        }
        i++;
    }, RATE_MS);
})();
