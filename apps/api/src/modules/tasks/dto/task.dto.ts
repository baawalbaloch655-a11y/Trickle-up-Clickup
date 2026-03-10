import { IsString, IsOptional, IsEnum, IsArray, IsDate, IsNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';

export class CreateTaskDto {
    @ApiProperty({ example: 'Update API Documentation' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ example: 'Add new endpoints for v2...' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ example: 'status-uuid' })
    @IsString()
    @IsOptional()
    statusId?: string;

    @IsString()
    @IsOptional()
    status?: string;

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

    @ApiPropertyOptional()
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    startDate?: Date;

    @ApiPropertyOptional({ type: [String], example: ['api', 'documentation'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @ApiPropertyOptional({ example: 60, description: 'Time estimate in minutes' })
    @IsInt()
    @IsOptional()
    timeEstimate?: number;

    @ApiPropertyOptional({ example: 'parent-task-uuid' })
    @IsString()
    @IsOptional()
    parentId?: string;

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

    @ApiPropertyOptional({ example: 'status-uuid' })
    @IsString()
    @IsOptional()
    statusId?: string;

    @IsString()
    @IsOptional()
    status?: string;

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
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    startDate?: Date;

    @ApiPropertyOptional()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @ApiPropertyOptional()
    @IsInt()
    @IsOptional()
    timeEstimate?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    parentId?: string;
}

export class MoveTaskDto {
    @ApiProperty({ example: 'new-list-uuid' })
    @IsString()
    @IsOptional()
    listId?: string;

    @ApiPropertyOptional({ example: 'status-uuid' })
    @IsString()
    @IsOptional()
    statusId?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @ApiPropertyOptional({ example: 1 })
    @IsInt()
    @IsOptional()
    order?: number;
}

export class AddDependencyDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    dependentTaskId: string;

    @ApiProperty({ enum: ['BLOCKING', 'WAITING_ON'] })
    @IsEnum(['BLOCKING', 'WAITING_ON'])
    type: 'BLOCKING' | 'WAITING_ON';
}

export class CreateChecklistDto {
    @ApiProperty({ example: 'QA Checks' })
    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateChecklistItemDto {
    @ApiProperty({ example: 'Verify login flow' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'user-uuid' })
    @IsString()
    @IsOptional()
    assigneeId?: string;
}

export class UpdateChecklistItemDto {
    @ApiPropertyOptional({ example: 'Verify new login flow' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional()
    @Type(() => Boolean)
    @IsOptional()
    isResolved?: boolean;

    @ApiPropertyOptional({ example: 'user-uuid' })
    @IsString()
    @IsOptional()
    assigneeId?: string;

    @ApiPropertyOptional()
    @IsInt()
    @IsOptional()
    order?: number;
}
