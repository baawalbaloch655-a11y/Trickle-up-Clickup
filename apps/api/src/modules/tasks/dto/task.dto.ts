import { IsString, IsOptional, IsEnum, IsArray, IsDate, IsNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
    @ApiProperty({ example: 'Update API Documentation' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ example: 'Add new endpoints for v2...' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;

    @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
    @IsEnum(TaskPriority)
    @IsOptional()
    priority?: TaskPriority;

    @ApiPropertyOptional({ example: 'user-uuid' })
    @IsString()
    @IsOptional()
    assigneeId?: string;

    @ApiPropertyOptional()
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    dueDate?: Date;

    @ApiPropertyOptional({ type: [String], example: ['api', 'documentation'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @ApiPropertyOptional({ example: 0 })
    @IsInt()
    @IsOptional()
    order?: number;
}

export class UpdateTaskDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ enum: TaskStatus })
    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;

    @ApiPropertyOptional({ enum: TaskPriority })
    @IsEnum(TaskPriority)
    @IsOptional()
    priority?: TaskPriority;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    assigneeId?: string;

    @ApiPropertyOptional()
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    dueDate?: Date;

    @ApiPropertyOptional()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];
}

export class MoveTaskDto {
    @ApiProperty({ example: 'new-list-uuid' })
    @IsString()
    @IsOptional()
    listId?: string;

    @ApiPropertyOptional({ enum: TaskStatus })
    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;

    @ApiPropertyOptional({ example: 1 })
    @IsInt()
    @IsOptional()
    order?: number;
}
