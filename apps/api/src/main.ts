import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

    // Security
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
    app.use(cookieParser());

    // CORS
    app.enableCors({
        origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:80'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-org-id'],
    });

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Pipes
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    // Filters & Interceptors
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
        new LoggingInterceptor(),
        new ResponseInterceptor(),
    );

    // Swagger
    const swaggerConfig = new DocumentBuilder()
        .setTitle('TrickleUp API')
        .setDescription('Enterprise SaaS Platform — REST API Documentation')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .addGlobalParameters({
            name: 'x-org-id',
            in: 'header',
            required: false,
            description: 'Organization ID for tenant-scoped endpoints',
        })
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });

    await app.listen(port);
    Logger.log(`🚀 TrickleUp API running on: http://localhost:${port}`, 'Bootstrap');
    Logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
