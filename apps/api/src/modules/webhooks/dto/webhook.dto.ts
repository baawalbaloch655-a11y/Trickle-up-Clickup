import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateWebhookDto {
    @IsString()
    url: string;

    @IsArray()
    @IsString({ each: true })
    events: string[];

    @IsString()
    @IsOptional()
    secret?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateWebhookDto {
    @IsString()
    @IsOptional()
    url?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    events?: string[];

    @IsString()
    @IsOptional()
    secret?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
