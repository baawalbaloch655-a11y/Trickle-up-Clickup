import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateIntegrationDto {
    @IsString()
    provider: string;

    @IsString()
    @IsOptional()
    externalId?: string;

    @IsObject()
    credentials: Record<string, any>;

    @IsObject()
    @IsOptional()
    config?: Record<string, any>;
}

export class UpdateIntegrationDto {
    @IsObject()
    @IsOptional()
    credentials?: Record<string, any>;

    @IsObject()
    @IsOptional()
    config?: Record<string, any>;
}
