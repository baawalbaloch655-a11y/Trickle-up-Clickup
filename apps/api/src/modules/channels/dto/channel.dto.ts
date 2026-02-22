import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChannelDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isPrivate?: boolean;
}

export class UpdateChannelDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isPrivate?: boolean;
}
