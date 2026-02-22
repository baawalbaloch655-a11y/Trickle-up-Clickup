import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateListDto {
    @ApiProperty({ example: 'Sprint 12' })
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

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    folderId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    spaceId?: string;
}

export class UpdateListDto extends PartialType(CreateListDto) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isArchived?: boolean;
}
