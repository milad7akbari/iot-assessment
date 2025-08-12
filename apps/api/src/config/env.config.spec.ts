import envConfig from './env.config';

describe('env.config', () => {
    const OLD = process.env;
    beforeEach(() => { jest.resetModules(); process.env = { ...OLD }; });
    afterAll(() => { process.env = OLD; });

    it('builds AMQP and Mongo URIs from env', () => {
        process.env.RABBIT_USER = 'u';
        process.env.RABBIT_PASS = 'p';
        process.env.RABBIT_HOST = 'h';
        process.env.RABBIT_PORT = '5673';
        process.env.RABBIT_VHOST = '/';
        process.env.MONGO_USER = 'mu';
        process.env.MONGO_PASS = 'mp';
        process.env.MONGO_HOST = 'mh';
        process.env.MONGO_PORT = '27018';
        process.env.MONGO_DB   = 'db';

        const cfg = envConfig();
        expect(cfg.AMQP_URI).toContain('amqp://u:p@h:5673/');
        expect(cfg.AMQP_URI.endsWith('/%2F')).toBe(true);

        expect(cfg.MONGO_URI)
            .toBe('mongodb://mu:mp@mh:27018/db?authSource=admin');
    });

    it('falls back to sensible defaults when envs are missing', () => {
        delete process.env.RABBIT_HOST;
        delete process.env.RABBIT_PORT;
        delete process.env.MONGO_HOST;
        delete process.env.MONGO_PORT;
        delete process.env.MONGO_DB;

        const cfg = envConfig();
        expect(cfg.PORT).toBe(3000);
        expect(cfg.AMQP_URI).toContain('@localhost:5672');
        expect(cfg.MONGO_URI).toContain('@localhost:27017/iotdb?authSource=admin');
    });

    it('URL-encodes special chars in user/pass and vhost', () => {
        process.env.RABBIT_USER = 'u@:@';
        process.env.RABBIT_PASS = 'p#%/\\';
        process.env.RABBIT_HOST = 'h';
        process.env.RABBIT_VHOST = 'my/vhost';
        const cfg = envConfig();

        expect(cfg.AMQP_URI).toMatch(/^amqp:\/\/u%40%3A%40:p%23%25%2F%5C@h:5672\/my%2Fvhost$/);
    });
});
