import { IsString, IsOptional, IsBoolean, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class AutomationActionDto {
    @ApiProperty({ example: 'ASSIGN_USER' })
    @IsString()
    type: string;

    @ApiProperty()
    @IsObject()
    payload: Record<string, any>;
}

export class CreateAutomationRuleDto {
    @ApiProperty({ example: 'Auto-assign on priority change' })
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    listId?: string; // If null, applies to whole workspace/org

    @ApiProperty({ example: { type: 'STATUS_CHANGE', from: 'TODO', to: 'DONE' } })
    @IsObject()
    trigger: Record<string, any>;

    @ApiPropertyOptional({ example: { priority: 'HIGH' } })
    @IsOptional()
    @IsObject()
    conditions?: Record<string, any>;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ type: [AutomationActionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AutomationActionDto)
    actions: AutomationActionDto[];
}

export class UpdateAutomationRuleDto extends PartialType(CreateAutomationRuleDto) { }
