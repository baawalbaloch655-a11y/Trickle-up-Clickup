import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateFolderDto {
    @ApiProperty({ example: 'Q3 Roadmaps' })
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    spaceId?: string; // Optional if derived from route
}

export class UpdateFolderDto extends PartialType(CreateFolderDto) { }
