import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateAiOperationDto {
    @IsString()
    action: string;

    @IsString()
    prompt: string;
}

export class UpdateAiOperationDto {
    @IsString()
    @IsOptional()
    response?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    tokens?: number;

    @IsString()
    @IsOptional()
    status?: string;
}
