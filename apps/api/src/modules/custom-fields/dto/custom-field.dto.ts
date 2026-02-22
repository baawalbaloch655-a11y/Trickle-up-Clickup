import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CustomFieldType } from '@prisma/client';

export class CreateCustomFieldDto {
    @ApiProperty({ example: 'Story Points' })
    @IsString()
    name: string;

    @ApiProperty({ enum: CustomFieldType, example: 'NUMBER' })
    @IsEnum(CustomFieldType)
    type: CustomFieldType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    options?: Record<string, any>;
}

export class UpdateCustomFieldDto extends PartialType(CreateCustomFieldDto) { }

export class SetCustomFieldValueDto {
    @ApiProperty()
    @IsObject()
    value: Record<string, any> | string | number | boolean;
}
