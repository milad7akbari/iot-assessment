declare module 'amqplib' {
    import { EventEmitter } from 'events';

    export interface Message {
        content: Buffer;
        fields: any;
        properties: any;
    }

    export interface Channel {
        assertQueue(queue: string, options?: any): Promise<any>;
        consume(
            queue: string,
            onMessage: (msg: Message | null) => void,
            options?: any,
        ): Promise<any>;
        ack(message: Message): void;
        nack(message: Message, allUpTo?: boolean, requeue?: boolean): void;
        checkQueue(queue: string): Promise<{ messageCount: number }>;
        close(): Promise<void>;
    }

    export interface Connection extends EventEmitter {
        createChannel(): Promise<Channel>;
        close(): Promise<void>;
    }

    export function connect(url: string): Promise<Connection>;
}
