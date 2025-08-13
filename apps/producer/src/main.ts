import * as amqp from 'amqplib';
import * as fs from 'fs';

const RABBIT_USER = process.env.RABBIT_USER || 'm7a';
const RABBIT_PASS = process.env.RABBIT_PASS || 'm7a';
const RABBIT_HOST = process.env.RABBIT_HOST || 'localhost';
const RABBIT_PORT = process.env.RABBIT_PORT || '5672';
const RABBIT_VHOST = encodeURIComponent(process.env.RABBIT_VHOST || '/');
const QUEUE = process.env.RABBIT_QUEUE_XRAY || 'xray';

const RATE_MS = Number(process.env.PRODUCER_RATE_MS || 20);
const SAMPLE = process.env.PRODUCER_SAMPLE_FILE || './x-ray.json';
const CHUNK_SIZE = Number(process.env.PRODUCER_CHUNK_SIZE || 20);

const uri = `amqp://${encodeURIComponent(RABBIT_USER)}:${encodeURIComponent(RABBIT_PASS)}@${RABBIT_HOST}:${RABBIT_PORT}/${RABBIT_VHOST}`;

function chunkArray<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

type Point = [number, any];
function* fromSampleFile(path: string, chunkSize: number) {
    const raw = fs.readFileSync(path, 'utf8');
    const json = JSON.parse(raw);

    if (json && typeof json === 'object') {
        for (const [deviceId, entry] of Object.entries<any>(json)) {
            const base = Number(entry.time) || Date.now();
            const points: Point[] = Array.isArray(entry.data) ? entry.data : [];
            const chunks = chunkArray(points, chunkSize);

            for (const chunk of chunks) {
                if (!chunk.length) continue;
                const firstOffset = Number(chunk[0]?.[0]) || 0;

                const absPoints: Point[] = chunk.map(([off, vec]) => [base + Number(off || 0), vec]);

                yield {
                    deviceId,
                    time: base + firstOffset,
                    points: absPoints
                };
            }
        }
    }
}

(async () => {
    const conn = await amqp.connect(uri);
    const ch = await conn.createChannel();

    await ch.assertQueue(QUEUE, {
        durable: true,
        arguments: { 'x-dead-letter-exchange': 'xray.dlx' }
    });

    const msgs = [...fromSampleFile(SAMPLE, CHUNK_SIZE)];
    if (!msgs.length) {
        console.error(`No valid messages found in ${SAMPLE}`);
        process.exit(1);
    }
    console.log(`Producer: loaded ${msgs.length} message(s) from ${SAMPLE}`);

    let i = 0;
    const send = () => {
        if (i >= msgs.length) {
            console.log('All messages sent. Exiting...');
            ch.close().finally(() => conn.close().finally(() => process.exit(0)));
            return;
        }
        const m = msgs[i++];
        ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(m)), {
            contentType: 'application/json',
            persistent: true
        });
        setTimeout(send, RATE_MS);
    };
    send();
})().catch(e => {
    console.error('Producer failed:', e);
    process.exit(1);
});
