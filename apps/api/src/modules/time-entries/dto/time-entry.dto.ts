import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateTimeEntryDto {
    @ApiProperty()
    @IsString()
    taskId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Duration in seconds (if logging manual time instead of a timer)' })
    @IsOptional()
    @IsInt()
    @Min(1)
    duration?: number;
}

export class UpdateTimeEntryDto extends PartialType(CreateTimeEntryDto) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    duration?: number;
}
