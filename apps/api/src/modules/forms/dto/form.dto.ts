import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsUUID, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class FormFieldDto {
    @IsString()
    type: string;

    @IsString()
    label: string;

    @IsString()
    @IsOptional()
    placeholder?: string;

    @IsBoolean()
    @IsOptional()
    required?: boolean;

    @IsObject()
    @IsOptional()
    options?: any;

    @IsString()
    @IsOptional()
    mapping?: string;
}

export class CreateFormDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    listId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FormFieldDto)
    fields: FormFieldDto[];

    @IsObject()
    @IsOptional()
    settings?: any;
}

export class UpdateFormDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FormFieldDto)
    fields?: FormFieldDto[];

    @IsObject()
    @IsOptional()
    settings?: any;
}

export class FormSubmissionDto {
    @IsObject()
    data: any;
}
