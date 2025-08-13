import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    constructor(private readonly metrics: MetricsService) {}

    intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
        const req = ctx.switchToHttp().getRequest();
        const method = req?.method || 'GET';
        const route = req?.route?.path || req?.url || 'unknown';
        const start = process.hrtime.bigint();

        const observe = (code: number) => {
            const sec = Number(process.hrtime.bigint() - start) / 1e9;
            this.metrics.httpDuration.labels(method, route, String(code)).observe(sec);
        };

        return next.handle().pipe(
            tap({
                next: () => observe(200),
                error: () => observe(500),
            }),
        );
    }
}
