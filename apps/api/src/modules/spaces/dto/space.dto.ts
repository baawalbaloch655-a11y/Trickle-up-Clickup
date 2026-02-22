import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateSpaceDto {
    @ApiProperty({ example: 'Engineering' })
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: '#6366f1' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    isPrivate?: boolean;
}

export class UpdateSpaceDto extends PartialType(CreateSpaceDto) { }
