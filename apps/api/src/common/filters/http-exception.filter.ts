import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal Server Error';
        let errors: Record<string, string[]> | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'object' && res !== null) {
                const resObj = res as Record<string, unknown>;
                message = (resObj.message as string) || message;
                if (Array.isArray(resObj.message)) {
                    message = 'Validation failed';
                    errors = { validation: resObj.message as string[] };
                }
            } else {
                message = res as string;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            message,
            errors,
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}
