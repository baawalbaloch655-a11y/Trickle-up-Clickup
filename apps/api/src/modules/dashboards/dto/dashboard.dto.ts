import { IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';

export class CreateDashboardDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isPrivate?: boolean;
}

export class UpdateDashboardDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isPrivate?: boolean;
}

export class CreateWidgetDto {
    @IsString()
    type: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsNumber()
    positionX?: number;

    @IsOptional()
    @IsNumber()
    positionY?: number;

    @IsOptional()
    @IsNumber()
    width?: number;

    @IsOptional()
    @IsNumber()
    height?: number;

    @IsOptional()
    @IsObject()
    settings?: any;
}

export class UpdateWidgetDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    positionX?: number;

    @IsOptional()
    @IsNumber()
    positionY?: number;

    @IsOptional()
    @IsNumber()
    width?: number;

    @IsOptional()
    @IsNumber()
    height?: number;

    @IsOptional()
    @IsObject()
    settings?: any;
}
