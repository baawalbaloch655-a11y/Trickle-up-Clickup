import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export enum EmployeeStatus {
    ACTIVE = 'ACTIVE',
    ON_LEAVE = 'ON_LEAVE',
    SUSPENDED = 'SUSPENDED',
    INACTIVE = 'INACTIVE',
}

export class UpdateEmployeeDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ enum: EmployeeStatus })
    @IsOptional()
    @IsEnum(EmployeeStatus)
    status?: EmployeeStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    capacityMins?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    departmentId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    teamId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    managerId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    roleId?: string;
}
