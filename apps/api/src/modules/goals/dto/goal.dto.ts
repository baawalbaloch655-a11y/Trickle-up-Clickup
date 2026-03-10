import { IsString, IsOptional, IsNotEmpty, IsBoolean, IsDateString, IsNumber, IsEnum } from 'class-validator';

export class CreateGoalDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsBoolean()
    @IsOptional()
    isPrivate?: boolean;
}

export class UpdateGoalDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsBoolean()
    @IsOptional()
    isPrivate?: boolean;
}

export enum TargetType {
    NUMBER = 'NUMBER',
    TRUE_FALSE = 'TRUE_FALSE',
    CURRENCY = 'CURRENCY',
    PERCENTAGE = 'PERCENTAGE'
}

export class CreateGoalTargetDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(TargetType)
    @IsOptional()
    type?: TargetType;

    @IsNumber()
    @IsNotEmpty()
    targetValue: number;

    @IsNumber()
    @IsOptional()
    currentValue?: number;

    @IsString()
    @IsOptional()
    unit?: string;
}

export class UpdateGoalTargetDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    targetValue?: number;

    @IsNumber()
    @IsOptional()
    currentValue?: number;
}
